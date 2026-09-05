import React from 'react';
import { NodeEntity } from '../../types/graphTypes.js';
import { LucideIconPod } from './LucideIconPod.js';
import { useGraphStore } from '../../store/useGraphStore.js';
import { enrichHtmlWithTooltips } from '../../dictionary/technicalDictionary.js';

interface ConceptNodeProps {
  node: NodeEntity;
  onNodeDragStart?: (e: React.MouseEvent, node: NodeEntity) => void;
  isDragging?: boolean;
}

export const ConceptNode: React.FC<ConceptNodeProps> = ({ node, onNodeDragStart, isDragging }) => {
  const {
    selectedNodeId,
    selectNode,
    toggleCollapse,
    graph,
    searchQuery,
    isRecallMode,
    revealedRecallNodes,
    revealRecallNode,
    isWhatBreaksActive
  } = useGraphStore();

  const isSelected = node.id === selectedNodeId;

  // Tìm các cạnh liên quan đến node đang được chọn nếu đang bật chế độ "Điều gì sụp đổ"
  const isCascadeAffected = isWhatBreaksActive && (
    node.id === selectedNodeId ||
    graph?.edges.some(e => (e.from === selectedNodeId && e.to === node.id) || (e.to === selectedNodeId && e.from === node.id))
  );

  // Tìm kiếm
  const isSearchMatch = !searchQuery || (
    node.tieu_de.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.tom_tat.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.chi_tiet.ban_chat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Chế độ ôn tập: ẩn tiêu đề thành [ ? ] nếu chưa mở
  const isMaskedInRecall = isRecallMode && !revealedRecallNodes.includes(node.id);

  // Đếm toàn bộ số lượng node hậu duệ phân cấp trong đồ thị DAG
  const allDescendantsSet = React.useMemo(() => {
    if (!graph) return new Set<string>();
    const visited = new Set<string>();

    const traverse = (currId: string) => {
      const children = graph.nodes.filter(
        n => (n.parent_id === currId || graph.edges.some(e => e.from === currId && e.to === n.id)) && n.id !== currId
      );
      for (const child of children) {
        if (!visited.has(child.id)) {
          visited.add(child.id);
          traverse(child.id);
        }
      }
    };

    traverse(node.id);
    return visited;
  }, [graph, node.id]);

  const totalDescendants = allDescendantsSet.size;
  const hasChildren = totalDescendants > 0;
  const isCollapsed = node.is_collapsed || false;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.chan-the-thu-gon')) return;
    onNodeDragStart?.(e, node);
  };

  const handleNodeClick = (e: React.MouseEvent) => {
    if (isMaskedInRecall) {
      revealRecallNode(node.id);
      return;
    }
    selectNode(node.id);
  };

  const handleCollapseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCollapse(node.id);
  };

  // Xác định class màu cho Icon Pod
  const getPodVariantClass = () => {
    switch (node.bieu_tuong) {
      case 'su_co_canh_bao': return 'su-co';
      case 'tranh_chap_phan_nhanh': return 'tranh-chap';
      case 'khien_bao_ve': return 'khien';
      case 'khoi_tru_database': return 'database';
      case 'hop_kien_hang_domain': return 'tmdt';
      case 'hang_doi_message_queue': return 'hang-doi';
      case 'bo_nho_dem_cache': return 'cache';
      default: return 'khien';
    }
  };

  return (
    <div
      className={`cum-thuc-the ${isSelected ? 'dang-chon' : ''} ${!isSearchMatch ? 'mo-nhat' : ''} ${isSearchMatch && searchQuery ? 'khop-tim-kiem' : ''} ${isCascadeAffected ? 'canh-bao-sup-do' : ''} ${isDragging ? 'dang-keo-node' : ''}`}
      style={{
        top: `${node.toa_do.y}px`,
        left: `${node.toa_do.x}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 50 : (isSelected ? 10 : 5)
      }}
      data-node-id={node.id}
      onMouseDown={handleMouseDown}
      onClick={handleNodeClick}
      title="Kéo chuột để di chuyển node | Click để mở sổ tay kỹ thuật"
    >
      <div className="hop-icon-pod-wrap">
        <div className={`hop-icon-pod ${getPodVariantClass()}`}>
          <LucideIconPod type={node.bieu_tuong} />
        </div>
      </div>

      <div className="the-nhan-duoi">
        <div className="nhan-buoc">{node.nhan_buoc}</div>
        <div className="nhan-tieu-de-khoi">
          {isMaskedInRecall ? (
            <span style={{ color: 'var(--vang-ky-thuat)', fontStyle: 'italic', cursor: 'pointer' }}>
              [ ? ] Bấm để nhớ lại
            </span>
          ) : (
            node.tieu_de
          )}
        </div>
        {!isMaskedInRecall && (
          <div
            className="nhan-tom-tat"
            dangerouslySetInnerHTML={{ __html: enrichHtmlWithTooltips(node.tom_tat) }}
          />
        )}

        {/* Thanh Trạng Thái Thu Gọn (Collapse Pill) */}
        {hasChildren && (
          <div className="chan-the-thu-gon">
            <button
              className={`nut-thu-gon-pill ${isCollapsed ? 'dang-thu-gon' : 'dang-mo'}`}
              onClick={handleCollapseClick}
              title={
                isCollapsed
                  ? `Bấm để mở hiển thị ${totalDescendants} node con`
                  : `Bấm để ẩn ${totalDescendants} node con`
              }
            >
              <span className="icon-mui-ten-pill">{isCollapsed ? '▸' : '▾'}</span>
              <span className="chu-thu-gon-pill">
                {isCollapsed ? `Mở ${totalDescendants} node con` : `Thu gọn (${totalDescendants})`}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
