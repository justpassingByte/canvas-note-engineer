import { sqliteClient } from '../db/sqliteClient.js';
import { INITIAL_PAYMENT_GRAPH, DELTA_NODES_QUEUE_CACHE } from '../data/defaultGraph.js';
import {
  GraphData,
  NodeEntity,
  EdgeEntity,
  ExpandPayload,
  PrunePayload,
  SpawnClusterPayload,
  CompactSubCluster,
  ReflexQuizItem,
  IncidentDossier
} from '../types/graphTypes.js';

export function generate5StepReflexDrill(title: string, summary: string, clusterName: string): ReflexQuizItem[] {
  const tLower = title.toLowerCase();

  return [
    {
      cau_hoi: `Nguyên tắc kiến trúc cốt lõi (Architectural Invariance) của '${title}' là gì?`,
      lua_chon: [
        `Đảm bảo tính toàn vẹn và thực thi đúng vai trò ${summary.slice(0, 48)}...`,
        'Bỏ qua các bước kiểm tra xác thực để tối đa hóa thông lượng'
      ],
      dung: 0,
      giai_thich: `Thành phần ${title} bắt buộc phải duy trì tính toàn vẹn kiến trúc của phân hệ ${clusterName}.`,
      phan_tang: 'Kiến trúc cốt lõi'
    },
    {
      cau_hoi: `Trong kịch bản lưu lượng bùng phát (High Concurrency 50k req/s), nguy cơ lớn nhất tại '${title}' là gì?`,
      lua_chon: [
        'Nghẽn cổ chai tài nguyên (CPU/RAM/Socket) làm tăng P99 Latency vượt ngưỡng timeout',
        'Hệ thống tự động sinh thêm CPU vật lý mà không tốn chi phí'
      ],
      dung: 0,
      giai_thich: 'Tải đột biến sẽ làm dồn ứ hàng đợi và cạn kiệt Connection Pool nếu không có cơ chế Rate Limiting hoặc Buffering.',
      phan_tang: 'Tương tranh cao điểm'
    },
    {
      cau_hoi: `Nếu '${title}' gặp sự cố dừng hoạt động, hiệu ứng lan truyền (Failure Cascade & Blast Radius) xảy ra như thế nào?`,
      lua_chon: [
        `Các dịch vụ phụ thuộc phía sau bị dồn ứ, kéo sập dây chuyền toàn bộ phân hệ ${clusterName}`,
        'Toàn bộ mạng Internet toàn cầu tự động ngắt kết nối'
      ],
      dung: 0,
      giai_thich: 'Lỗi tại một thành phần trọng yếu sẽ lan truyền sang các client phụ thuộc nếu thiếu Circuit Breaker.',
      phan_tang: 'Lan truyền sự cố'
    },
    {
      cau_hoi: `Đánh đổi kỹ thuật (Trade-off) quan trọng nhất khi vận hành '${title}' là gì?`,
      lua_chon: [
        'Cân bằng giữa Tính nhất quán dữ liệu (Consistency) và Độ trễ phản hồi (Low Latency)',
        'Không có bất kỳ đánh đổi nào, mọi thứ đều hoàn hảo tuyệt đối'
      ],
      dung: 0,
      giai_thich: 'Theo định lý CAP và nguyên lý hệ thống phân tán, tăng cường bảo vệ và kiểm tra luôn đi kèm chi phí độ trễ xử lý.',
      phan_tang: 'Đánh đổi kỹ thuật'
    },
    {
      cau_hoi: `Chỉ số SRE Observability quan trọng nhất cần giám sát thời gian thực cho '${title}' là gì?`,
      lua_chon: [
        'Tỷ lệ lỗi (Error Rate 5xx), P99 Latency và Trạng thái bão hòa tài nguyên (Resource Saturation)',
        'Số lượng dòng code của file nguồn'
      ],
      dung: 0,
      giai_thich: 'Phương pháp Golden Signals của Google SRE yêu cầu giám sát 4 chỉ số vàng: Latency, Traffic, Errors, Saturation.',
      phan_tang: 'Vận hành & Giám sát'
    }
  ];
}


export const MAX_GRAPH_NODES = 36;

/**
 * Chuẩn hóa nhãn phân tầng kiến trúc (Architectural Layer Standard)
 * CẤM tiền tố số thứ tự (BƯỚC 1 //, BƯỚC 2 //, Step 1:, ...)
 * Đảm bảo mọi Agent khi sinh ra node mới đều tuân thủ phân tầng chuẩn.
 */
export function sanitizeNodeLayerLabel(rawLabel?: string, contextHint?: string): string {
  if (!rawLabel && !contextHint) return 'ARCHITECTURE / COMPONENT';

  let cleaned = (rawLabel || '').trim();

  // 1. Gỡ bỏ mọi tiền tố số bước
  cleaned = cleaned.replace(/^(bước|buoc|step)\s*[\d\.]+\s*(\/{2}|:|-)?\s*/i, '');
  cleaned = cleaned.replace(/^[\d\.]+\s*(\/{2}|:|-)\s*/i, '');
  cleaned = cleaned.trim();

  // 2. Nhận diện các phân tầng kiến trúc cốt lõi nếu nhãn rỗng hoặc chứa từ khóa
  const textToCheck = `${cleaned} ${contextHint || ''}`.toLowerCase();

  if (textToCheck.includes('gateway') || textToCheck.includes('ingress') || textToCheck.includes('webhook') || textToCheck.includes('sự cố')) {
    if (!cleaned || cleaned.toLowerCase().includes('sự cố')) return 'GATEWAY / INGRESS';
  }
  if (textToCheck.includes('concurrency') || textToCheck.includes('tranh chấp') || textToCheck.includes('xung đột') || textToCheck.includes('race')) {
    return 'COMPUTE / CONCURRENCY';
  }
  if (textToCheck.includes('idempotency') || textToCheck.includes('khiên') || textToCheck.includes('khóa định danh')) {
    return 'SECURITY / IDEMPOTENCY';
  }
  if (textToCheck.includes('acid') || textToCheck.includes('database') || textToCheck.includes('cơ sở dữ liệu') || textToCheck.includes('row lock')) {
    return 'STORAGE / ACID DB';
  }
  if (textToCheck.includes('queue') || textToCheck.includes('hàng đợi') || textToCheck.includes('băng chuyền') || textToCheck.includes('buffer')) {
    return 'ASYNC / QUEUE BUFFER';
  }
  if (textToCheck.includes('cache') || textToCheck.includes('redis') || textToCheck.includes('distributed lock') || textToCheck.includes('setnx')) {
    return 'CACHE / DISTRIBUTED LOCK';
  }
  if (textToCheck.includes('ddos') || textToCheck.includes('waf') || textToCheck.includes('rate limit') || textToCheck.includes('tần suất')) {
    return 'EDGE / WAF RATE LIMIT';
  }
  if (textToCheck.includes('zero trust') || textToCheck.includes('zero-trust') || textToCheck.includes('pep') || textToCheck.includes('pdp') || textToCheck.includes('mtls')) {
    return 'SECURITY / ZERO-TRUST';
  }
  if (textToCheck.includes('audit') || textToCheck.includes('kiểm toán') || textToCheck.includes('log') || textToCheck.includes('đối soát')) {
    return 'OBSERVABILITY / AUDIT LOG';
  }
  if (textToCheck.includes('flash sale') || textToCheck.includes('thương mại') || textToCheck.includes('e-commerce') || textToCheck.includes('tmdt')) {
    return 'DOMAIN / E-COMMERCE';
  }

  // 3. Nếu người dùng chỉ định một phân loại mới, chuyển thành chữ hoa chuẩn kiến trúc
  if (cleaned.length > 0) {
    return cleaned.toUpperCase();
  }

  return 'ARCHITECTURE / COMPONENT';
}

/**
 * Chuẩn hóa nhãn luồng giao thức kỹ thuật (Technical Protocol Flow Standard)
 * CẤM tiền tố số thứ tự (1. , 2. , 3.1. , ...)
 */
export function sanitizeProtocolEdgeLabel(rawLabel?: string): string {
  if (!rawLabel) return 'Liên kết hệ thống';

  let cleaned = rawLabel.trim();

  // 1. Gỡ bỏ mọi tiền tố số thứ tự như "1. ", "2. ", "3.1. ", "1.2. "
  cleaned = cleaned.replace(/^(\d+(\.\d+)*)\s*[:.-]?\s*/i, '');
  cleaned = cleaned.replace(/^(bước|buoc|step)\s*[\d\.]+\s*[:.-]?\s*/i, '');
  cleaned = cleaned.trim();

  // 2. Chuyển đổi các nhãn cổ điển sang luồng giao thức chuẩn nếu khớp
  const lower = cleaned.toLowerCase();
  if (lower === 'kích hoạt sự cố' || lower.includes('webhook retry')) return 'Webhook Timeout Retry';
  if (lower === 'chặn bằng khiên' || lower.includes('atomic lock')) return 'Atomic Lock Check';
  if (lower === 'ghi vào trụ db' || lower.includes('acid write')) return 'ACID Write / Unique Index';
  if (lower === 'cầu nối: cùng xung đột' || lower.includes('flash sale')) return 'Flash Sale Race Condition';
  if (lower === 'đẩy vào queue' || lower.includes('async event')) return 'Async Event Produce';
  if (lower === 'khóa nhanh ram' || lower.includes('distributed lock')) return 'Distributed Lock Acquire';

  return cleaned || 'Liên kết hệ thống';
}

/**
 * BỘ KIỂM DUYỆT LIÊN KẾT 4 LỚP (BOUNDED CONTEXT & ANTI-HALLUCINATION DEFENSE)
 * 1. Chống tự trỏ (from !== to) & kiểm tra ID phải tồn tại
 * 2. Chống cạnh trùng lặp & chu trình đảo ngược trực tiếp (A -> B -> A)
 * 3. Ngăn chặn Cross-Wiring vào Sub-cluster nội tạng của Cụm khác (Bounded Context Isolation)
 * 4. Chuẩn hóa nhãn và ép kiểu phân loại liên kết kiến trúc
 */
export function validateAndSanitizeEdges(allNodes: NodeEntity[], rawEdges: EdgeEntity[]): EdgeEntity[] {
  const nodeMap = new Map<string, NodeEntity>();
  for (const n of allNodes) {
    nodeMap.set(n.id, n);
  }
  const seenEdges = new Set<string>();
  const sanitized: EdgeEntity[] = [];

  for (const edge of rawEdges) {
    // Lớp 1a: Chống tự trỏ vào chính mình
    if (edge.from === edge.to) {
      console.warn(`[Edge Validator] Bỏ qua cạnh tự trỏ: ${edge.from} -> ${edge.to}`);
      continue;
    }

    // Lớp 1b: Kiểm tra ID nguồn và đích có tồn tại trong tập node không
    if (!nodeMap.has(edge.from) || !nodeMap.has(edge.to)) {
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

    const fromNode = nodeMap.get(edge.from)!;
    const toNode = nodeMap.get(edge.to)!;

    // Lớp 3: Bounded Context Isolation (Phương án B: Shared Infrastructure & Cluster Boundary)
    // CẤM cắm dây xuyên cụm trực tiếp vào sub-cluster nội tạng private của cụm khác
    const isDifferentDomain = fromNode.domain_id && toNode.domain_id && fromNode.domain_id !== toNode.domain_id;
    const isDifferentCluster = fromNode.cluster_id && toNode.cluster_id && fromNode.cluster_id !== toNode.cluster_id;

    if (isDifferentDomain || isDifferentCluster) {
      // Nếu toNode là private sub-cluster của service khác và không phải Shared Infrastructure
      const isTargetPrivateSubCluster = Boolean(
        toNode.sub_cluster_id &&
        !toNode.is_public_interface &&
        toNode.cluster_id !== 'cum-shared-infrastructure' &&
        toNode.domain_id !== 'domain-shared-infra'
      );

      if (isTargetPrivateSubCluster) {
        console.warn(
          `[Edge Validator] BỊ CHẶN (Bounded Context Violation): Node '${fromNode.tieu_de}' (${fromNode.cluster_id}) không được phép cắm dây trực tiếp vào Sub-Cluster nội tạng '${toNode.tieu_de}' của Cụm '${toNode.cluster_id}'. Phải giao tiếp qua Public Gateway hoặc dùng Cụm Hạ Tầng Dùng Chung (Shared Infra).`
        );
        continue;
      }
    }

    seenEdges.add(edgeKey);
    sanitized.push({
      ...edge,
      nhan: sanitizeProtocolEdgeLabel(edge.nhan),
      kieu: edge.kieu || 'duong-xung-em-ai',
      loai_lien_ket: edge.loai_lien_ket || 'HOA_GIAI'
    });
  }

  return sanitized;
}

/**
 * Thuật toán tìm ô trống thông minh chống đè node (Collision-Free Spiral Slot Finder)
 */
export function findSafeNodePosition(
  preferredX: number,
  preferredY: number,
  existingNodes: NodeEntity[]
): { x: number; y: number } {
  const isColliding = (testX: number, testY: number) => {
    return existingNodes.some(n => Math.abs(n.toa_do.x - testX) < 290 && Math.abs(n.toa_do.y - testY) < 240);
  };

  if (!isColliding(preferredX, preferredY)) {
    return { x: Math.round(preferredX), y: Math.round(preferredY) };
  }

  const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
  for (let r = 320; r <= 2500; r += 280) {
    for (const a of angles) {
      const candidateX = Math.round(preferredX + r * Math.cos(a));
      const candidateY = Math.round(preferredY + r * Math.sin(a));
      if (!isColliding(candidateX, candidateY)) {
        return { x: candidateX, y: candidateY };
      }
    }
  }
  return { x: preferredX + 320, y: preferredY + 260 };
}

export interface SpawnPayload {
  concept_type: string;
  target_concept_slug?: string;
  position?: { x: number; y: number };
  title?: string;
  category?: string;
  description?: string;
  ban_chat?: string;
  ca_thuc_te?: string[];
  rui_ro?: string[];
  chuoi_sup_do?: string[];
  trac_nghiem?: any;
  schematic_template?: string;
  schematic_params?: Record<string, string>;
  domain_id?: string;
  cluster_id?: string;
  sub_cluster_id?: string;
  is_public_interface?: boolean;
  infra_type?: 'redis' | 'postgres' | 'kafka' | 'service' | 'gateway' | 'worker';
}

function createCleanGraph(topic?: string): GraphData {
  return {
    id: 'graph-interactive-workspace',
    topic: topic || 'Kiến Trúc Hệ Thống Phân Tán',
    nodes: [],
    edges: []
  };
}

export const toolHandlers = {
  /**
   * Tạo hoặc nạp đồ thị tri thức (Tự động nạp từ SQLite Cache)
   * 0 token tiêu thụ
   */
  async createKnowledgeGraph(topic?: string): Promise<{ graph: GraphData; from_cache: boolean }> {
    const existing = sqliteClient.getCurrentGraph();
    if (existing) {
      if (!topic || existing.topic.toLowerCase().includes(topic.toLowerCase())) {
        return { graph: existing, from_cache: true };
      }
    }

    // Khởi tạo đồ thị sạch 100% không hardcode
    const initialGraph = createCleanGraph(topic);
    sqliteClient.saveGraph(initialGraph);
    return { graph: initialGraph, from_cache: false };
  },

  /**
   * Mở rộng 1-2 node delta từ node mục tiêu
   * Tiết kiệm >90% token: chỉ sinh delta và gắn vào SQLite sau khi kiểm duyệt 4 lớp
   */
  async expandConceptNode(payload: ExpandPayload): Promise<{ graph: GraphData; expanded: boolean; message: string }> {
    const current = sqliteClient.getCurrentGraph() || createCleanGraph();

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
   * Spawn động một Node mới (ví dụ: Node Chống DDoS, Rate Limiter, WAF, Zero Trust)
   * Tự động gán Domain/Cluster và kiểm duyệt Bounded Context
   */
  async spawnConceptNode(payload: SpawnPayload): Promise<{ graph: GraphData; spawned: boolean; message: string; node?: NodeEntity }> {
    const current = sqliteClient.getCurrentGraph() || createCleanGraph();

    // Rào cản bão hòa an toàn (Anti-Hallucination Capacity Cap)
    if (current.nodes.length >= MAX_GRAPH_NODES) {
      return {
        graph: current,
        spawned: false,
        message: `Đồ thị đã đạt ngưỡng trần an toàn (${MAX_GRAPH_NODES} nodes). Vui lòng thu gọn (collapse) hoặc xóa bớt nhánh thừa để tiếp tục.`
      };
    }

    const typeLower = (payload.concept_type || 'ddos').toLowerCase();
    const targetSlug = payload.target_concept_slug;
    let targetNode: NodeEntity | undefined = undefined;

    if (targetSlug) {
      targetNode = current.nodes.find(n => n.id === targetSlug);
      if (!targetNode) {
        return { graph: current, spawned: false, message: `Node đích '${targetSlug}' không tồn tại trong đồ thị.` };
      }

      // Saturation Lock: Kiểm tra nếu targetNode đã fully_explored thì từ chối mở rộng thêm
      if (targetNode.fully_explored) {
        return {
          graph: current,
          spawned: false,
          node: targetNode,
          message: `Node '${targetNode.tieu_de}' đã bão hòa và bị khóa (Saturation Lock). 0 token tiêu thụ.`
        };
      }
    }

    // Chỉ tìm kiếm tái sử dụng hạ tầng trong Cụm Hạ Tầng Dùng Chung (Option B: Shared Infrastructure Platform)
    const infraNodes = current.nodes.filter(n => n.cluster_id?.includes('infra') || n.cluster_id === 'cum-shared-infrastructure' || n.domain_id === 'domain-shared-infra');
    const existingDb = infraNodes.find(n => n.id.includes('db') || n.id.includes('postgres') || n.id.includes('acid') || n.bieu_tuong === 'khoi_tru_database');
    const existingCache = infraNodes.find(n => n.id.includes('redis') || n.id.includes('cache') || n.bieu_tuong === 'bo_nho_dem_cache');
    const existingQueue = infraNodes.find(n => n.id.includes('queue') || n.id.includes('kafka') || n.bieu_tuong === 'hang_doi_message_queue');

    // 1. TÁI SỬ DỤNG HẠ TẦNG CHUNG NẾU LÀ REQUEST HẠ TẦNG THUẦN TÚY
    if (typeLower === 'db' || typeLower === 'database' || typeLower === 'postgres') {
      if (existingDb) {
        const addedEdges: EdgeEntity[] = [];
        if (targetNode && targetNode.id !== existingDb.id) {
          addedEdges.push({
            from: targetNode.id,
            to: existingDb.id,
            nhan: 'Bảo chứng ACID & Khóa dòng',
            kieu: 'duong-xung-em-ai',
            loai_lien_ket: 'LUU_TRU'
          });
        }
        const validated = addedEdges.length > 0 ? validateAndSanitizeEdges(current.nodes, addedEdges) : [];
        const updated = validated.length > 0 ? sqliteClient.addDeltaNodes(current.id, null, [], validated) : current;

        return {
          graph: updated || current,
          spawned: true,
          message: `Đã tái sử dụng Trụ ACID Database duy nhất ('${existingDb.tieu_de}') - Chống trùng lặp tầng dữ liệu!`,
          node: existingDb
        };
      }
    }

    if (typeLower === 'cache' || typeLower === 'redis') {
      if (existingCache) {
        const addedEdges: EdgeEntity[] = [];
        if (targetNode && targetNode.id !== existingCache.id) {
          addedEdges.push({
            from: targetNode.id,
            to: existingCache.id,
            nhan: 'Đệm RAM & Khóa phân tán',
            kieu: 'duong-xung-em-ai',
            loai_lien_ket: 'HOA_GIAI'
          });
        }
        const validated = addedEdges.length > 0 ? validateAndSanitizeEdges(current.nodes, addedEdges) : [];
        const updated = validated.length > 0 ? sqliteClient.addDeltaNodes(current.id, null, [], validated) : current;

        return {
          graph: updated || current,
          spawned: true,
          message: `Đã tái sử dụng node Bộ nhớ đệm Redis Cache duy nhất ('${existingCache.tieu_de}')!`,
          node: existingCache
        };
      }
    }

    const timestamp = Date.now().toString().slice(-4);
    const slotsAvailable = MAX_GRAPH_NODES - current.nodes.length;
    const canSpawnChild = slotsAvailable >= 2;

    let preferredX = payload.position?.x ?? 100;
    let preferredY = payload.position?.y ?? -200;

    if (targetNode) {
      preferredX = payload.position?.x ?? targetNode.toa_do.x + 320;
      preferredY = payload.position?.y ?? targetNode.toa_do.y;
    }

    const safePos = findSafeNodePosition(preferredX, preferredY, current.nodes);
    const defaultX = safePos.x;
    const defaultY = safePos.y;

    let rootNode: NodeEntity;
    let childNode: NodeEntity | undefined = undefined;
    const newEdges: EdgeEntity[] = [];

    if (typeLower.includes('zero_trust') || typeLower.includes('auth') || typeLower.includes('jwt')) {
      const existingZeroTrust = current.nodes.find(n => n.id.includes('zero-trust') || n.id.includes('jwt') || n.tieu_de.toLowerCase().includes('zero-trust'));
      if (existingZeroTrust) {
        return {
          graph: current,
          spawned: false,
          node: existingZeroTrust,
          message: `Thành phần '${existingZeroTrust.tieu_de}' đã tồn tại trong kiến trúc, không sinh trùng lặp!`
        };
      }

      const rootId = `node-zero-trust-gateway-${timestamp}`;
      const childId = `node-jwt-pdp-${timestamp}`;

      rootNode = {
        id: rootId,
        domain_id: 'domain-auth',
        cluster_id: 'cum-zero-trust',
        is_public_interface: true,
        infra_type: 'gateway',
        bieu_tuong: 'khien_bao_ve',
        tieu_de: payload.title || 'Cổng Zero Trust Gateway',
        nhan_buoc: 'SECURITY / ZERO-TRUST',
        tom_tat: payload.description || 'Xác thực và phân quyền mọi yêu cầu truy cập theo nguyên tắc không tin tưởng bất kỳ ai (Never Trust, Always Verify).',
        toa_do: { x: defaultX, y: defaultY },
        tam: { x: defaultX + 110, y: defaultY + 72 },
        fully_explored: false,
        hoat_hoa: {
          mau: 'zero_trust_pep',
          tham_so: {
            client: 'CLIENT MẠNG BIÊN',
            gateway: 'PEP GATEWAY',
            auth_server: 'PDP TOKEN SERVER',
            token: 'JWT mTLS',
            status: 'THẨM ĐỊNH HỢP LỆ'
          }
        },
        chi_tiet: {
          phan_loai: 'CỔNG XÁC THỰC ZERO-TRUST',
          tieu_de: payload.title || 'Cổng Zero Trust Gateway',
          ban_chat: 'Thực thi kiến trúc Zero-Trust (ZTA) ở tầng biên, xác thực mTLS và giải mã Identity Token trước khi chuyển tiếp yêu cầu vào mạng lưới nội bộ.',
          chu_thich_so_do: 'Điểm kiểm soát chính sách Policy Enforcement Point (PEP)',
          ca_thuc_te: [
            'Chặn kẻ tấn công nội bộ xâm nhập trái phép khi đã chiếm được quyền truy cập mạng cục bộ (Lateral Movement)',
            'Phát hiện token giả mạo bằng cách đối chiếu chữ ký RSA công khai và danh sách thu hồi Token Revocation List'
          ],
          rui_ro: [
            'Tăng độ trễ 3-8ms cho mỗi lần thẩm định chữ ký số và phân giải quyền truy cập',
            'Sự cố điểm nghẽn đơn lẻ (Single Point of Failure) nếu cụm Gateway không mở rộng đa vùng'
          ]
        },
        trac_nghiem: {
          cau_hoi: 'Nguyên lý cốt lõi của kiến trúc Zero-Trust là gì?',
          lua_chon: ['Không bao giờ tin tưởng, luôn luôn xác thực mọi yêu cầu', 'Tin tưởng tuyệt đối lưu lượng bên trong mạng nội bộ'],
          dung: 0,
          giai_thich: 'Zero-Trust giả định rằng mạng nội bộ luôn có thể đã bị xâm nhập, do đó mọi yêu cầu từ trong lẫn ngoài đều phải xác thực.'
        }
      };

      if (canSpawnChild) {
        childNode = {
          id: childId,
          domain_id: 'domain-auth',
          cluster_id: 'cum-zero-trust',
          sub_cluster_id: 'sub-auth-pdp',
          is_public_interface: false,
          infra_type: 'service',
          bieu_tuong: 'bo_nho_dem_cache',
          tieu_de: 'Dịch vụ Token JWT & PDP',
          nhan_buoc: 'SECURITY / IDENTITY',
          tom_tat: 'Cấp phát, luân chuyển khóa bí mật và thẩm định quyền truy cập chính sách (Policy Decision Point).',
          toa_do: { x: defaultX + 260, y: defaultY },
          tam: { x: defaultX + 370, y: defaultY + 72 },
          fully_explored: false,
          parent_id: rootId,
          hoat_hoa: {
            mau: 'zero_trust_pep',
            tham_so: {
              client: 'GATEWAY PEP',
              gateway: 'PDP DECISION',
              auth_server: 'JWKS KEYSTORE',
              token: 'POLICY ABAC',
              status: 'TOKEN ISSUED'
            }
          },
          chi_tiet: {
            phan_loai: 'CỔNG XÁC THỰC ZERO-TRUST',
            tieu_de: 'Dịch vụ Token JWT & PDP',
            ban_chat: 'Quản lý cặp khóa bất đối xứng RS256, tự động luân chuyển khóa (Key Rotation) định kỳ 24h và thẩm định chính sách RBAC/ABAC dạng stateless.',
            chu_thich_so_do: 'Thành phần con xử lý và cấp phát định danh trong cụm Zero-Trust',
            ca_thuc_te: [
              'Tự động vô hiệu hóa khóa cũ và phát tán khóa mới qua JWKS endpoint',
              'Giảm tải xác thực nhờ JWT tự chứa thông tin quyền hạn (Self-contained)'
            ],
            rui_ro: [
              'Khó thu hồi token tức thì trước khi hết hạn (TTL) nếu không có cơ chế Blacklist/Redis',
              'Kích thước header HTTP phình to khi token chứa quá nhiều claim phân quyền'
            ]
          },
          trac_nghiem: {
            cau_hoi: 'Để thu hồi ngay lập tức một JWT token bị lộ trước khi hết hạn TTL, ta nên làm gì?',
            lua_chon: ['Lưu JTI của token vào bộ nhớ đệm Redis Blacklist với TTL tương ứng', 'Đợi token tự hết hạn theo thời gian mặc định'],
            dung: 0,
            giai_thich: 'Lưu JTI vào Redis Blacklist cho phép Gateway kiểm tra nhanh và từ chối token ngay lập tức.'
          }
        };

        newEdges.push({
          from: rootId,
          to: childId,
          nhan: 'mTLS Delegation Token',
          kieu: 'duong-xung-em-ai',
          loai_lien_ket: 'HOA_GIAI'
        });
      }

      if (existingCache) {
        newEdges.push({
          from: rootId,
          to: existingCache.id,
          nhan: 'Revoked JTI Cache Lookup',
          kieu: 'duong-xung-em-ai',
          loai_lien_ket: 'DEM_LOC'
        });
      }
    } else if (typeLower.includes('ddos') || typeLower.includes('waf') || typeLower.includes('rate')) {
      const existingWaf = current.nodes.find(n => n.id.includes('ddos') || n.id.includes('waf') || n.tieu_de.toLowerCase().includes('waf') || n.tieu_de.toLowerCase().includes('ddos'));
      if (existingWaf) {
        return {
          graph: current,
          spawned: false,
          node: existingWaf,
          message: `Thành phần '${existingWaf.tieu_de}' đã tồn tại trong kiến trúc, không sinh trùng lặp!`
        };
      }

      const rootId = 'node-ddos-waf';

      rootNode = {
        id: rootId,
        domain_id: 'domain-edge',
        cluster_id: 'cum-edge-waf',
        is_public_interface: true,
        infra_type: 'gateway',
        bieu_tuong: 'khien_bao_ve',
        tieu_de: payload.title || 'Lá chắn WAF & Chống DDoS',
        nhan_buoc: 'EDGE / WAF RATE LIMIT',
        tom_tat: payload.description || 'Lọc lưu lượng bot độc hại, Rate Limiting trượt ngăn chặn bão request trước khi chạm hệ thống.',
        toa_do: { x: defaultX, y: defaultY },
        tam: { x: defaultX + 110, y: defaultY + 72 },
        fully_explored: false,
        hoat_hoa: {
          mau: 'rate_limit_sliding',
          tham_so: {
            client: 'FLOOD TRAFFIC',
            waf: 'WAF RATE LIMIT',
            cache: 'REDIS RAM BUCKET',
            drop: '429 DROP',
            pass: 'REQ OK'
          }
        },
        chi_tiet: {
          phan_loai: 'CỔNG BẢO VỆ BIÊN & CHỐNG DDOS',
          tieu_de: payload.title || 'Lá chắn WAF & Chống DDoS',
          ban_chat: 'Sử dụng Cloudflare WAF và tường lửa ứng dụng để lọc các gói tin HTTP Flood độc hại.',
          chu_thich_so_do: 'Hạ tầng phòng thủ biên độc lập bảo vệ toàn bộ mạng lưới microservices',
          ca_thuc_te: [
            'Botnet gửi 50.000 request/giây làm cạn kiệt Connection Pool',
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

      if (existingCache) {
        newEdges.push({
          from: rootId,
          to: existingCache.id,
          nhan: 'Token Bucket Ingress Count',
          kieu: 'duong-xung-em-ai',
          loai_lien_ket: 'DEM_LOC'
        });
      }
    } else if (typeLower.includes('audit') || typeLower.includes('log') || typeLower.includes('kiểm toán')) {
      const existingAudit = current.nodes.find(n => n.id.includes('audit-log') || n.tieu_de.toLowerCase().includes('kiểm toán') || n.tieu_de.toLowerCase().includes('audit log'));
      if (existingAudit) {
        return {
          graph: current,
          spawned: false,
          node: existingAudit,
          message: `Thành phần '${existingAudit.tieu_de}' đã tồn tại trong kiến trúc, không sinh trùng lặp!`
        };
      }

      const rootId = 'node-audit-log';

      rootNode = {
        id: rootId,
        domain_id: 'domain-observability',
        cluster_id: 'cum-audit-log',
        is_public_interface: true,
        infra_type: 'service',
        bieu_tuong: 'ghi_chep_so_sach' as any,
        tieu_de: payload.title || 'Nhật ký Kiểm toán & Audit Log',
        nhan_buoc: 'OBSERVABILITY / AUDIT LOG',
        tom_tat: payload.description || 'Append-only Log bất biến ghi nhận mọi thay đổi trạng thái giao dịch phục vụ đối soát và tuân thủ PCI-DSS.',
        toa_do: { x: defaultX, y: defaultY },
        tam: { x: defaultX + 110, y: defaultY + 72 },
        fully_explored: false,
        hoat_hoa: {
          mau: 'audit_hash_chain',
          tham_so: {
            event: 'TX PAYMENT',
            hash_node: 'SHA-256 HASHER',
            chain: 'APPEND-ONLY MERKLE',
            immutability: 'KÝ SỐ BẤT BIẾN'
          }
        },
        chi_tiet: {
          phan_loai: 'HẠ TẦNG KIỂM TOÁN & TUÂN THỦ',
          tieu_de: payload.title || 'Nhật ký Kiểm toán & Audit Log',
          ban_chat: 'Cơ chế ghi log bất biến (Append-Only Event Store) ký số mật mã học, ngăn ngừa mọi hành vi sửa đổi trái phép từ nội bộ và đáp ứng tiêu chuẩn kiểm toán tài chính quốc tế.',
          chu_thich_so_do: 'Hạ tầng ghi vết kiểm toán tài chính bất biến',
          ca_thuc_te: [
            'Đối soát tự động giữa Payment Gateway và Ngân hàng khi có khiếu nại hoàn tiền',
            'Phát hiện gian lận bằng cách phân tích chuỗi log giao dịch bất thường trong thời gian thực'
          ],
          rui_ro: [
            'Chi phí lưu trữ phình to nếu không có chính sách nén và di chuyển sang Cold Storage',
            'Độ trễ hệ thống nếu ghi log đồng bộ (Sync I/O) chặn luồng xử lý chính'
          ]
        },
        trac_nghiem: {
          cau_hoi: 'Nguyên tắc cốt lõi của Audit Trail trong hệ thống tài chính là gì?',
          lua_chon: ['Append-only không cho phép sửa hay xóa bản ghi cũ', 'Ghi đè bản ghi để tiết kiệm dung lượng'],
          dung: 0,
          giai_thich: 'Audit Trail phải đảm bảo tính bất biến (Immutability), mọi sự điều chỉnh đều phải tạo bản ghi mới để duy trì lịch sử toàn vẹn.'
        }
      };

      if (existingDb) {
        newEdges.push({
          from: rootId,
          to: existingDb.id,
          nhan: 'Async Audit Stream',
          kieu: 'duong-xung-em-ai',
          loai_lien_ket: 'LUU_TRU'
        });
      }
    } else {
      const cleanSlug = typeLower.replace(/[^a-z0-9]/g, '-');
      const formattedTitle = payload.title || payload.concept_type.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const rootId = `node-${cleanSlug}-${timestamp}`;

      let autoTemplate = 'default';
      let autoParams: Record<string, string> = {
        actor: 'CLIENT APP',
        component: formattedTitle.toUpperCase(),
        target: 'DOWNSTREAM SERVICE',
        status: 'VERIFIED'
      };

      if (typeLower.includes('token') || typeLower.includes('refresh') || typeLower.includes('session') || typeLower.includes('rotation')) {
        autoTemplate = 'oauth2_oidc';
        autoParams = { client: 'CLIENT APP', auth_server: formattedTitle.toUpperCase(), token: 'ROTATED TOKEN PAIR' };
      } else if (typeLower.includes('blacklist') || typeLower.includes('revoc') || typeLower.includes('thu-hoi')) {
        autoTemplate = 'token_blacklist';
        autoParams = { token_jti: 'BEARER JTI', cache_store: formattedTitle.toUpperCase() };
      } else if (typeLower.includes('policy') || typeLower.includes('pdp') || typeLower.includes('rbac') || typeLower.includes('abac')) {
        autoTemplate = 'pdp_policy';
        autoParams = { subject: 'USER CLAIMS', engine: formattedTitle.toUpperCase(), decision: 'PERMIT ACCESS' };
      }

      rootNode = {
        id: rootId,
        domain_id: payload.domain_id || targetNode?.domain_id || `domain-${cleanSlug}`,
        cluster_id: payload.cluster_id || targetNode?.cluster_id,
        sub_cluster_id: payload.sub_cluster_id,
        is_public_interface: payload.is_public_interface ?? !targetNode,
        infra_type: payload.infra_type || 'service',
        bieu_tuong: 'khien_bao_ve',
        tieu_de: formattedTitle,
        nhan_buoc: sanitizeNodeLayerLabel(payload.category || targetNode?.nhan_buoc || 'SECURITY / COMPONENT', formattedTitle),
        tom_tat: payload.description || `Mô-đun kiến trúc ${formattedTitle} nâng cao bảo mật toàn hệ thống.`,
        toa_do: { x: defaultX, y: defaultY },
        tam: { x: defaultX + 110, y: defaultY + 72 },
        fully_explored: false,
        parent_id: targetNode?.id,
        hoat_hoa: {
          mau: payload.schematic_template || autoTemplate,
          tham_so: payload.schematic_params || autoParams
        },
        chi_tiet: {
          phan_loai: payload.category || (targetNode ? targetNode.chi_tiet.phan_loai : `Phân hệ ${formattedTitle}`),
          tieu_de: formattedTitle,
          ban_chat: payload.ban_chat || payload.description || `Thực thi cơ chế ${formattedTitle} tăng cường tính toàn vẹn hệ thống.`,
          chu_thich_so_do: `Mô hình luồng thực thi chuyên sâu của ${formattedTitle}`,
          ca_thuc_te: payload.ca_thuc_te || [
            `Áp dụng quy trình chuẩn cho ${formattedTitle}`,
            'Tự động cô lập rủi ro khi phát hiện bất thường'
          ],
          rui_ro: payload.rui_ro || [
            'Cần xử lý độ trễ mạng tránh race condition khi chịu tải cao'
          ],
          chuoi_sup_do: payload.chuoi_sup_do || [
            `1. Lỗ hổng trong quy trình ${formattedTitle} bị khai thác.`,
            '2. Ảnh hưởng lan truyền đến các luồng phụ thuộc phía sau.',
            '3. Dữ liệu nhạy cảm có nguy cơ bị rò rỉ hoặc nghẽn hàng đợi.',
            '4. Hệ thống suy giảm hiệu năng trên diện rộng.'
          ]
        },
        trac_nghiem: payload.trac_nghiem || {
          cau_hoi: `Nguyên tắc an ninh cốt lõi khi vận hành '${formattedTitle}' là gì?`,
          lua_chon: ['Đảm bảo tính toàn vẹn và kiểm soát chặt chẽ trạng thái', 'Bỏ qua kiểm tra để tăng tốc độ tối đa'],
          dung: 0,
          giai_thich: `Cơ chế của ${formattedTitle} yêu cầu kiểm soát chặt chẽ trạng thái để triệt tiêu lỗ hổng.`
        }
      };

      childNode = undefined;
    }

    // Nếu người dùng chỉ định targetNode thì nối dây từ targetNode vào rootNode
    if (targetNode) {
      newEdges.push({
        from: targetNode.id,
        to: rootNode.id,
        nhan: 'Tích hợp phân hệ',
        kieu: 'duong-xung-em-ai',
        loai_lien_ket: 'HOA_GIAI',
        giai_thich: `Mở rộng tích hợp từ <u>${targetNode.tieu_de}</u> sang <u>${rootNode.tieu_de}</u>.`
      });
    }

    rootNode.nhan_buoc = sanitizeNodeLayerLabel(rootNode.nhan_buoc, rootNode.tieu_de);
    if (childNode) {
      childNode.nhan_buoc = sanitizeNodeLayerLabel(childNode.nhan_buoc, childNode.tieu_de);
    }

    const allSpawnedNodes = childNode ? [rootNode, childNode] : [rootNode];
    const allGraphNodes = [...current.nodes, ...allSpawnedNodes];
    const validatedEdges = newEdges.length > 0 ? validateAndSanitizeEdges(allGraphNodes, newEdges) : [];

    // Khóa targetNode nếu có mở rộng từ nó (Saturation Lock)
    if (targetNode) {
      targetNode.fully_explored = true;
    }

    const updated = sqliteClient.addDeltaNodes(
      current.id,
      targetSlug || null,
      allSpawnedNodes,
      validatedEdges
    );

    return {
      graph: updated || current,
      spawned: true,
      message: targetNode
        ? `Đã spawn thành công Cụm Chủ Đề '${rootNode.tieu_de}' (${allSpawnedNodes.length} nodes) nối với '${targetNode.tieu_de}'!`
        : `Đã spawn thành công Cụm Chủ Đề '${rootNode.tieu_de}' (${allSpawnedNodes.length} nodes) tại vị trí (${Math.round(defaultX)}, ${Math.round(defaultY)})!`,
      node: rootNode
    };
  },

  /**
   * Thu gọn (Collapse) hoặc Xóa vĩnh viễn (Delete) node/nhánh chống lộn xộn
   * 100% cục bộ, 0 token
   */
  async pruneKnowledgeGraph(payload: PrunePayload): Promise<{ graph: GraphData; success: boolean; message: string }> {
    const current = sqliteClient.getCurrentGraph() || createCleanGraph();

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
   * Sinh Cụm Phân Hệ hoàn chỉnh (Hierarchical Cluster & Multi-Cluster Spawning Engine - Phương án B)
   * Hỗ trợ spawn đồng thời Cụm Dịch Vụ và các Cụm Con / Cụm Hạ Tầng Liên Quan (Multi-Cluster / Sub-Cluster Spawning).
   * Tự động cô lập Bounded Context và cắm dây chuẩn hóa qua Public Contract.
   */
  async spawnConceptCluster(payload: SpawnClusterPayload): Promise<{
    graph: GraphData;
    spawned: boolean;
    cluster_id: string;
    message: string;
  }> {
    const current = sqliteClient.getCurrentGraph() || createCleanGraph();
    const slotsAvailable = MAX_GRAPH_NODES - current.nodes.length;
    if (slotsAvailable <= 0) {
      return {
        graph: current,
        spawned: false,
        cluster_id: '',
        message: `Đồ thị đã đạt ngưỡng trần an toàn (${MAX_GRAPH_NODES} nodes).`
      };
    }

    const timestamp = Date.now().toString().slice(-4);
    const slugBase = payload.cluster_name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'cum-custom';

    const existingClusterNodes = current.nodes.filter(n => n.cluster_id?.includes(slugBase));
    if (existingClusterNodes.length > 0) {
      return {
        graph: current,
        spawned: false,
        cluster_id: existingClusterNodes[0].cluster_id || '',
        message: `Cụm phân hệ '${payload.cluster_name}' đã tồn tại trong kiến trúc, không sinh trùng lặp!`
      };
    }

    const clusterId = `cum-${slugBase}-${timestamp}`;
    const domainId = payload.domain_id || `domain-${slugBase}`;

    // Tọa độ xuất phát
    const startX = payload.position?.x ?? 100;
    const startY = payload.position?.y ?? (current.nodes.length > 0 ? Math.min(...current.nodes.map(n => n.toa_do.y)) - 450 : 150);

    const nodesToSpawn = payload.nodes.slice(0, slotsAvailable);
    const spawnedNodes: NodeEntity[] = [];
    const newEdges: EdgeEntity[] = [];

    // 1. Khởi tạo các Node trong Cụm Dịch vụ Chính (Service Cluster)
    const cols = nodesToSpawn.length >= 4 ? 2 : (nodesToSpawn.length === 3 ? 3 : 2);
    nodesToSpawn.forEach((cNode, idx) => {
      const nodeSlug = cNode.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `node-${idx}`;
      const nodeId = `node-${nodeSlug}-${timestamp}`;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const posX = startX + col * 320;
      const posY = startY + row * 260;

      let badge: NodeEntity['bieu_tuong'] = 'dieu_phoi_service';
      const roleLower = (cNode.role || '').toLowerCase();
      const titleLower = cNode.title.toLowerCase();
      const summaryLower = (cNode.summary || '').toLowerCase();
      const combinedText = `${titleLower} ${roleLower} ${summaryLower}`;

      if (combinedText.includes('http') || combinedText.includes('gateway') || combinedText.includes('ingress') || combinedText.includes('controller') || roleLower.includes('gateway')) {
        badge = 'cong_gateway_ingress';
      } else if (combinedText.includes('pure') || combinedText.includes('engine') || combinedText.includes('tính toán') || combinedText.includes('pricing')) {
        badge = 'dong_co_pure_engine';
      } else if (combinedText.includes('port') || combinedText.includes('adapter') || combinedText.includes('connector')) {
        badge = 'cong_ket_noi_port';
      } else if (combinedText.includes('worker') || combinedText.includes('publisher') || combinedText.includes('tiến trình')) {
        badge = 'tien_trinh_worker_pool';
      } else if (combinedText.includes('voucher') || combinedText.includes('promo') || combinedText.includes('khuyến mãi')) {
        badge = 'khuyen_mai_voucher';
      } else if (combinedText.includes('payment') || combinedText.includes('thanh toán') || combinedText.includes('ledger')) {
        badge = 'thanh_toan_payment';
      } else if (combinedText.includes('rtr') || combinedText.includes('rotation') || combinedText.includes('xoay vòng')) {
        badge = 'xoay_vong_token_rtr';
      } else if (combinedText.includes('pdp') || combinedText.includes('rbac') || combinedText.includes('policy') || combinedText.includes('phân quyền')) {
        badge = 'chinh_sach_rbac_pdp';
      } else if (combinedText.includes('token') || combinedText.includes('jwt') || combinedText.includes('oidc') || combinedText.includes('auth')) {
        badge = 'dinh_danh_auth_token';
      } else if (combinedText.includes('blacklist') || combinedText.includes('thu hồi') || combinedText.includes('jti')) {
        badge = 'danh_sach_den_blacklist';
      } else if (combinedText.includes('audit') || combinedText.includes('kiểm toán') || combinedText.includes('sổ cái') || combinedText.includes('nhật ký')) {
        badge = 'ghi_chep_so_sach';
      } else if (combinedText.includes('queue') || combinedText.includes('kafka') || combinedText.includes('outbox') || combinedText.includes('hàng đợi')) {
        badge = 'hang_doi_message_queue';
      } else if (combinedText.includes('cache') || combinedText.includes('redis') || combinedText.includes('đệm')) {
        badge = 'bo_nho_dem_cache';
      } else if (combinedText.includes('db') || combinedText.includes('database') || combinedText.includes('acid') || combinedText.includes('lưu trữ')) {
        badge = 'khoi_tru_database';
      } else if (combinedText.includes('waf') || combinedText.includes('ddos')) {
        badge = 'tuong_lua_waf';
      } else if (combinedText.includes('rate') || combinedText.includes('tần suất')) {
        badge = 'dieu_tiet_rate_limit';
      } else {
        badge = 'dieu_phoi_service';
      }

      let resolvedTemplate = cNode.schematic_template;
      let resolvedParams = cNode.schematic_params || {};

      if (!resolvedTemplate) {
        if (combinedText.includes('oidc') || combinedText.includes('oauth') || combinedText.includes('token') || combinedText.includes('identity')) {
          resolvedTemplate = 'oauth2_oidc';
          resolvedParams = { client: 'CLIENT APP', auth_server: cNode.title.toUpperCase(), token: 'ACCESS & REFRESH JWT' };
        } else if (combinedText.includes('blacklist') || combinedText.includes('thu hồi') || combinedText.includes('revocation') || combinedText.includes('jti')) {
          resolvedTemplate = 'token_blacklist';
          resolvedParams = { token_jti: 'BEARER TOKEN', cache_store: cNode.title.toUpperCase() };
        } else if (combinedText.includes('pdp') || combinedText.includes('policy') || combinedText.includes('quyền') || combinedText.includes('rbac') || combinedText.includes('abac')) {
          resolvedTemplate = 'pdp_policy';
          resolvedParams = { subject: 'USER CLAIMS', engine: cNode.title.toUpperCase(), decision: 'PERMIT ACCESS' };
        } else if (combinedText.includes('pep') || combinedText.includes('zero-trust') || combinedText.includes('zero trust') || combinedText.includes('mtls') || combinedText.includes('gateway')) {
          resolvedTemplate = 'zero_trust_pep';
          resolvedParams = { client: 'CLIENT mTLS', gateway: cNode.title.toUpperCase(), auth_server: 'INTERNAL MESH', status: 'CERT & TOKEN OK' };
        } else if (combinedText.includes('rate') || combinedText.includes('waf') || combinedText.includes('ddos') || combinedText.includes('sliding')) {
          resolvedTemplate = 'rate_limit_sliding';
          resolvedParams = { client: 'FLOOD TRAFFIC', waf: cNode.title.toUpperCase() };
        } else if (combinedText.includes('queue') || combinedText.includes('kafka') || combinedText.includes('rabbit') || combinedText.includes('hàng đợi')) {
          resolvedTemplate = 'hang_doi_dieu_tiet';
          resolvedParams = { dau_vao: 'PRODUCER', vung_dem: cNode.title.toUpperCase(), tho: 'WORKER POOL', tai_cao: '10k req/s', dieu_tiet: '100 req/s' };
        } else if (combinedText.includes('cache') || combinedText.includes('redis') || combinedText.includes('đệm')) {
          resolvedTemplate = 'bo_nho_dem_redis';
          resolvedParams = { yeu_cau: 'APP REQUEST', cache: cNode.title.toUpperCase(), toc_do: 'LATENCY: 1ms' };
        } else if (combinedText.includes('db') || combinedText.includes('database') || combinedText.includes('acid') || combinedText.includes('lưu trữ')) {
          resolvedTemplate = 'luu_tru_acid';
          resolvedParams = { lenh: 'TX WRITE', chu_lenh: cNode.title.toUpperCase() };
        } else if (combinedText.includes('audit') || combinedText.includes('log') || combinedText.includes('kiểm toán') || combinedText.includes('hash')) {
          resolvedTemplate = 'audit_hash_chain';
          resolvedParams = { event: 'AUDIT EVENT', hash_node: cNode.title.toUpperCase() };
        } else {
          resolvedTemplate = 'default';
          resolvedParams = { actor: 'INGRESS', component: cNode.title.toUpperCase(), target: 'DOWNSTREAM SERVICE', status: 'VERIFIED' };
        }
      }

      // Xác định Cổng Đối Ngoại: Node đầu tiên hoặc node mang vai trò Gateway/PEP/Ingress
      const isPublic = cNode.is_public_interface ?? (idx === 0 || roleLower.includes('gateway') || roleLower.includes('pep') || roleLower.includes('ingress'));

      const entity: NodeEntity = {
        id: nodeId,
        domain_id: domainId,
        cluster_id: clusterId,
        sub_cluster_id: cNode.sub_cluster_id,
        is_public_interface: isPublic,
        infra_type: cNode.infra_type || (roleLower.includes('gateway') ? 'gateway' : 'service'),
        bieu_tuong: badge,
        tieu_de: cNode.title,
        nhan_buoc: sanitizeNodeLayerLabel(payload.cluster_name, cNode.title),
        tom_tat: cNode.summary,
        toa_do: { x: posX, y: posY },
        tam: { x: posX + 110, y: posY + 72 },
        fully_explored: true,
        hoat_hoa: {
          mau: resolvedTemplate,
          tham_so: resolvedParams
        },
        chi_tiet: {
          phan_loai: payload.cluster_name.toUpperCase(),
          tieu_de: cNode.title,
          ban_chat: cNode.ban_chat || cNode.summary,
          chu_thich_so_do: `Mô hình luồng thực thi của ${cNode.title}`,
          ca_thuc_te: cNode.ca_thuc_te || [
            `Xử lý lưu lượng phân tán trong phân hệ ${payload.cluster_name}`,
            `Cô lập lỗi và phòng ngừa sự cố dây chuyền cho ${cNode.title}`
          ],
          rui_ro: cNode.rui_ro || [
            'Nguy cơ nghẽn cổ chai nếu lưu lượng tăng đột biến vượt ngưỡng dự kiến',
            'Độ trễ gia tăng nếu các kết nối phụ thuộc mạng chập chờn'
          ],
          chuoi_sup_do: cNode.chuoi_sup_do || [
            `1. Thành phần ${cNode.title} gặp sự cố quá tải hoặc mất kết nối.`,
            '2. Các luồng xử lý phụ thuộc phía sau bị dồn ứ hàng đợi.',
            '3. Bộ đệm bộ nhớ bị đầy làm tăng độ trễ toàn hệ thống.',
            `4. Phân hệ ${payload.cluster_name} rơi vào trạng thái suy giảm hiệu năng.`
          ]
        },
        trac_nghiem: cNode.trac_nghiem || {
          cau_hoi: `Vai trò kỹ thuật chính của '${cNode.title}' là gì?`,
          lua_chon: [cNode.summary.slice(0, 48) + '...', 'Bỏ qua các bước kiểm tra để tăng tốc độ'],
          dung: 0,
          giai_thich: `Thành phần này thực thi nhiệm vụ: ${cNode.summary}`
        },
        trac_nghiem_list: cNode.trac_nghiem_list || generate5StepReflexDrill(cNode.title, cNode.summary, payload.cluster_name)
      };

      spawnedNodes.push(entity);

      // Nối tuần tự các node trong Service Cluster
      if (idx > 0) {
        const prevNode = spawnedNodes[idx - 1];
        newEdges.push({
          from: prevNode.id,
          to: nodeId,
          nhan: cNode.title,
          kieu: 'duong-xung-em-ai',
          loai_lien_ket: 'HOA_GIAI',
          giai_thich: `Luồng tích hợp giữa <u>${prevNode.tieu_de}</u> và <u>${cNode.title}</u> trong phân hệ ${payload.cluster_name}.`
        });
      }
    });

    // 2. Multi-Cluster Spawning: Khởi tạo các Cụm Con / Cụm Hạ Tầng Liên Quan (Sub-Clusters)
    if (payload.sub_clusters && payload.sub_clusters.length > 0) {
      let subOffsetIdx = 1;
      for (const sub of payload.sub_clusters) {
        const subSlug = (sub.name || 'sub')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const subClusterId = sub.sub_cluster_id || `sub-${subSlug}-${timestamp}`;
        const subOffsetX = sub.position_offset?.x ?? (startX + (cols * 320) + 120);
        const subOffsetY = sub.position_offset?.y ?? (startY + (subOffsetIdx - 1) * 260);

        const subNodesToSpawn = sub.nodes.slice(0, MAX_GRAPH_NODES - (current.nodes.length + spawnedNodes.length));
        const spawnedSubNodes: NodeEntity[] = [];

        subNodesToSpawn.forEach((sNode, sIdx) => {
          const sNodeSlug = sNode.title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || `sub-node-${sIdx}`;
          const sNodeId = `node-${sNodeSlug}-${timestamp}`;
          const sPosX = subOffsetX + sIdx * 300;
          const sPosY = subOffsetY;

          let sBadge: NodeEntity['bieu_tuong'] = 'bo_nho_dem_cache';
          if (sub.infra_type === 'postgres' || sNode.infra_type === 'postgres') sBadge = 'khoi_tru_database';
          if (sub.infra_type === 'kafka' || sNode.infra_type === 'kafka') sBadge = 'hang_doi_message_queue';

          const sEntity: NodeEntity = {
            id: sNodeId,
            domain_id: domainId,
            cluster_id: clusterId,
            sub_cluster_id: subClusterId,
            is_public_interface: false, // Node nội bộ sub-cluster được bảo vệ chống cross-wiring!
            infra_type: sNode.infra_type || sub.infra_type || 'redis',
            bieu_tuong: sBadge,
            tieu_de: sNode.title,
            nhan_buoc: sanitizeNodeLayerLabel(sub.name, sNode.title),
            tom_tat: sNode.summary,
            toa_do: { x: sPosX, y: sPosY },
            tam: { x: sPosX + 110, y: sPosY + 72 },
            fully_explored: true,
            hoat_hoa: {
              mau: sNode.schematic_template || (sub.infra_type === 'redis' ? 'token_blacklist' : 'default'),
              tham_so: sNode.schematic_params || { store: sNode.title.toUpperCase() }
            },
            chi_tiet: {
              phan_loai: sub.name.toUpperCase(),
              tieu_de: sNode.title,
              ban_chat: sNode.ban_chat || sNode.summary,
              chu_thich_so_do: `Sub-Cluster ${sub.name} của ${payload.cluster_name}`,
              ca_thuc_te: sNode.ca_thuc_te || [`Lưu trữ và phục vụ nội bộ cho phân hệ ${payload.cluster_name}`],
              rui_ro: sNode.rui_ro || ['Cần đảm bảo đồng bộ trạng thái và TTL bộ nhớ'],
              chuoi_sup_do: sNode.chuoi_sup_do || [
                `1. Phân hệ hạ tầng ${sub.name} gặp sự cố hoặc quá tải I/O.`,
                `2. Các luồng xử lý của ${payload.cluster_name} bị dồn ứ hàng đợi.`,
                `3. Thời gian phản hồi vượt ngưỡng timeout cho phép.`,
                `4. Phân hệ rơi vào trạng thái suy giảm hiệu năng.`
              ]
            },
            trac_nghiem: sNode.trac_nghiem || {
              cau_hoi: `Mục đích của sub-cluster '${sub.name}' là gì?`,
              lua_chon: ['Cung cấp hạ tầng chuyên biệt cho dịch vụ cùng domain', 'Mở public cho toàn bộ Internet kết nối'],
              dung: 0,
              giai_thich: 'Sub-cluster thuộc Bounded Context riêng biệt của phân hệ.'
            },
            trac_nghiem_list: sNode.trac_nghiem_list || generate5StepReflexDrill(sNode.title, sNode.summary, sub.name)
          };

          spawnedSubNodes.push(sEntity);
          spawnedNodes.push(sEntity);
        });

        // Nối dây từ node phù hợp trong service cluster vào entry node của sub-cluster
        if (spawnedSubNodes.length > 0 && spawnedNodes.length > 0) {
          const serviceParentNode = spawnedNodes.find(n => !n.sub_cluster_id) || spawnedNodes[0];
          newEdges.push({
            from: serviceParentNode.id,
            to: spawnedSubNodes[0].id,
            nhan: `${sub.name} Pipeline`,
            kieu: 'duong-xung-em-ai',
            loai_lien_ket: 'LUU_TRU',
            giai_thich: `Liên kết nội bộ phân hệ từ <u>${serviceParentNode.tieu_de}</u> sang Cụm con <u>${sub.name}</u>.`
          });
        }
        subOffsetIdx++;
      }
    }

    // 3. Nối dây vào Cụm Hạ tầng Dùng chung (Option B: Shared Infrastructure Platform)
    // Nếu cụm đã có Sub-Clusters hạ tầng riêng biệt thì không tự ý tạo thêm node hạ tầng dùng chung
    const connectInfra = (payload.sub_clusters && payload.sub_clusters.length > 0)
      ? []
      : (payload.connect_to_shared_infra || []);
    let infraNodes = current.nodes.filter(n => n.cluster_id?.includes('infra') || n.cluster_id === 'cum-shared-infrastructure' || n.domain_id === 'domain-shared-infra');
    let existingDb = infraNodes.find(n => n.id.includes('db') || n.id.includes('postgres') || n.id.includes('acid') || n.bieu_tuong === 'khoi_tru_database');
    let existingCache = infraNodes.find(n => n.id.includes('redis') || n.id.includes('cache') || n.bieu_tuong === 'bo_nho_dem_cache');
    let existingQueue = infraNodes.find(n => n.id.includes('queue') || n.id.includes('kafka') || n.bieu_tuong === 'hang_doi_message_queue');

    if (connectInfra.length > 0) {
      const mainServiceNodes = spawnedNodes.slice(0, nodesToSpawn.length);

      if (connectInfra.includes('cache')) {
        if (!existingCache && spawnedNodes.length + current.nodes.length < MAX_GRAPH_NODES) {
          const cacheId = 'node-shared-redis';
          existingCache = {
            id: cacheId,
            domain_id: 'domain-shared-infra',
            cluster_id: 'cum-shared-infrastructure',
            is_public_interface: true,
            infra_type: 'redis',
            bieu_tuong: 'bo_nho_dem_cache',
            tieu_de: 'Cụm Redis RAM Cache & Lock',
            nhan_buoc: 'CACHE / DISTRIBUTED LOCK',
            tom_tat: 'Bộ nhớ đệm tốc độ cao và phân phối khóa phân tán (Distributed Lock) toàn hệ thống.',
            toa_do: { x: startX + 650, y: startY + 260 },
            tam: { x: startX + 760, y: startY + 332 },
            fully_explored: true,
            hoat_hoa: { mau: 'doc_cache_nhanh', tham_so: { cache: 'REDIS MESH', toc_do: '1ms' } },
            chi_tiet: {
              phan_loai: 'HẠ TẦNG DÙNG CHUNG',
              tieu_de: 'Cụm Redis RAM Cache & Lock',
              ban_chat: 'Hạ tầng bộ nhớ đệm dùng chung cung cấp tốc độ phản hồi 1ms.',
              chu_thich_so_do: 'Nền tảng hạ tầng kỹ thuật chung (Shared Infrastructure Platform)',
              ca_thuc_te: ['Chia sẻ khóa phân tán cho các dịch vụ microservices'],
              rui_ro: ['Tràn RAM nếu thiếu chính sách eviction LRU']
            },
            trac_nghiem: { cau_hoi: 'Redis dùng chung cho mục đích gì?', lua_chon: ['Distributed Lock & Cache', 'Lưu trữ lạnh'], dung: 0, giai_thich: 'Cache dùng chung.' }
          };
          spawnedNodes.push(existingCache);
        }

        if (existingCache) {
          const clientNode = mainServiceNodes.find(n => n.tieu_de.toLowerCase().includes('rate') || n.tieu_de.toLowerCase().includes('lock') || n.tieu_de.toLowerCase().includes('cache')) || mainServiceNodes[0];
          if (clientNode && clientNode.id !== existingCache.id) {
            newEdges.push({
              from: clientNode.id,
              to: existingCache.id,
              nhan: 'Shared Cache / Lock',
              kieu: 'duong-xung-em-ai',
              loai_lien_ket: 'HOA_GIAI',
              giai_thich: `Kết nối từ <u>${clientNode.tieu_de}</u> sang <u>${existingCache.tieu_de}</u> thuộc Cụm Hạ tầng Kỹ thuật dùng chung.`
            });
          }
        }
      }

      if (connectInfra.includes('queue')) {
        if (!existingQueue && spawnedNodes.length + current.nodes.length < MAX_GRAPH_NODES) {
          const queueId = 'node-shared-queue';
          existingQueue = {
            id: queueId,
            domain_id: 'domain-shared-infra',
            cluster_id: 'cum-shared-infrastructure',
            is_public_interface: true,
            infra_type: 'kafka',
            bieu_tuong: 'hang_doi_message_queue',
            tieu_de: 'Hàng đợi Kafka Event Bus',
            nhan_buoc: 'ASYNC / QUEUE BUFFER',
            tom_tat: 'Băng chuyền sự kiện bất đồng bộ điều tiết lưu lượng và phân phối event liên dịch vụ.',
            toa_do: { x: startX + 650, y: startY },
            tam: { x: startX + 760, y: startY + 72 },
            fully_explored: true,
            hoat_hoa: { mau: 'hang_doi_dieu_tiet', tham_so: { buffer: 'KAFKA BUS', rate: '100k msg/s' } },
            chi_tiet: {
              phan_loai: 'HẠ TẦNG DÙNG CHUNG',
              tieu_de: 'Hàng đợi Kafka Event Bus',
              ban_chat: 'Event streaming platform cho toàn bộ hệ thống.',
              chu_thich_so_do: 'Message Queue Platform',
              ca_thuc_te: ['Đẩy sự kiện bất đồng bộ giữa các phân hệ'],
              rui_ro: ['Lag partition nếu consumer xử lý chậm']
            },
            trac_nghiem: { cau_hoi: 'Kafka đóng vai trò gì?', lua_chon: ['Message Streaming', 'Static Web Server'], dung: 0, giai_thich: 'Streaming platform.' }
          };
          spawnedNodes.push(existingQueue);
        }

        if (existingQueue) {
          const clientNode = mainServiceNodes.find(n => n.tieu_de.toLowerCase().includes('waf') || n.tieu_de.toLowerCase().includes('event') || n.tieu_de.toLowerCase().includes('stream')) || mainServiceNodes[0];
          if (clientNode && clientNode.id !== existingQueue.id) {
            newEdges.push({
              from: clientNode.id,
              to: existingQueue.id,
              nhan: 'Event Stream Bus',
              kieu: 'duong-xung-em-ai',
              loai_lien_ket: 'HOA_GIAI',
              giai_thich: `Đẩy sự kiện từ <u>${clientNode.tieu_de}</u> sang <u>${existingQueue.tieu_de}</u> thuộc Cụm Hạ tầng Kỹ thuật dùng chung.`
            });
          }
        }
      }

      if (connectInfra.includes('db')) {
        if (!existingDb && spawnedNodes.length + current.nodes.length < MAX_GRAPH_NODES) {
          const dbId = 'node-shared-db';
          existingDb = {
            id: dbId,
            domain_id: 'domain-shared-infra',
            cluster_id: 'cum-shared-infrastructure',
            is_public_interface: true,
            infra_type: 'postgres',
            bieu_tuong: 'khoi_tru_database',
            tieu_de: 'Bảo chứng ACID & Khóa dòng',
            nhan_buoc: 'STORAGE / ACID DB',
            tom_tat: 'Trụ cột cơ sở dữ liệu quan hệ bảo chứng toàn vẹn ACID.',
            toa_do: { x: startX + 650, y: startY + 520 },
            tam: { x: startX + 760, y: startY + 592 },
            fully_explored: true,
            hoat_hoa: { mau: 'luu_tru_acid', tham_so: { db: 'POSTGRES', lock: 'ROW LOCK' } },
            chi_tiet: {
              phan_loai: 'HẠ TẦNG DÙNG CHUNG',
              tieu_de: 'Bảo chứng ACID & Khóa dòng',
              ban_chat: 'Cơ sở dữ liệu trung tâm.',
              chu_thich_so_do: 'ACID Storage',
              ca_thuc_te: ['Lưu trữ giao dịch vĩnh viễn'],
              rui_ro: ['Nghẽn connection nếu thiếu pooling']
            },
            trac_nghiem: { cau_hoi: 'Database dùng cho việc gì?', lua_chon: ['Lưu trữ bền vững ACID', 'Cache tạm'], dung: 0, giai_thich: 'ACID Storage.' }
          };
          spawnedNodes.push(existingDb);
        }

        if (existingDb) {
          const clientNode = mainServiceNodes.find(n => n.tieu_de.toLowerCase().includes('ledger') || n.tieu_de.toLowerCase().includes('db') || n.tieu_de.toLowerCase().includes('storage')) || mainServiceNodes[mainServiceNodes.length - 1];
          if (clientNode && clientNode.id !== existingDb.id) {
            newEdges.push({
              from: clientNode.id,
              to: existingDb.id,
              nhan: 'ACID Persistence',
              kieu: 'duong-xung-em-ai',
              loai_lien_ket: 'LUU_TRU',
              giai_thich: `Lưu trữ dữ liệu bền vững từ <u>${clientNode.tieu_de}</u> xuống <u>${existingDb.tieu_de}</u> thuộc Cụm Hạ tầng Kỹ thuật dùng chung.`
            });
          }
        }
      }
    }

    // 4. Kiểm duyệt Bounded Context và Lưu vào SQLite
    const allCandidateNodes = [...current.nodes, ...spawnedNodes];
    const validatedEdges = validateAndSanitizeEdges(allCandidateNodes, newEdges);

    const updated = sqliteClient.addDeltaNodes(current.id, null, spawnedNodes, validatedEdges);

    return {
      graph: updated || current,
      spawned: true,
      cluster_id: clusterId,
      message: `Đã sinh Cụm '${payload.cluster_name}' gồm ${spawnedNodes.length} node thành công!`
    };
  },

  /**
   * Khôi phục đồ thị về 5 node gốc ban đầu
   */
  async resetToRoot(): Promise<{ graph: GraphData; message: string }> {
    const cleanGraph = createCleanGraph();
    sqliteClient.saveGraph(cleanGraph);
    return { graph: cleanGraph, message: 'Đã dọn sạch toàn bộ đồ thị về canvas mới (0 token).' };
  }
};
