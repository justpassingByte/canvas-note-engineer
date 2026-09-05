import React, { useRef, useState, useMemo } from 'react';
import { useGraphStore } from '../../store/useGraphStore.js';
import { ConceptNode } from '../NodePod/ConceptNode.js';
import { calculateEdgePath } from '../../utils/geometry.js';
import { computeClusters, TopicCluster } from '../../utils/clusterEngine.js';
import { FloatingToolbar } from '../Toolbar/FloatingToolbar.js';
import { TECHNICAL_DICTIONARY } from '../../dictionary/technicalDictionary.js';
import { NodeEntity, EdgeEntity } from '../../types/graphTypes.js';

function getEdgeKeywordTooltip(edge: any): string {
  const textToScan = `${edge.nhan} ${edge.giai_thich || ''}`.toLowerCase();
  for (const [key, def] of Object.entries(TECHNICAL_DICTIONARY)) {
    if (textToScan.includes(key.toLowerCase())) {
      return `${edge.nhan} [${key.toUpperCase()}]\n\n▸ Giải nghĩa kỹ thuật: ${def}${edge.giai_thich ? `\n\n▸ Bản chất luồng: ${edge.giai_thich}` : ''}`;
    }
  }
  if (edge.giai_thich) {
    return `${edge.nhan}\n\n▸ Bản chất luồng: ${edge.giai_thich}`;
  }
  return `${edge.nhan}\n\n(Click để xem chi tiết liên kết kiến trúc trong Field Notes)`;
}

export const SvgGridCanvas: React.FC = () => {
  const {
    graph,
    setGraph,
    selectedEdge,
    selectEdge,
    selectedNodeId,
    selectNode,
    deleteNode,
    toggleCollapse,
    isWhatBreaksActive,
    pan,
    zoom,
    setPan,
    setZoom,
    resetView,
    spawnNode,
    spawnCluster
  } = useGraphStore();

  const canvasRef = useRef<HTMLElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Quản lý kéo thả Cụm phân hệ (Cluster Drag & Drop + Persistence)
  const clusterDragRef = useRef<{
    clusterId: string;
    startMouseX: number;
    startMouseY: number;
    hasMoved: boolean;
    initialPositions: Map<string, { x: number; y: number }>;
  } | null>(null);
  const [isDraggingCluster, setIsDraggingCluster] = useState(false);

  // Quản lý kéo thả từng Node riêng lẻ (Node Drag & Drop + Persistence)
  const nodeDragRef = useRef<{
    nodeId: string;
    startMouseX: number;
    startMouseY: number;
    initialX: number;
    initialY: number;
    hasMoved: boolean;
  } | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  // Cờ phân biệt rõ ràng giữa Click và Kéo Thả (Drag vs Click Disambiguation)
  const wasJustDraggedRef = useRef(false);

  // Quản lý Menu ngữ cảnh động (Dynamic Context Menu)
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    clientX: number;
    clientY: number;
    graphX: number;
    graphY: number;
    targetNode?: NodeEntity;
  } | null>(null);

  // Tooltip tùy chỉnh cao cấp khi hover đường nối (Sleek Floating Edge Tooltip)
  const [hoveredEdge, setHoveredEdge] = useState<{
    edge: EdgeEntity;
    clientX: number;
    clientY: number;
    displayLabel: string;
    fromTitle: string;
    toTitle: string;
    explanation?: string;
  } | null>(null);

  // Lọc danh sách node hiển thị theo cơ chế DAG Liveness (Đồ thị có hướng đa cha)
  const visibleNodes = useMemo(() => {
    if (!graph) return [];
    const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));

    // Xây dựng tập hợp cha (Incoming Parents) từ các cạnh có hướng trong đồ thị
    const incomingParentsMap = new Map<string, string[]>();
    for (const edge of graph.edges) {
      if (!incomingParentsMap.has(edge.to)) {
        incomingParentsMap.set(edge.to, []);
      }
      if (!incomingParentsMap.get(edge.to)!.includes(edge.from)) {
        incomingParentsMap.get(edge.to)!.push(edge.from);
      }
    }

    // Bổ sung parent_id tường minh nếu chưa có trong edge
    for (const node of graph.nodes) {
      if (node.parent_id) {
        if (!incomingParentsMap.has(node.id)) {
          incomingParentsMap.set(node.id, []);
        }
        if (!incomingParentsMap.get(node.id)!.includes(node.parent_id)) {
          incomingParentsMap.get(node.id)!.push(node.parent_id);
        }
      }
    }

    // Quy tắc Đa Cha (Multi-Parent Collapse):
    // Cả 2 parent đều có toàn quyền thu gọn node con.
    // Nếu BẤT KỲ parent nào thu gọn (hoặc chuỗi tổ tiên thu gọn), node con sẽ lập tức được thu gọn theo!
    const isNodeCollapsedAway = (nodeId: string, visited = new Set<string>()): boolean => {
      if (visited.has(nodeId)) return false;
      visited.add(nodeId);

      const parents = incomingParentsMap.get(nodeId);
      if (!parents || parents.length === 0) {
        return false; // Root node không có cha thì không bị ẩn bởi collapse
      }

      return parents.some(parentId => {
        const parentNode = nodeMap.get(parentId);
        if (!parentNode) return false;
        if (parentNode.is_collapsed) return true;
        return isNodeCollapsedAway(parentId, new Set(visited));
      });
    };

    return graph.nodes.filter(node => {
      return !isNodeCollapsedAway(node.id);
    });
  }, [graph]);

  // Tính toán Cụm Topic tự động (0 token AI)
  const clusters = useMemo(() => computeClusters(visibleNodes), [visibleNodes]);
  const isMacroView = zoom < 0.65;
  const isDeepOverview = zoom < 0.35;

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);
  const nodeMap = useMemo(() => new Map(graph?.nodes.map(n => [n.id, n]) || []), [graph]);

  // Lọc danh sách edge hiển thị
  const visibleEdges = useMemo(() => {
    if (!graph) return [];
    return graph.edges.filter(edge => {
      return visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to);
    });
  }, [graph, visibleNodeIds]);

  // Tính toán đường đi lan truyền sự cố động (Dynamic DAG BFS Cascade Wave)
  const cascadeEdgeMap = useMemo(() => {
    const map = new Map<string, { depth: number; delay: number }>();
    if (!isWhatBreaksActive || !selectedNodeId || !graph) return map;

    const queue: Array<{ id: string; depth: number }> = [{ id: selectedNodeId, depth: 0 }];
    const visited = new Set<string>([selectedNodeId]);

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      for (const edge of visibleEdges) {
        if (edge.from === id) {
          const key = `${edge.from}->${edge.to}`;
          if (!map.has(key)) {
            map.set(key, { depth, delay: depth * 0.75 });
          }
          if (!visited.has(edge.to)) {
            visited.add(edge.to);
            queue.push({ id: edge.to, depth: depth + 1 });
          }
        }
      }
    }

    return map;
  }, [isWhatBreaksActive, selectedNodeId, graph, visibleEdges]);

  // Tính toán trước tọa độ và hình học của từng đường nối để tách biệt các lớp SVG
  const edgeGeometries = useMemo(() => {
    if (!graph) return [];
    return visibleEdges.map((edge, idx) => {
      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);
      if (!fromNode || !toNode) return null;

      const { pathD, midX, midY } = calculateEdgePath(fromNode, toNode);
      const isEdgeSelected = selectedEdge?.from === edge.from && selectedEdge?.to === edge.to;
      const cascadeInfo = cascadeEdgeMap.get(`${edge.from}->${edge.to}`);
      const isCascadeEdge = Boolean(cascadeInfo);
      const cascadeDelay = cascadeInfo?.delay ?? 0;

      // Tự động gắn ký hiệu chỉ hướng ➔ để người dùng luôn nhận biết rõ chiều luồng dữ liệu
      const directionLabel = edge.nhan.includes('➔') || edge.nhan.includes('->') ? edge.nhan : `${edge.nhan} ➔`;
      const displayLabel = directionLabel.length > 24 ? directionLabel.slice(0, 22) + '…' : directionLabel;
      const labelWidth = Math.min(Math.max(displayLabel.length * 7.5 + 24, 75), 190);
      const labelHeight = 22;

      return {
        edge,
        displayLabel,
        key: `${edge.from}-${edge.to}-${idx}`,
        pathD,
        midX,
        midY,
        labelWidth,
        labelHeight,
        isEdgeSelected,
        isCascadeEdge,
        cascadeDelay
      };
    }).filter(Boolean) as Array<{
      edge: (typeof visibleEdges)[0];
      key: string;
      displayLabel: string;
      pathD: string;
      midX: number;
      midY: number;
      labelWidth: number;
      labelHeight: number;
      isEdgeSelected: boolean;
      isCascadeEdge: boolean;
      cascadeDelay: number;
    }>;
  }, [visibleEdges, nodeMap, selectedEdge, cascadeEdgeMap]);

  // Điều hướng Camera mượt mà bay vào tâm cụm khi click (Click-to-Focus)
  const focusCluster = (cluster: TopicCluster) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const targetZoom = 1.0;
    const newPanX = rect.width / 2 - cluster.bounds.centerX * targetZoom;
    const newPanY = rect.height / 2 - cluster.bounds.centerY * targetZoom;
    setZoom(targetZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Khởi động kéo thả từng Node riêng lẻ
  const handleNodeDragStart = (e: React.MouseEvent, node: NodeEntity) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    nodeDragRef.current = {
      nodeId: node.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      initialX: node.toa_do.x,
      initialY: node.toa_do.y,
      hasMoved: false
    };
    setDraggingNodeId(node.id);
  };

  // Khởi động kéo thả Cụm phân hệ
  const handleClusterDragStart = (e: React.MouseEvent, cluster: TopicCluster) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    const initialPositions = new Map<string, { x: number; y: number }>();
    cluster.nodeIds.forEach(id => {
      const n = nodeMap.get(id);
      if (n) {
        initialPositions.set(id, { x: n.toa_do.x, y: n.toa_do.y });
      }
    });

    clusterDragRef.current = {
      clusterId: cluster.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      hasMoved: false,
      initialPositions
    };
    setIsDraggingCluster(true);
  };

  // Xử lý kéo rê chuột (Pan)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (contextMenu) setContextMenu(null);
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    // Không pan nếu đang bấm vào node, đường nối, button hoặc thẻ tiêu đề cụm
    if (
      target.closest('.cum-thuc-the') ||
      target.closest('.nhom-duong-noi-svg') ||
      target.closest('.nhom-nhan-svg') ||
      target.closest('button') ||
      target.closest('.the-tieu-de-cum')
    ) {
      return;
    }
    setIsPanning(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  // Menu chuột phải Động (Dynamic Context Menu)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement;

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    const graphX = Math.round((clientX - rect.left - pan.x) / zoom);
    const graphY = Math.round((clientY - rect.top - pan.y) / zoom);

    // Kiểm tra xem có click vào Node Card không
    const nodeEl = target.closest('.cum-thuc-the');
    let targetNode: NodeEntity | undefined = undefined;
    if (nodeEl && graph) {
      const nodeId = nodeEl.getAttribute('data-node-id');
      targetNode = graph.nodes.find(n => n.id === nodeId);
    }

    setContextMenu({
      visible: true,
      clientX,
      clientY,
      graphX,
      graphY,
      targetNode
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. Kéo thả từng Node riêng lẻ
    if (nodeDragRef.current && graph) {
      const { nodeId, startMouseX, startMouseY, initialX, initialY } = nodeDragRef.current;
      const dx = (e.clientX - startMouseX) / zoom;
      const dy = (e.clientY - startMouseY) / zoom;

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        nodeDragRef.current.hasMoved = true;
      }

      const newX = Math.round(initialX + dx);
      const newY = Math.round(initialY + dy);

      const updatedNodes = graph.nodes.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            toa_do: { x: newX, y: newY },
            tam: { x: newX + 110, y: newY + 72 }
          };
        }
        return n;
      });

      setGraph({ ...graph, nodes: updatedNodes });
      return;
    }

    // 2. Kéo thả Cụm phân hệ di chuyển đồng loạt các node bên trong
    if (clusterDragRef.current && graph) {
      const { startMouseX, startMouseY, initialPositions } = clusterDragRef.current;
      const dx = (e.clientX - startMouseX) / zoom;
      const dy = (e.clientY - startMouseY) / zoom;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        clusterDragRef.current.hasMoved = true;
      }

      const updatedNodes = graph.nodes.map(n => {
        const init = initialPositions.get(n.id);
        if (init) {
          const newX = Math.round(init.x + dx);
          const newY = Math.round(init.y + dy);
          return {
            ...n,
            toa_do: { x: newX, y: newY },
            tam: { x: newX + 110, y: newY + 72 }
          };
        }
        return n;
      });

      setGraph({ ...graph, nodes: updatedNodes });
      return;
    }

    // 2. Kéo rê Canvas (Pan)
    if (!isPanning) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    let didMove = false;

    // Lưu vị trí node đơn lẻ xuống SQLite khi buông chuột
    if (nodeDragRef.current) {
      if (nodeDragRef.current.hasMoved && graph) {
        didMove = true;
        const movedNode = graph.nodes.find(n => n.id === nodeDragRef.current?.nodeId);
        if (movedNode) {
          fetch('/api/graph/update-positions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ positions: [{ id: movedNode.id, x: movedNode.toa_do.x, y: movedNode.toa_do.y }] })
          }).catch(err => console.error('Lỗi khi lưu vị trí node:', err));
        }
      }
      nodeDragRef.current = null;
      setDraggingNodeId(null);
    }

    // Lưu vị trí cụm mới xuống SQLite khi buông chuột
    if (clusterDragRef.current) {
      if (clusterDragRef.current.hasMoved && graph) {
        didMove = true;
        const movedNodeIds = Array.from(clusterDragRef.current.initialPositions.keys());
        const positionsToSave = graph.nodes
          .filter(n => movedNodeIds.includes(n.id))
          .map(n => ({ id: n.id, x: n.toa_do.x, y: n.toa_do.y }));

        fetch('/api/graph/update-positions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ positions: positionsToSave })
        }).catch(err => console.error('Lỗi khi lưu vị trí cụm:', err));
      }
      clusterDragRef.current = null;
      setIsDraggingCluster(false);
    }

    if (didMove) {
      wasJustDraggedRef.current = true;
      setTimeout(() => {
        wasJustDraggedRef.current = false;
      }, 180);
    }

    setIsPanning(false);
  };

  // Xử lý lăn chuột Zoom mượt mà theo tâm con trỏ chuột
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    const nextZoom = Math.min(Math.max(zoom * factor, 0.25), 2.5);

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Giữ điểm dưới con trỏ chuột đứng yên khi zoom
    const newPanX = mouseX - (mouseX - pan.x) * (nextZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (nextZoom / zoom);

    setZoom(nextZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  if (!graph) return null;

  return (
    <section
      ref={canvasRef}
      className="mat-giay-caro khung-canvas"
      id="mat-giay"
      style={{
        backgroundPosition: `${pan.x}px ${pan.y}px`,
        backgroundSize: `${26 * zoom}px ${26 * zoom}px`,
        cursor: isPanning ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
    >
      {/* Thanh công cụ nổi được đóng gói bên trong Canvas, 100% không bao giờ đè lên Drawer */}
      <FloatingToolbar />

      {/* Vùng không gian đồ thị chuyển động theo Pan & Zoom */}
      <div
        className="the-gioi-do-thi"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      >
        {/* Lớp các Vùng Cụm Kiến trúc và Header Topic */}
        <div className="lop-cum-kien-truc" style={{ pointerEvents: 'none' }}>
          {clusters.map((cluster) => {
            const { bounds } = cluster;
            const isOuterCluster = cluster.cap_do === 'me';
            const isSubCluster = cluster.cap_do === 'con';

            // Ẩn tiêu đề cụm con khi zoom out sâu (< 35%) để góc nhìn toàn cảnh thoáng đãng
            const showHeader = !isDeepOverview || !isSubCluster;

            // Bù trừ động giữ kích thước chữ trên màn hình mắt người:
            // Cụm Lớn (Mẹ hoặc Độc lập): luôn đạt ~16.5px - 18px trên màn hình
            // Cụm Con: đạt ~12px khi zoom từ 35% trở lên
            let headerScale = 1.0;
            if (isOuterCluster || cluster.cap_do === 'doc_lap') {
              headerScale = zoom < 0.92 ? Math.min(Math.max(1.0, 1.1 / zoom), 4.4) : 1.0;
            } else if (isSubCluster) {
              headerScale = zoom < 0.92 ? Math.min(Math.max(1.0, 0.92 / zoom), 2.8) : 1.0;
            }
            const borderWidth = Math.max(1.5, Math.min(2 / zoom, 2.5));

            return (
              <div
                key={cluster.id}
                className={`khung-cum-chu-de ${isOuterCluster ? 'khung-cum-me' : isSubCluster ? 'khung-cum-con' : 'khung-cum-doc-lap'} ${isMacroView ? 'che-do-macro' : ''} ${isDeepOverview && isSubCluster ? 'tam-nhin-sau' : ''}`}
                style={{
                  position: 'absolute',
                  left: `${bounds.minX}px`,
                  top: `${bounds.minY}px`,
                  width: `${bounds.width}px`,
                  height: `${bounds.height}px`,
                  borderColor: cluster.mau,
                  borderWidth: isOuterCluster ? `${Math.max(2, Math.min(2.5 / zoom, 3))}px` : `${borderWidth}px`,
                  borderStyle: 'dashed',
                  backgroundColor: isOuterCluster
                    ? (isMacroView ? `${cluster.mau}0A` : `${cluster.mau}04`)
                    : (isMacroView ? `${cluster.mau}10` : `${cluster.mau}06`),
                  pointerEvents: isMacroView ? 'all' : 'none',
                  zIndex: isOuterCluster ? 1 : 2
                }}
                onClick={() => {
                  if (wasJustDraggedRef.current) return;
                  if (isMacroView) focusCluster(cluster);
                }}
                title={isMacroView ? `Bấm để phóng to vào cụm ${cluster.ten_cum}` : undefined}
              >
                {/* Thẻ Tiêu đề Cụm Topic - Có thể Kéo Thả (Drag & Drop) để sắp xếp vị trí cụm */}
                {showHeader && (
                  <div
                    className={`the-tieu-de-cum ${isOuterCluster ? 'tieu-de-cum-me' : isSubCluster ? 'tieu-de-cum-con' : 'tieu-de-cum-doc-lap'}`}
                    style={{
                      left: `${cluster.headerOffsetLeft || 16}px`,
                      borderColor: cluster.mau,
                      transform: `scale(${headerScale})`,
                      transformOrigin: 'top left',
                      pointerEvents: 'all',
                      cursor: isDraggingCluster ? 'grabbing' : 'grab'
                    }}
                    onMouseDown={(e) => handleClusterDragStart(e, cluster)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (wasJustDraggedRef.current) return;
                      focusCluster(cluster);
                    }}
                    title={`Kéo chuột để di chuyển cụm "${cluster.ten_cum}" | Click để căn giữa`}
                  >
                    <div className="cham-mau-cum" style={{ backgroundColor: cluster.mau }}></div>
                    <div className="noi-dung-chu-cum">
                      <span className="ten-topic-cum">⋮⋮ {cluster.ten_cum}</span>
                      {!isMacroView && (
                        <span className="mo-ta-phu-cum">{cluster.chu_de_phu}</span>
                      )}
                    </div>
                    {!isDeepOverview && (
                      <span className="dem-node-cum">{cluster.nodeIds.length} Nodes</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Lớp đường nối SVG */}
        <svg
          className="lop-duong-noi"
          id="svg-duong-noi"
          style={{ width: '4000px', height: '4000px', overflow: 'visible', pointerEvents: 'none' }}
        >
          <defs>
            <marker
              id="mui-ten-den"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#1A1D24" />
            </marker>
            <marker
              id="mui-ten-xanh"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#059669" />
            </marker>
            <marker
              id="mui-ten-tim"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#7C3AED" />
            </marker>
            <marker
              id="mui-ten-vang"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#D97706" />
            </marker>
            <marker
              id="mui-ten-do"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#DC2626" />
            </marker>
          </defs>

          {edgeGeometries.map((item) => {
            const fromNode = nodeMap.get(item.edge.from);
            const toNode = nodeMap.get(item.edge.to);

            const handleEdgeMouseEnter = (e: React.MouseEvent) => {
              setHoveredEdge({
                edge: item.edge,
                clientX: e.clientX,
                clientY: e.clientY,
                displayLabel: item.displayLabel,
                fromTitle: fromNode?.tieu_de || item.edge.from,
                toTitle: toNode?.tieu_de || item.edge.to,
                explanation: item.edge.giai_thich
              });
            };

            const handleEdgeMouseMove = (e: React.MouseEvent) => {
              setHoveredEdge(prev => prev ? { ...prev, clientX: e.clientX, clientY: e.clientY } : null);
            };

            const handleEdgeMouseLeave = () => {
              setHoveredEdge(null);
            };

            return (
              <g
                key={item.key}
                onClick={() => selectEdge(item.edge)}
                onMouseEnter={handleEdgeMouseEnter}
                onMouseMove={handleEdgeMouseMove}
                onMouseLeave={handleEdgeMouseLeave}
                style={{ cursor: 'pointer', pointerEvents: 'all' }}
                className="nhom-duong-noi-svg"
              >
                {/* Vùng đệm bắt sự kiện click và hover chuột rộng rãi (24px) */}
                <path
                  d={item.pathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={24}
                />
                {/* Đường nối nét chính */}
                <path
                  className="duong-noi-day"
                  d={item.pathD}
                  markerEnd={item.isEdgeSelected ? 'url(#mui-ten-vang)' : (item.isCascadeEdge ? 'url(#mui-ten-do)' : 'url(#mui-ten-den)')}
                  style={{
                    stroke: item.isEdgeSelected ? '#D97706' : (item.isCascadeEdge ? '#DC2626' : undefined),
                    strokeWidth: item.isEdgeSelected || item.isCascadeEdge ? 3 : undefined
                  }}
                />
                {/* Đường xung điện động nhịp thở */}
                <path
                  className={item.isCascadeEdge ? 'duong-xung-su-co' : item.edge.kieu}
                  d={item.pathD}
                />

                {/* Hạt Con Bọ (🐛 Bug Particle) bò dọc theo dây khi bật Failure Cascade */}
                {item.isCascadeEdge && (
                  <g key={`cascade-bug-${selectedNodeId}-${item.key}-${isWhatBreaksActive}`}>
                    <animateMotion
                      path={item.pathD}
                      dur="2.4s"
                      repeatCount="indefinite"
                      rotate="auto"
                      begin={`${item.cascadeDelay || 0}s`}
                    />
                    {/* Bug SVG sắc nét */}
                    <g transform="translate(-10, -10)">
                      {/* Vùng hào quang đỏ */}
                      <circle cx="10" cy="10" r="11" fill="#FEF2F2" stroke="#DC2626" strokeWidth="1.2" />
                      {/* Thân bọ */}
                      <ellipse cx="10" cy="10.5" rx="5" ry="5.5" fill="#DC2626" />
                      {/* Đầu bọ */}
                      <circle cx="10" cy="5.5" r="2.5" fill="#991B1B" />
                      {/* Chân bọ 2 bên */}
                      <path d="M5 8L2 7M5 11L1.5 11M5 14L2 15M15 8L18 7M15 11L18.5 11M15 14L18 15" stroke="#991B1B" strokeWidth="1.2" strokeLinecap="round" />
                      {/* Râu bọ */}
                      <path d="M9 3.5L7 1.5M11 3.5L13 1.5" stroke="#991B1B" strokeWidth="1" strokeLinecap="round" />
                      {/* Mắt bọ */}
                      <circle cx="8.8" cy="5" r="0.6" fill="#FFFFFF" />
                      <circle cx="11.2" cy="5" r="0.6" fill="#FFFFFF" />
                    </g>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Vùng chứa các node Concept (z-index: 5) */}
        <div className={`vung-chua-khoi ${isMacroView ? 'tam-nhin-macro' : ''}`} style={{ pointerEvents: 'none' }}>
          {visibleNodes.map(node => (
            <ConceptNode
              key={node.id}
              node={node}
              onNodeDragStart={handleNodeDragStart}
              isDragging={draggingNodeId === node.id}
            />
          ))}
        </div>

        {visibleNodes.length === 0 && (
          <div
            style={{
              position: 'absolute',
              left: '460px',
              top: '260px',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
              userSelect: 'none',
              fontFamily: "'JetBrains Mono', monospace",
              padding: '24px 32px',
              background: 'rgba(255, 255, 255, 0.85)',
              border: '2px dashed #9CA3AF',
              borderRadius: '12px'
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
              📐 Mặt Giấy Kỹ Sư Trống
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280', maxWidth: '380px', lineHeight: 1.5 }}>
              Nhấn <strong>RAG Brainstorm</strong> trên thanh công cụ hoặc <strong>Chuột phải</strong> lên mặt giấy để sinh Cụm Kiến trúc phân cấp mới.
            </div>
          </div>
        )}

        {/* Lớp Nhãn Mũi tên SVG Độc lập (z-index: 6) - 100% Nổi trên các Node và đường vẽ */}
        <svg
          className="lop-nhan-duong-noi"
          id="svg-nhan-duong-noi"
          style={{ width: '4000px', height: '4000px', overflow: 'visible', pointerEvents: 'none' }}
        >
          {edgeGeometries.map((item) => {
            const fromNode = nodeMap.get(item.edge.from);
            const toNode = nodeMap.get(item.edge.to);

            const handleLabelMouseEnter = (e: React.MouseEvent) => {
              setHoveredEdge({
                edge: item.edge,
                clientX: e.clientX,
                clientY: e.clientY,
                displayLabel: item.displayLabel,
                fromTitle: fromNode?.tieu_de || item.edge.from,
                toTitle: toNode?.tieu_de || item.edge.to,
                explanation: item.edge.giai_thich
              });
            };

            const handleLabelMouseMove = (e: React.MouseEvent) => {
              setHoveredEdge(prev => prev ? { ...prev, clientX: e.clientX, clientY: e.clientY } : null);
            };

            const handleLabelMouseLeave = () => {
              setHoveredEdge(null);
            };

            return (
              <g
                key={`label-${item.key}`}
                onClick={() => selectEdge(item.edge)}
                onMouseEnter={handleLabelMouseEnter}
                onMouseMove={handleLabelMouseMove}
                onMouseLeave={handleLabelMouseLeave}
                style={{ cursor: 'pointer', pointerEvents: 'all' }}
                className="nhom-nhan-svg"
              >
                {/* Hộp nhãn nền trắng đổ bóng co giãn tự động theo độ dài chữ */}
                <rect
                  className="hop-nhan-svg"
                  x={item.midX - item.labelWidth / 2}
                  y={item.midY - item.labelHeight / 2}
                  width={item.labelWidth}
                  height={item.labelHeight}
                  rx={6}
                  style={{
                    stroke: item.isEdgeSelected ? '#D97706' : (item.isCascadeEdge ? '#DC2626' : undefined),
                    strokeWidth: item.isEdgeSelected || item.isCascadeEdge ? 2 : 1.3
                  }}
                />
                <text
                  className="chu-nhan-svg"
                  x={item.midX}
                  y={item.midY}
                  style={{
                    fill: item.isEdgeSelected ? '#D97706' : (item.isCascadeEdge ? '#DC2626' : undefined),
                    fontWeight: item.isEdgeSelected || item.isCascadeEdge ? 700 : 600
                  }}
                >
                  {item.displayLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating Hover Card Cao Cấp Cho Đường Nối */}
      {hoveredEdge && (
        <div
          style={{
            position: 'fixed',
            left: `${Math.min(hoveredEdge.clientX + 14, window.innerWidth - 300)}px`,
            top: `${Math.min(hoveredEdge.clientY + 14, window.innerHeight - 160)}px`,
            zIndex: 99998,
            background: '#1A1D24',
            color: '#FAF7F0',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            padding: '8px 12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
            pointerEvents: 'none',
            fontFamily: "'JetBrains Mono', monospace",
            maxWidth: '280px',
            fontSize: '11px',
            lineHeight: 1.45
          }}
        >
          <div style={{ color: 'var(--vang-ky-thuat)', fontWeight: 800, fontSize: '9.5px', marginBottom: '2px' }}>
            LIÊN KẾT GIAO THỨC:
          </div>
          <div style={{ fontWeight: 700, color: '#FFFFFF', marginBottom: '3px' }}>
            {hoveredEdge.displayLabel}
          </div>
          <div style={{ color: '#9CA3AF', fontSize: '10px', marginBottom: '4px' }}>
            {hoveredEdge.fromTitle} ➔ {hoveredEdge.toTitle}
          </div>
          {hoveredEdge.explanation && (
            <div
              style={{ color: '#E5E7EB', fontSize: '10.5px', borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '5px', marginTop: '4px', lineHeight: 1.45 }}
              dangerouslySetInnerHTML={{
                __html: hoveredEdge.explanation
                  .split('<u').join('<span style="color: #FDE047; font-weight: 700; text-decoration: underline; text-decoration-style: dashed;"')
                  .split('</u>').join('</span>')
              }}
            />
          )}
          <div style={{ color: '#6B7280', fontSize: '9px', marginTop: '4px', fontStyle: 'italic' }}>
            (Click để mở chi tiết trong Field Notes)
          </div>
        </div>
      )}

      {/* Menu Chuột Phải Động (Dynamic Context Menu) - Tự thích ứng theo Node hoặc Vùng trống */}
      {contextMenu?.visible && (
        <div
          className="canvas-dynamic-context-menu"
          style={{
            position: 'fixed',
            left: `${Math.min(contextMenu.clientX, window.innerWidth - 250)}px`,
            top: `${Math.min(contextMenu.clientY, window.innerHeight - 280)}px`,
            zIndex: 99999,
            background: '#FFFFFF',
            border: '2px solid #1A1D24',
            borderRadius: '8px',
            boxShadow: '4px 4px 0px #1A1D24',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            minWidth: '230px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11.5px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.targetNode ? (
            <>
              {/* Menu theo ngữ cảnh Node được click */}
              <div style={{ padding: '6px 8px 4px', fontSize: '10px', fontWeight: 800, color: '#4F46E5', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>NODE:</span>
                <span style={{ color: '#1A1D24', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
                  {contextMenu.targetNode.tieu_de}
                </span>
              </div>
              <button
                className="context-menu-item"
                onClick={() => {
                  selectNode(contextMenu.targetNode!.id);
                  setContextMenu(null);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '4px', textAlign: 'left', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 600 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#EEF2FF')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>📖</span>
                <span>Mở Field Notes chi tiết</span>
              </button>
              <button
                className="context-menu-item"
                onClick={() => {
                  toggleCollapse(contextMenu.targetNode!.id);
                  setContextMenu(null);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '4px', textAlign: 'left', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 600 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>{contextMenu.targetNode.is_collapsed ? '▸' : '▾'}</span>
                <span>{contextMenu.targetNode.is_collapsed ? 'Mở các nhánh con' : 'Thu gọn các nhánh con'}</span>
              </button>
              <button
                className="context-menu-item"
                onClick={() => {
                  if (window.confirm(`Xóa vĩnh viễn '${contextMenu.targetNode!.tieu_de}' và các liên kết liên quan?`)) {
                    deleteNode(contextMenu.targetNode!.id);
                  }
                  setContextMenu(null);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '4px', textAlign: 'left', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 600, color: '#DC2626' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>🗑️</span>
                <span>Xóa node này</span>
              </button>
            </>
          ) : (
            <>
              {/* Menu theo ngữ cảnh Vùng trống Canvas */}
              <div style={{ padding: '6px 8px 4px', fontSize: '10px', fontWeight: 800, color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>
                VÙNG TRỐNG CANVAS ({contextMenu.graphX}, {contextMenu.graphY})
              </div>
              <button
                className="context-menu-item"
                onClick={() => {
                  const title = window.prompt('Nhập tên Concept kiến trúc cần tạo:');
                  if (title && title.trim()) {
                    spawnNode('custom', { x: contextMenu.graphX, y: contextMenu.graphY }, { title: title.trim() });
                  }
                  setContextMenu(null);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '4px', textAlign: 'left', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 600 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#EEF2FF')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>➕</span>
                <span>Thêm Concept tại đây...</span>
              </button>
              <button
                className="context-menu-item"
                onClick={() => {
                  const name = window.prompt('Nhập tên Cụm Phân Hệ kiến trúc mới:');
                  if (name && name.trim()) {
                    spawnCluster({
                      cluster_name: name.trim(),
                      position: { x: contextMenu.graphX, y: contextMenu.graphY },
                      nodes: [
                        { title: `${name.trim()} Ingress Gateway`, summary: `Cổng tiếp nhận của phân hệ ${name.trim()}` },
                        { title: `${name.trim()} Core Service`, summary: `Thành phần xử lý của phân hệ ${name.trim()}` }
                      ]
                    });
                  }
                  setContextMenu(null);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '4px', textAlign: 'left', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 600 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#ECFDF5')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>⚡</span>
                <span>Sinh Cụm Phân Hệ tại đây...</span>
              </button>
              <button
                className="context-menu-item"
                onClick={() => {
                  resetView();
                  setContextMenu(null);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '4px', textAlign: 'left', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 600 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>🎯</span>
                <span>Căn giữa toàn cảnh</span>
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
};


