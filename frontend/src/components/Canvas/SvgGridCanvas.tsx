import React, { useRef, useState, useMemo } from 'react';
import { useGraphStore } from '../../store/useGraphStore.js';
import { ConceptNode } from '../NodePod/ConceptNode.js';
import { calculateEdgePath } from '../../utils/geometry.js';
import { computeClusters, TopicCluster } from '../../utils/clusterEngine.js';
import { FloatingToolbar } from '../Toolbar/FloatingToolbar.js';
import { TECHNICAL_DICTIONARY } from '../../dictionary/technicalDictionary.js';

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
  return `${edge.nhan}\n\n(Click để xem chi tiết liên kết kiến trúc trong Sổ tay)`;
}

export const SvgGridCanvas: React.FC = () => {
  const {
    graph,
    isDomainLinkActive,
    selectedEdge,
    selectEdge,
    selectedNodeId,
    isWhatBreaksActive,
    pan,
    zoom,
    setPan,
    setZoom,
    spawnNode,
    spawnCluster
  } = useGraphStore();

  const canvasRef = useRef<HTMLElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    clientX: number;
    clientY: number;
    graphX: number;
    graphY: number;
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
      // Ẩn node TMĐT nếu công tắc liên kết miền đang TẮT
      if (node.id === 'node-tmdt' && !isDomainLinkActive) {
        return false;
      }

      return !isNodeCollapsedAway(node.id);
    });
  }, [graph, isDomainLinkActive]);

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
      if (edge.from === 'node-tmdt' && !isDomainLinkActive) {
        return false;
      }
      return visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to);
    });
  }, [graph, isDomainLinkActive, visibleNodeIds]);

  // Tính toán trước tọa độ và hình học của từng đường nối để tách biệt các lớp SVG
  const edgeGeometries = useMemo(() => {
    if (!graph) return [];
    return visibleEdges.map((edge, idx) => {
      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);
      if (!fromNode || !toNode) return null;

      const { pathD, midX, midY } = calculateEdgePath(fromNode, toNode);
      const isEdgeSelected = selectedEdge?.from === edge.from && selectedEdge?.to === edge.to;
      const isCascadeEdge = isWhatBreaksActive && (edge.from === selectedNodeId || edge.to === selectedNodeId);
      // Giới hạn nhãn hiển thị trên dây tối đa 22 ký tự để không đè lên các Node
      const displayLabel = edge.nhan.length > 22 ? edge.nhan.slice(0, 20) + '…' : edge.nhan;
      const labelWidth = Math.min(Math.max(displayLabel.length * 7.5 + 22, 70), 180);
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
        isCascadeEdge
      };
    }).filter(Boolean) as Array<{
      edge: (typeof visibleEdges)[0];
      key: string;
      pathD: string;
      midX: number;
      midY: number;
      labelWidth: number;
      labelHeight: number;
      isEdgeSelected: boolean;
      isCascadeEdge: boolean;
    }>;
  }, [visibleEdges, nodeMap, selectedEdge, isWhatBreaksActive, selectedNodeId]);

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

  // Xử lý kéo rê chuột (Pan)
  const handleMouseDown = (e: React.MouseEvent) => {
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
    if (contextMenu) setContextMenu(null);
    setIsPanning(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    if (target.closest('.cum-thuc-the') || target.closest('button') || target.closest('.khung-thanh-cong-cu')) {
      return;
    }

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const graphX = (clientX - rect.left - pan.x) / zoom;
    const graphY = (clientY - rect.top - pan.y) / zoom;

    setContextMenu({
      visible: true,
      clientX,
      clientY,
      graphX,
      graphY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
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
                onClick={() => isMacroView && focusCluster(cluster)}
                title={isMacroView ? `Bấm để phóng to vào cụm ${cluster.ten_cum}` : undefined}
              >
                {/* Thẻ Tiêu đề Cụm Topic */}
                {showHeader && (
                  <div
                    className={`the-tieu-de-cum ${isOuterCluster ? 'tieu-de-cum-me' : isSubCluster ? 'tieu-de-cum-con' : 'tieu-de-cum-doc-lap'}`}
                    style={{
                      left: `${cluster.headerOffsetLeft || 16}px`,
                      borderColor: cluster.mau,
                      transform: `scale(${headerScale})`,
                      transformOrigin: 'top left',
                      pointerEvents: 'all'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      focusCluster(cluster);
                    }}
                    title={`Bấm để phóng to vào ${cluster.ten_cum}`}
                  >
                    <div className="cham-mau-cum" style={{ backgroundColor: cluster.mau }}></div>
                    <div className="noi-dung-chu-cum">
                      <span className="ten-topic-cum">{cluster.ten_cum}</span>
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
          </defs>

          {edgeGeometries.map((item) => (
            <g
              key={item.key}
              onClick={() => selectEdge(item.edge)}
              style={{ cursor: 'pointer' }}
              className="nhom-duong-noi-svg"
            >
              <title>{getEdgeKeywordTooltip(item.edge)}</title>
              {/* Vùng đệm bắt sự kiện click chuột rộng hơn (20px) */}
              <path
                d={item.pathD}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
              />
              {/* Đường nối nét đen chính */}
              <path
                className="duong-noi-day"
                d={item.pathD}
                markerEnd={item.isEdgeSelected ? 'url(#mui-ten-vang)' : 'url(#mui-ten-den)'}
                style={{
                  stroke: item.isEdgeSelected ? '#D97706' : (item.isCascadeEdge ? '#DC2626' : undefined),
                  strokeWidth: item.isEdgeSelected || item.isCascadeEdge ? 3 : undefined
                }}
              />
              {/* Đường xung điện động nhịp thở 4.5s */}
              <path className={item.edge.kieu} d={item.pathD} />
            </g>
          ))}
        </svg>

        {/* Vùng chứa các node Concept (z-index: 5) */}
        <div className={`vung-chua-khoi ${isMacroView ? 'tam-nhin-macro' : ''}`} style={{ pointerEvents: 'none' }}>
          {visibleNodes.map(node => (
            <ConceptNode key={node.id} node={node} />
          ))}
        </div>

        {/* Lớp Nhãn Mũi tên SVG Độc lập (z-index: 6) - 100% Nổi trên các Node và đường vẽ */}
        <svg
          className="lop-nhan-duong-noi"
          id="svg-nhan-duong-noi"
          style={{ width: '4000px', height: '4000px', overflow: 'visible', pointerEvents: 'none' }}
        >
          {edgeGeometries.map((item) => (
            <g
              key={`label-${item.key}`}
              onClick={() => selectEdge(item.edge)}
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
              <title>{getEdgeKeywordTooltip(item.edge)}</title>
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
          ))}
        </svg>
      </div>

      {/* Popup Menu tạo nhanh khi Click Chuột Phải lên vùng trống của Canvas */}
      {contextMenu?.visible && (
        <div
          className="canvas-context-menu"
          style={{
            position: 'fixed',
            left: `${contextMenu.clientX}px`,
            top: `${contextMenu.clientY}px`,
            zIndex: 9999,
            background: '#FFFFFF',
            border: '2px solid #1A1D24',
            borderRadius: '8px',
            boxShadow: '4px 4px 0px #1A1D24',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            minWidth: '220px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* PHẦN 1: SINH CỤM PHÂN HỆ (PARALLEL CLUSTER SPAWNING) */}
          <div style={{ padding: '5px 8px 3px', fontSize: '10px', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ⚡ Sinh Cụm Phân Hệ
          </div>
          <button
            className="nut-spawn-cluster-waf"
            onClick={() => {
              spawnCluster({
                cluster_name: 'Phân Hệ WAF & Rate Limiting',
                cluster_theme: 'indigo',
                nodes: [
                  {
                    title: 'Lá chắn WAF & Chống DDoS',
                    role: 'EDGE_GATEWAY',
                    summary: 'Tường lửa L7 phát hiện tấn công dồn dập từ botnet và dội request ảo.',
                    schematic_template: 'zero_trust_pep'
                  },
                  {
                    title: 'Bộ lọc Rate Limiting Trượt',
                    role: 'RATE_LIMITER',
                    summary: 'Đếm tần suất request theo thuật toán Sliding Window trên RAM Redis.',
                    schematic_template: 'rate_limit_sliding'
                  }
                ],
                connect_to_shared_infra: ['cache', 'queue'],
                position: { x: contextMenu.graphX, y: contextMenu.graphY }
              });
              setContextMenu(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              border: 'none',
              background: 'transparent',
              fontFamily: 'JetBrains Mono',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '4px',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#EEF2FF')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span>🛡️</span>
            <span>Cụm WAF & Rate Limiting</span>
          </button>
          <button
            className="nut-spawn-cluster-zero-trust"
            onClick={() => {
              spawnCluster({
                cluster_name: 'Phân Hệ Zero-Trust Auth',
                cluster_theme: 'emerald',
                nodes: [
                  {
                    title: 'Cổng Zero-Trust Gateway',
                    role: 'EDGE_GATEWAY',
                    summary: 'Xác thực mTLS và giải mã Identity Token trước khi chuyển tiếp vào mạng nội bộ.',
                    schematic_template: 'zero_trust_pep'
                  },
                  {
                    title: 'Thẩm định Quyền PDP Server',
                    role: 'SECURITY_SHIELD',
                    summary: 'Đối chiếu quyền hạn RBAC/ABAC và kiểm tra Token Revocation List.',
                    schematic_template: 'zero_trust_pep'
                  }
                ],
                connect_to_shared_infra: ['cache', 'db'],
                position: { x: contextMenu.graphX, y: contextMenu.graphY }
              });
              setContextMenu(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              border: 'none',
              background: 'transparent',
              fontFamily: 'JetBrains Mono',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '4px',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#ECFDF5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span>🔐</span>
            <span>Cụm Xác Thực Zero-Trust</span>
          </button>
          <button
            className="nut-spawn-cluster-audit"
            onClick={() => {
              spawnCluster({
                cluster_name: 'Phân Hệ Sổ Cái Kiểm Toán',
                cluster_theme: 'amber',
                nodes: [
                  {
                    title: 'Nhật Ký Kiểm Toán Audit Log',
                    role: 'AUDIT_LOGGER',
                    summary: 'Bản ghi bất biến ghi vết các giao dịch tài chính.',
                    schematic_template: 'audit_hash_chain'
                  },
                  {
                    title: 'Kho Lưu Trữ Ký Số Merkle',
                    role: 'SECURITY_SHIELD',
                    summary: 'Mã hóa băm nhị phân Merkle Tree và ký số HMAC SHA-256 chống giả mạo.',
                    schematic_template: 'audit_hash_chain'
                  }
                ],
                connect_to_shared_infra: ['db'],
                position: { x: contextMenu.graphX, y: contextMenu.graphY }
              });
              setContextMenu(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              border: 'none',
              background: 'transparent',
              fontFamily: 'JetBrains Mono',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '4px',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF3C7')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span>📜</span>
            <span>Cụm Sổ Cái Kiểm Toán & Hash</span>
          </button>

          <div style={{ height: '1px', background: '#E5E7EB', margin: '4px 0' }} />

          {/* PHẦN 2: SINH NODE ĐƠN LẺ */}
          <div style={{ padding: '4px 8px 3px', fontSize: '10px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            + Sinh Node Đơn Lẻ
          </div>
          <button
            onClick={() => {
              spawnNode('ddos', { x: contextMenu.graphX, y: contextMenu.graphY });
              setContextMenu(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              border: 'none',
              background: 'transparent',
              fontFamily: 'JetBrains Mono',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '4px',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#EEF2FF')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span>🛡️</span>
            <span>Lá chắn WAF & Chống DDoS</span>
          </button>
          <button
            onClick={() => {
              spawnNode('cache', { x: contextMenu.graphX, y: contextMenu.graphY });
              setContextMenu(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              border: 'none',
              background: 'transparent',
              fontFamily: 'JetBrains Mono',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '4px',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF3C7')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span>⚡</span>
            <span>Khóa phân tán Redis Cache</span>
          </button>
          <button
            onClick={() => {
              spawnNode('queue', { x: contextMenu.graphX, y: contextMenu.graphY });
              setContextMenu(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              border: 'none',
              background: 'transparent',
              fontFamily: 'JetBrains Mono',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '4px',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#EFF6FF')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span>📥</span>
            <span>Hàng đợi Message Queue</span>
          </button>
          <button
            className="nut-spawn-audit"
            onClick={() => {
              spawnNode('audit_log', { x: contextMenu.graphX, y: contextMenu.graphY });
              setContextMenu(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              border: 'none',
              background: 'transparent',
              fontFamily: 'JetBrains Mono',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '4px',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#ECFDF5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span>📜</span>
            <span>Nhật ký Kiểm toán Audit Log</span>
          </button>
          <div style={{ height: '1px', background: '#E5E7EB', margin: '3px 0' }} />
          <button
            className="nut-spawn-custom"
            onClick={() => {
              const customTopic = window.prompt('Nhập tên chủ đề kiến trúc mới cần spawn:', 'Elasticsearch Cluster');
              if (customTopic && customTopic.trim()) {
                spawnNode(customTopic.trim().toLowerCase().replace(/\s+/g, '_'), { x: contextMenu.graphX, y: contextMenu.graphY }, {
                  title: customTopic.trim()
                });
              }
              setContextMenu(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              border: 'none',
              background: 'transparent',
              fontFamily: 'JetBrains Mono',
              fontSize: '12px',
              fontWeight: 600,
              color: '#4F46E5',
              cursor: 'pointer',
              borderRadius: '4px',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#EEF2FF')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span>➕</span>
            <span>Nhập chủ đề tùy chỉnh...</span>
          </button>
        </div>
      )}
    </section>
  );
};


