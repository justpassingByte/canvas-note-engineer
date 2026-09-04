import React, { useRef, useState, useMemo } from 'react';
import { useGraphStore } from '../../store/useGraphStore.js';
import { ConceptNode } from '../NodePod/ConceptNode.js';
import { calculateEdgePath } from '../../utils/geometry.js';
import { computeClusters, TopicCluster } from '../../utils/clusterEngine.js';
import { FloatingToolbar } from '../Toolbar/FloatingToolbar.js';

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
    setZoom
  } = useGraphStore();

  const canvasRef = useRef<HTMLElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Lọc danh sách node hiển thị trong useMemo để tuân thủ quy tắc React Hooks
  const visibleNodes = useMemo(() => {
    if (!graph) return [];
    return graph.nodes.filter(node => {
      if (!node.parent_id) return true;
      const parent = graph.nodes.find(n => n.id === node.parent_id);
      return parent ? !parent.is_collapsed : true;
    });
  }, [graph]);

  // Tính toán Cụm Topic tự động (0 token AI)
  const clusters = useMemo(() => computeClusters(visibleNodes), [visibleNodes]);
  const isMacroView = zoom < 0.65;

  if (!graph) return null;

  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
  const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));

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

  // Lọc danh sách edge hiển thị
  const visibleEdges = graph.edges.filter(edge => {
    // Nếu là edge liên kết miền TMĐT mà toggle đang TẮT thì ẩn
    if (edge.from === 'node-tmdt' && !isDomainLinkActive) {
      return false;
    }
    return visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to);
  });

  // Xử lý kéo rê chuột (Pan)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    // Không pan nếu đang bấm vào node, đường nối, button hoặc thẻ tiêu đề cụm
    if (
      target.closest('.cum-thuc-the') ||
      target.closest('.nhom-duong-noi-svg') ||
      target.closest('button') ||
      target.closest('.the-tieu-de-cum')
    ) {
      return;
    }
    setIsPanning(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
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
            // Giữ kích thước thẻ Tiêu đề ổn định vừa mắt trên màn hình (~1.0x chuẩn, không bị phình to)
            const headerScale = zoom < 0.85 ? Math.min(1.05 / zoom, 2.0) : 1.0;
            const borderWidth = Math.max(1.5, Math.min(2 / zoom, 3));

            return (
              <div
                key={cluster.id}
                className={`khung-cum-chu-de ${isMacroView ? 'che-do-macro' : ''}`}
                style={{
                  position: 'absolute',
                  left: `${bounds.minX}px`,
                  top: `${bounds.minY}px`,
                  width: `${bounds.width}px`,
                  height: `${bounds.height}px`,
                  borderColor: cluster.mau,
                  borderWidth: `${borderWidth}px`,
                  backgroundColor: isMacroView ? `${cluster.mau}10` : `${cluster.mau}06`,
                  pointerEvents: isMacroView ? 'all' : 'none'
                }}
                onClick={() => isMacroView && focusCluster(cluster)}
                title={isMacroView ? `Bấm để phóng to vào cụm ${cluster.ten_cum}` : undefined}
              >
                {/* Thẻ Tiêu đề Cụm Topic */}
                <div
                  className="the-tieu-de-cum"
                  style={{
                    borderColor: cluster.mau,
                    transform: `scale(${headerScale})`,
                    transformOrigin: 'top left',
                    pointerEvents: 'all'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    focusCluster(cluster);
                  }}
                  title={`Bấm để phóng to vào cụm ${cluster.ten_cum}`}
                >
                  <div className="cham-mau-cum" style={{ backgroundColor: cluster.mau }}></div>
                  <div className="noi-dung-chu-cum">
                    <span className="ten-topic-cum">{cluster.ten_cum}</span>
                    <span className="mo-ta-phu-cum">{cluster.chu_de_phu}</span>
                  </div>
                  <span className="dem-node-cum">{cluster.nodeIds.length} Nodes</span>
                </div>
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

          {visibleEdges.map((edge, idx) => {
            const fromNode = nodeMap.get(edge.from);
            const toNode = nodeMap.get(edge.to);
            if (!fromNode || !toNode) return null;

            // Tính toán cổng cắm và đường cong Cubic Bezier tự động 100%
            const { pathD, midX, midY } = calculateEdgePath(fromNode, toNode);
            const isEdgeSelected = selectedEdge?.from === edge.from && selectedEdge?.to === edge.to;
            const isCascadeEdge = isWhatBreaksActive && (edge.from === selectedNodeId || edge.to === selectedNodeId);

            return (
              <g
                key={`${edge.from}-${edge.to}-${idx}`}
                onClick={() => selectEdge(edge)}
                style={{ cursor: 'pointer' }}
                className="nhom-duong-noi-svg"
              >
                {/* Vùng đệm bắt sự kiện click chuột rộng hơn (20px) */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={20}
                />
                {/* Đường nối nét đen chính */}
                <path
                  className="duong-noi-day"
                  d={pathD}
                  markerEnd={isEdgeSelected ? 'url(#mui-ten-vang)' : 'url(#mui-ten-den)'}
                  style={{
                    stroke: isEdgeSelected ? '#D97706' : (isCascadeEdge ? '#DC2626' : undefined),
                    strokeWidth: isEdgeSelected || isCascadeEdge ? 3 : undefined
                  }}
                />
                {/* Đường xung điện động nhịp thở 4.5s */}
                <path className={edge.kieu} d={pathD} />
                {/* Hộp nhãn giải thích luồng định vị chính xác tại tâm Bezier t=0.5 */}
                <rect
                  className="hop-nhan-svg"
                  x={midX - 65}
                  y={midY - 12}
                  width={130}
                  height={24}
                  style={{
                    stroke: isEdgeSelected ? '#D97706' : (isCascadeEdge ? '#DC2626' : undefined),
                    strokeWidth: isEdgeSelected || isCascadeEdge ? 2 : 1
                  }}
                />
                <text
                  className="chu-nhan-svg"
                  x={midX}
                  y={midY + 2}
                  style={{
                    fill: isEdgeSelected ? '#D97706' : (isCascadeEdge ? '#DC2626' : undefined),
                    fontWeight: isEdgeSelected || isCascadeEdge ? 600 : 500
                  }}
                >
                  {edge.nhan}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Vùng chứa các node Concept */}
        <div className={`vung-chua-khoi ${isMacroView ? 'tam-nhin-macro' : ''}`} style={{ pointerEvents: 'none' }}>
          {visibleNodes.map(node => (
            <ConceptNode key={node.id} node={node} />
          ))}
        </div>
      </div>
    </section>
  );
};


