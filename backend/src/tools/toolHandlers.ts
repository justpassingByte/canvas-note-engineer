import { sqliteClient } from '../db/sqliteClient.js';
import { INITIAL_PAYMENT_GRAPH, DELTA_NODES_QUEUE_CACHE } from '../data/defaultGraph.js';
import { GraphData, NodeEntity, EdgeEntity, ExpandPayload, PrunePayload } from '../types/graphTypes.js';

/**
 * BỘ KIỂM DUYỆT LIÊN KẾT 3 LỚP (NGĂN CHẶN DEEPSEEK GEN LIÊN KẾT LOẠN XẠ)
 * 1. Chống tự trỏ (from !== to) & kiểm tra ID phải tồn tại
 * 2. Chống cạnh trùng lặp & chu trình đảo ngược trực tiếp (A -> B -> A)
 * 3. Chuẩn hóa nhãn và ép kiểu phân loại liên kết kiến trúc
 */
export function validateAndSanitizeEdges(allNodes: NodeEntity[], rawEdges: EdgeEntity[]): EdgeEntity[] {
  const nodeIds = new Set(allNodes.map(n => n.id));
  const seenEdges = new Set<string>();
  const sanitized: EdgeEntity[] = [];

  for (const edge of rawEdges) {
    // Lớp 1a: Chống tự trỏ vào chính mình
    if (edge.from === edge.to) {
      console.warn(`[Edge Validator] Bỏ qua cạnh tự trỏ: ${edge.from} -> ${edge.to}`);
      continue;
    }

    // Lớp 1b: Kiểm tra ID nguồn và đích có tồn tại trong tập node không
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      console.warn(`[Edge Validator] Bỏ qua cạnh có ID không hợp lệ: ${edge.from} -> ${edge.to}`);
      continue;
    }

    // Lớp 2a: Chống cạnh trùng lặp
    const edgeKey = `${edge.from}->${edge.to}`;
    if (seenEdges.has(edgeKey)) {
      continue;
    }

    // Lớp 2b: Chống chu trình đảo ngược trực tiếp A -> B -> A
    const reverseKey = `${edge.to}->${edge.from}`;
    if (seenEdges.has(reverseKey)) {
      console.warn(`[Edge Validator] Bỏ qua chu trình đảo ngược: ${edgeKey} vì đã có ${reverseKey}`);
      continue;
    }

    seenEdges.add(edgeKey);
    sanitized.push({
      ...edge,
      nhan: edge.nhan || 'Liên kết hệ thống',
      kieu: edge.kieu || 'duong-xung-em-ai',
      loai_lien_ket: edge.loai_lien_ket || 'HOA_GIAI'
    });
  }

  return sanitized;
}

export const toolHandlers = {
  /**
   * Tạo hoặc nạp đồ thị tri thức gốc (3-5 nodes)
   * Tự động kiểm tra Cache SQLite trước để đạt 0 token
   */
  async createKnowledgeGraph(topic?: string): Promise<{ graph: GraphData; from_cache: boolean }> {
    const existing = sqliteClient.getCurrentGraph();
    if (existing && (!topic || existing.topic.toLowerCase().includes(topic.toLowerCase()))) {
      return { graph: existing, from_cache: true };
    }

    // Nạp đồ thị chuẩn ban đầu vào SQLite sau khi đã kiểm duyệt liên kết
    const sanitizedEdges = validateAndSanitizeEdges(INITIAL_PAYMENT_GRAPH.nodes, INITIAL_PAYMENT_GRAPH.edges);
    const initialGraph: GraphData = {
      ...INITIAL_PAYMENT_GRAPH,
      edges: sanitizedEdges
    };

    sqliteClient.saveGraph(initialGraph);
    return { graph: initialGraph, from_cache: false };
  },

  /**
   * Mở rộng 1-2 node delta từ node mục tiêu
   * Tiết kiệm >90% token: chỉ sinh delta và gắn vào SQLite sau khi kiểm duyệt 3 lớp
   */
  async expandConceptNode(payload: ExpandPayload): Promise<{ graph: GraphData; expanded: boolean; message: string }> {
    const current = sqliteClient.getCurrentGraph() || INITIAL_PAYMENT_GRAPH;
    const targetNode = current.nodes.find(n => n.id === payload.target_concept_slug);

    if (!targetNode) {
      return { graph: current, expanded: false, message: `Node '${payload.target_concept_slug}' không tồn tại trong đồ thị.` };
    }

    if (targetNode.fully_explored) {
      return { graph: current, expanded: false, message: `Node '${targetNode.tieu_de}' đã được khai phá toàn bộ. 0 token tiêu thụ.` };
    }

    // Kiểm duyệt các cạnh delta trước khi gắn vào đồ thị
    const potentialNodes = [...current.nodes, ...DELTA_NODES_QUEUE_CACHE.nodes];
    const validatedDeltaEdges = validateAndSanitizeEdges(potentialNodes, DELTA_NODES_QUEUE_CACHE.edges);

    // Mở rộng delta nodes (Queue & Cache)
    const updated = sqliteClient.addDeltaNodes(
      current.id,
      payload.target_concept_slug,
      DELTA_NODES_QUEUE_CACHE.nodes,
      validatedDeltaEdges
    );

    return {
      graph: updated || current,
      expanded: true,
      message: `Đã mở rộng thành công 2 node con nối từ '${targetNode.tieu_de}'!`
    };
  },

  /**
   * Thu gọn (Collapse) hoặc Xóa vĩnh viễn (Delete) node/nhánh chống lộn xộn
   * 100% cục bộ, 0 token
   */
  async pruneKnowledgeGraph(payload: PrunePayload): Promise<{ graph: GraphData; success: boolean; message: string }> {
    const current = sqliteClient.getCurrentGraph() || INITIAL_PAYMENT_GRAPH;

    if (payload.action === 'collapse') {
      const updated = sqliteClient.updateNodeCollapse(current.id, payload.node_id, true);
      return {
        graph: updated || current,
        success: true,
        message: `Đã thu gọn các nhánh con của node '${payload.node_id}' (0 token).`
      };
    }

    if (payload.action === 'expand') {
      const updated = sqliteClient.updateNodeCollapse(current.id, payload.node_id, false);
      return {
        graph: updated || current,
        success: true,
        message: `Đã mở lại các nhánh con của node '${payload.node_id}' (0 token).`
      };
    }

    if (payload.action === 'delete_permanently') {
      const updated = sqliteClient.deleteNodePermanently(current.id, payload.node_id);
      return {
        graph: updated || current,
        success: true,
        message: `Đã xóa vĩnh viễn node '${payload.node_id}' và các đường nối mồ côi liên quan (0 token).`
      };
    }

    return { graph: current, success: false, message: 'Thao tác không hợp lệ.' };
  },

  /**
   * Khôi phục đồ thị về 5 node gốc ban đầu
   */
  async resetToRoot(): Promise<{ graph: GraphData; message: string }> {
    sqliteClient.saveGraph(INITIAL_PAYMENT_GRAPH);
    return { graph: INITIAL_PAYMENT_GRAPH, message: 'Đã khôi phục đồ thị về 5 node ban đầu (0 token).' };
  }
};
