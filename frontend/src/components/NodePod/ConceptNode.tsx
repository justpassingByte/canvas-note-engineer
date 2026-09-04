import React from 'react';
import { NodeEntity } from '../../types/graphTypes.js';
import { LucideIconPod } from './LucideIconPod.js';
import { useGraphStore } from '../../store/useGraphStore.js';
import { enrichHtmlWithTooltips } from '../../dictionary/technicalDictionary.js';

interface ConceptNodeProps {
  node: NodeEntity;
}

export const ConceptNode: React.FC<ConceptNodeProps> = ({ node }) => {
  const {
    selectedNodeId,
    selectNode,
    expandNode,
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

  // Đếm toàn bộ số lượng node hậu duệ phân cấp (0 token)
  const countAllDescendants = (nodeId: string): number => {
    if (!graph) return 0;
    const directChildren = graph.nodes.filter(n => n.parent_id === nodeId);
    let count = directChildren.length;
    for (const child of directChildren) {
      count += countAllDescendants(child.id);
    }
    return count;
  };

  const totalDescendants = countAllDescendants(node.id);
  const hasChildren = totalDescendants > 0;
  const isCollapsed = node.is_collapsed || false;

  const handleNodeClick = () => {
    if (isMaskedInRecall) {
      revealRecallNode(node.id);
      return;
    }
    // 100% CHỈ mở Drawer và highlight node (0 token, 0 độ trễ)
    selectNode(node.id);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.fully_explored) {
      alert(`Node '${node.tieu_de}' đã được khai phá toàn bộ. Không tốn thêm token nào!`);
      return;
    }
    expandNode(node.id);
  };

  const handleCollapseClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 100% cục bộ trên client (0 token)
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
      className={`cum-thuc-the ${isSelected ? 'dang-chon' : ''} ${!isSearchMatch ? 'mo-nhat' : ''} ${isSearchMatch && searchQuery ? 'khop-tim-kiem' : ''} ${isCascadeAffected ? 'canh-bao-sup-do' : ''}`}
      style={{ top: `${node.toa_do.y}px`, left: `${node.toa_do.x}px` }}
      onClick={handleNodeClick}
    >
      <div className="hop-icon-pod-wrap">
        <div className={`hop-icon-pod ${getPodVariantClass()}`}>
          <LucideIconPod type={node.bieu_tuong} />
        </div>

        {/* Nút mở rộng [+] hoặc [✓] đính trên góc Icon Pod */}
        <button
          className={`nut-mo-rong-pod ${node.fully_explored ? 'da-kham-pha' : ''}`}
          onClick={handleExpandClick}
          title={node.fully_explored ? 'Đã khai phá toàn bộ' : 'Mở rộng nhánh mới bằng AI'}
        >
          {node.fully_explored ? '✓' : '+'}
        </button>

        {/* Huy hiệu Thu gọn / Bung ra nếu node có nhánh con */}
        {hasChildren && (
          <button
            className={`badge-thu-gon ${isCollapsed ? 'dang-dong' : ''}`}
            onClick={handleCollapseClick}
            title={
              isCollapsed
                ? `Bung mở lớp tiếp theo (+${totalDescendants} nodes)`
                : `Thu gọn toàn bộ nhánh hậu duệ (-${totalDescendants} nodes)`
            }
          >
            {isCollapsed ? `+${totalDescendants}` : `-${totalDescendants}`}
          </button>
        )}
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
      </div>
    </div>
  );
};

