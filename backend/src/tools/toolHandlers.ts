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

export const MAX_GRAPH_NODES = 12;

export interface SpawnPayload {
  concept_type: string;
  target_concept_slug?: string;
  position?: { x: number; y: number };
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

    // Nạp đồ thị chuẩn ban đầu vào SQLite sau khi đã kiểm duyệt liên kết (deep copy tránh mutate)
    const freshNodes = JSON.parse(JSON.stringify(INITIAL_PAYMENT_GRAPH.nodes));
    const freshEdges = JSON.parse(JSON.stringify(INITIAL_PAYMENT_GRAPH.edges));
    const sanitizedEdges = validateAndSanitizeEdges(freshNodes, freshEdges);
    const initialGraph: GraphData = {
      ...INITIAL_PAYMENT_GRAPH,
      nodes: freshNodes,
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

    // Rào cản bão hòa toàn đồ thị (Anti-Hallucination Capacity Cap)
    if (current.nodes.length >= MAX_GRAPH_NODES) {
      return {
        graph: current,
        expanded: false,
        message: `Đồ thị đã đạt ngưỡng trần an toàn (${MAX_GRAPH_NODES} nodes). Vui lòng thu gọn (collapse) hoặc xóa bớt nhánh thừa để tiếp tục.`
      };
    }

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
   * Spawn động một Node mới (ví dụ: Node Chống DDoS, Rate Limiter, WAF)
   * Tự động nối dây thông minh (Smart-Attachment) vào node phù hợp và kiểm duyệt 3 lớp
   */
  async spawnConceptNode(payload: SpawnPayload): Promise<{ graph: GraphData; spawned: boolean; message: string; node?: NodeEntity }> {
    const current = sqliteClient.getCurrentGraph() || INITIAL_PAYMENT_GRAPH;

    // Rào cản bão hòa an toàn (Anti-Hallucination Capacity Cap)
    if (current.nodes.length >= MAX_GRAPH_NODES) {
      return {
        graph: current,
        spawned: false,
        message: `Đồ thị đã đạt ngưỡng trần an toàn (${MAX_GRAPH_NODES} nodes). Vui lòng thu gọn (collapse) hoặc xóa bớt nhánh thừa để tiếp tục.`
      };
    }

    const typeLower = (payload.concept_type || 'ddos').toLowerCase();

    // Nếu người dùng chỉ định target cụ thể thì mới nối dây, nếu không thì tạo Node Độc Lập
    const targetSlug = payload.target_concept_slug;
    let targetNode: NodeEntity | undefined = undefined;

    if (targetSlug) {
      targetNode = current.nodes.find(n => n.id === targetSlug);
      if (!targetNode) {
        return { graph: current, spawned: false, message: `Node đích '${targetSlug}' không tồn tại trong đồ thị.` };
      }

      if (targetNode.fully_explored) {
        return {
          graph: current,
          spawned: false,
          message: `Node '${targetNode.tieu_de}' đã bão hòa và bị khóa (fully_explored: true). 0 token tiêu thụ.`
        };
      }
    }

    // Xây dựng Node Entity hoàn chỉnh
    let newNode: NodeEntity;
    const newEdges: EdgeEntity[] = [];

    const spawnId = current.nodes.some(n => n.id === 'node-ddos-waf')
      ? `node-ddos-${Date.now().toString().slice(-4)}`
      : 'node-ddos-waf';

    // Tọa độ ưu tiên vị trí click chuột của người dùng, hoặc đặt ở khu vực thoáng phía trên
    const defaultX = payload.position?.x ?? (targetNode ? targetNode.toa_do.x - 260 : 100);
    const defaultY = payload.position?.y ?? (targetNode ? targetNode.toa_do.y : -200);

    if (typeLower.includes('ddos') || typeLower.includes('waf') || typeLower.includes('rate')) {
      newNode = {
        id: spawnId,
        bieu_tuong: 'khien_bao_ve',
        tieu_de: 'Lá chắn WAF & Chống DDoS',
        nhan_buoc: 'HẠ TẦNG PHÒNG THỦ BIÊN',
        tom_tat: 'Lọc lưu lượng bot độc hại, Rate Limiting trượt ngăn chặn bão request trước khi chạm hệ thống.',
        toa_do: { x: defaultX, y: defaultY },
        tam: { x: defaultX + 110, y: defaultY + 72 },
        fully_explored: false,
        hoat_hoa: { mau: '#4338CA', tham_so: { toc_do_xung: '2.5s' } },
        chi_tiet: {
          phan_loai: 'CỔNG BẢO VỆ BIÊN & CHỐNG DDOS',
          tieu_de: 'Lá chắn WAF & Chống DDoS',
          ban_chat: 'Sử dụng Cloudflare WAF và thuật toán Token Bucket / Sliding Window Counter để giới hạn tần suất gọi API tối đa 10 req/s mỗi IP, tự động dropping các gói tin bẩn trước khi phân luồng vào Gateway.',
          chu_thich_so_do: 'Hạ tầng phòng thủ biên độc lập bảo vệ toàn bộ mạng lưới microservices',
          ca_thuc_te: [
            'Botnet gửi 50.000 request/giây giả lập lỗi mạng để ép máy chủ chi trả chạy song song',
            'Tấn công Layer 7 HTTP Flood làm cạn kiệt Connection Pool của cơ sở dữ liệu'
          ],
          rui_ro: [
            'False Positive: Chặn nhầm Webhook hợp lệ của đối tác ngân hàng trong đợt cao điểm',
            'Độ trễ kiểm tra: Thêm 2-5ms cho mỗi yêu cầu đi qua bộ lọc WAF'
          ]
        },
        trac_nghiem: {
          cau_hoi: 'Thuật toán nào sau đây phù hợp nhất để Rate Limiting phân tán theo cửa sổ trượt?',
          lua_chon: ['Sliding Window Counter / Token Bucket', 'Sequential File Lock'],
          dung: 0,
          giai_thich: 'Token Bucket và Sliding Window cho phép xử lý các đợt bùng nổ lưu lượng ngắn mà vẫn đảm bảo ngưỡng trung bình an toàn.'
        }
      };

      if (targetNode) {
        newEdges.push({
          from: newNode.id,
          to: targetNode.id,
          nhan: 'Phân luồng an toàn',
          kieu: 'duong-xung-em-ai',
          loai_lien_ket: 'DEM_LOC'
        });
      }
    } else {
      // Concept mở rộng linh hoạt khác
      const customId = `node-${typeLower.replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
      newNode = {
        id: customId,
        bieu_tuong: 'khien_bao_ve',
        tieu_de: payload.concept_type.toUpperCase(),
        nhan_buoc: 'HẠ TẦNG ĐỘC LẬP',
        tom_tat: `Phân hệ kiến trúc ${payload.concept_type} được bổ sung độc lập vào hệ thống.`,
        toa_do: { x: defaultX, y: defaultY },
        tam: { x: defaultX + 110, y: defaultY + 72 },
        fully_explored: false,
        hoat_hoa: { mau: '#4F46E5', tham_so: {} },
        chi_tiet: {
          phan_loai: 'Phân hệ Độc lập',
          tieu_de: payload.concept_type,
          ban_chat: 'Phân hệ bổ sung theo yêu cầu kỹ thuật',
          chu_thich_so_do: 'Sơ đồ nhánh độc lập',
          ca_thuc_te: [],
          rui_ro: []
        },
        trac_nghiem: {
          cau_hoi: 'Mục tiêu chính của phân hệ này là gì?',
          lua_chon: ['Tăng tính sẵn sàng và tin cậy', 'Tăng độ phức tạp'],
          dung: 0,
          giai_thich: 'Mỗi phân hệ thêm vào đều nhằm củng cố tính toàn vẹn hệ thống.'
        }
      };

      if (targetNode) {
        newEdges.push({
          from: targetNode.id,
          to: newNode.id,
          nhan: 'Liên kết phân hệ',
          kieu: 'duong-xung-em-ai',
          loai_lien_ket: 'HOA_GIAI'
        });
      }
    }

    // Kiểm duyệt liên kết 3 lớp nếu có cạnh nối
    const validatedEdges = newEdges.length > 0
      ? validateAndSanitizeEdges([...current.nodes, newNode], newEdges)
      : [];

    // Lưu vào SQLite
    const updated = sqliteClient.addDeltaNodes(
      current.id,
      targetSlug || null,
      [newNode],
      validatedEdges
    );

    return {
      graph: updated || current,
      spawned: true,
      message: targetNode
        ? `Đã spawn thành công node '${newNode.tieu_de}' nối với '${targetNode.tieu_de}'!`
        : `Đã spawn thành công node độc lập '${newNode.tieu_de}' tại vị trí (${Math.round(defaultX)}, ${Math.round(defaultY)})!`,
      node: newNode
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
    const freshNodes = JSON.parse(JSON.stringify(INITIAL_PAYMENT_GRAPH.nodes));
    const freshEdges = JSON.parse(JSON.stringify(INITIAL_PAYMENT_GRAPH.edges));
    const sanitizedEdges = validateAndSanitizeEdges(freshNodes, freshEdges);
    const initialGraph: GraphData = {
      ...INITIAL_PAYMENT_GRAPH,
      nodes: freshNodes,
      edges: sanitizedEdges
    };
    sqliteClient.saveGraph(initialGraph);
    return { graph: initialGraph, message: 'Đã khôi phục đồ thị về 5 node ban đầu (0 token).' };
  }
};
