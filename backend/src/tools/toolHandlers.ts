import { sqliteClient } from '../db/sqliteClient.js';
import { INITIAL_PAYMENT_GRAPH, DELTA_NODES_QUEUE_CACHE } from '../data/defaultGraph.js';
import { GraphData, NodeEntity, EdgeEntity, ExpandPayload, PrunePayload, SpawnClusterPayload } from '../types/graphTypes.js';

/**
 * Chuẩn hóa nhãn phân tầng kiến trúc (Architectural Layer Standard)
 * CẤM tiền tố số thứ tự (BƯỚC 1 //, BƯỚC 2 //, Step 1:, ...)
 * Đảm bảo mọi Agent khi sinh ra node mới đều tuân thủ phân tầng chuẩn.
 */
export function sanitizeNodeLayerLabel(rawLabel?: string, contextHint?: string): string {
  if (!rawLabel && !contextHint) return 'ARCHITECTURE / COMPONENT';

  let cleaned = (rawLabel || '').trim();

  // 1. Gỡ bỏ mọi tiền tố số bước
  cleaned = cleaned.replace(/^(bước|buoc|step)\s*[\d\.]+\s*(\/\/|:|-)?\s*/i, '');
  cleaned = cleaned.replace(/^[\d\.]+\s*(\/\/|:|-)\s*/i, '');
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
      nhan: sanitizeProtocolEdgeLabel(edge.nhan),
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
  title?: string;
  category?: string;
  description?: string;
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

    const existingDb = current.nodes.find(n => n.id === 'node-tru-db' || n.bieu_tuong === 'khoi_tru_database');
    const existingCache = current.nodes.find(n => n.id === 'node-cache' || n.id.includes('redis') || n.bieu_tuong === 'bo_nho_dem_cache');
    const existingQueue = current.nodes.find(n => n.id === 'node-queue' || n.id.includes('queue') || n.bieu_tuong === 'hang_doi_message_queue');

    // 1. TÁI SỬ DỤNG THÔNG MINH (SMART REUSE) - TUYỆT ĐỐI KHÔNG TRÙNG LẶP HẠ TẦNG
    if (typeLower.includes('db') || typeLower.includes('database') || typeLower.includes('acid')) {
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
        const validated = addedEdges.length > 0
          ? validateAndSanitizeEdges(current.nodes, addedEdges)
          : [];
        const updated = validated.length > 0
          ? sqliteClient.addDeltaNodes(current.id, null, [], validated)
          : current;

        return {
          graph: updated || current,
          spawned: true,
          message: `Đã tái sử dụng Trụ ACID Database duy nhất ('${existingDb.tieu_de}') - Chống trùng lặp tầng dữ liệu!`,
          node: existingDb
        };
      }
    }

    if (typeLower.includes('cache') || typeLower.includes('redis')) {
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
        const validated = addedEdges.length > 0
          ? validateAndSanitizeEdges(current.nodes, addedEdges)
          : [];
        const updated = validated.length > 0
          ? sqliteClient.addDeltaNodes(current.id, null, [], validated)
          : current;

        return {
          graph: updated || current,
          spawned: true,
          message: `Đã tái sử dụng node Bộ nhớ đệm Redis Cache duy nhất ('${existingCache.tieu_de}')!`,
          node: existingCache
        };
      }
    }

    if (typeLower.includes('queue') || typeLower.includes('kafka') || typeLower.includes('rabbit')) {
      if (existingQueue) {
        const addedEdges: EdgeEntity[] = [];
        if (targetNode && targetNode.id !== existingQueue.id) {
          addedEdges.push({
            from: targetNode.id,
            to: existingQueue.id,
            nhan: 'Đẩy vào Queue bất đồng bộ',
            kieu: 'duong-xung-em-ai',
            loai_lien_ket: 'HOA_GIAI'
          });
        }
        const validated = addedEdges.length > 0
          ? validateAndSanitizeEdges(current.nodes, addedEdges)
          : [];
        const updated = validated.length > 0
          ? sqliteClient.addDeltaNodes(current.id, null, [], validated)
          : current;

        return {
          graph: updated || current,
          spawned: true,
          message: `Đã tái sử dụng node Message Queue duy nhất ('${existingQueue.tieu_de}')!`,
          node: existingQueue
        };
      }
    }

    // Xây dựng Cụm Chủ Đề hoàn chỉnh (Root Node + Child Node / Shared Infrastructure Attachment)
    const timestamp = Date.now().toString().slice(-4);
    const slotsAvailable = MAX_GRAPH_NODES - current.nodes.length;
    const canSpawnChild = slotsAvailable >= 2;

    // Tọa độ ưu tiên vị trí click chuột của người dùng, hoặc đặt ở khu vực thoáng phía trên
    const defaultX = payload.position?.x ?? (targetNode ? targetNode.toa_do.x - 260 : 100);
    const defaultY = payload.position?.y ?? (targetNode ? targetNode.toa_do.y : -200);

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

      // Nối dây sang Redis Cache sẵn có nếu có (Multi-parent: Gateway dùng chung Redis Blacklist)
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

      // TÁI SỬ DỤNG NODE CACHE NẾU CÓ (Multi-parent: WAF và Idempotency cùng trỏ vào Redis)
      if (existingCache) {
        newEdges.push({
          from: rootId,
          to: existingCache.id,
          nhan: 'Token Bucket Ingress Count',
          kieu: 'duong-xung-em-ai',
          loai_lien_ket: 'DEM_LOC'
        });
      } else if (canSpawnChild) {
        const childId = `node-rate-limiter-${timestamp}`;
        childNode = {
          id: childId,
          bieu_tuong: 'bo_nho_dem_cache',
          tieu_de: 'Bộ lọc Rate Limiting trượt',
          nhan_buoc: 'EDGE / TRAFFIC SHAPING',
          tom_tat: 'Thuật toán Token Bucket giới hạn tần suất gọi API tối đa 10 req/s mỗi IP.',
          toa_do: { x: defaultX + 260, y: defaultY },
          tam: { x: defaultX + 370, y: defaultY + 72 },
          fully_explored: false,
          parent_id: rootId,
          hoat_hoa: {
            mau: 'rate_limit_sliding',
            tham_so: {
              client: 'API CLIENT',
              waf: 'SLIDING WINDOW',
              cache: 'REDIS RAM BUCKET',
              drop: 'DROP 429',
              pass: 'ALLOW 200'
            }
          },
          chi_tiet: {
            phan_loai: 'CỔNG BẢO VỆ BIÊN & CHỐNG DDOS',
            tieu_de: 'Bộ lọc Rate Limiting trượt',
            ban_chat: 'Triển khai Sliding Window Counter trong Redis để giới hạn lưu lượng theo từng IP hoặc API Key.',
            chu_thich_so_do: 'Thành phần điều tiết lưu lượng chi tiết trong cụm phòng thủ',
            ca_thuc_te: ['Ngăn chặn người dùng spam nút Thanh toán hàng trăm lần mỗi giây'],
            rui_ro: ['Các IP đứng sau NAT gateway chung của mạng công ty có thể bị chặn oan']
          },
          trac_nghiem: {
            cau_hoi: 'Thuật toán nào sau đây phù hợp nhất để Rate Limiting phân tán theo cửa sổ trượt?',
            lua_chon: ['Sliding Window Counter / Token Bucket', 'Sequential File Lock'],
            dung: 0,
            giai_thich: 'Token Bucket và Sliding Window cho phép xử lý các đợt bùng nổ lưu lượng ngắn an toàn.'
          }
        };

        newEdges.push({
          from: rootId,
          to: childId,
          nhan: 'Sliding Window Rate Limit',
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

      // TÁI SỬ DỤNG TRỤ ACID DUY NHẤT (Multi-parent: Audit Log và Idempotency cùng ghi vào DB)
      if (existingDb) {
        newEdges.push({
          from: rootId,
          to: existingDb.id,
          nhan: 'Async Audit Stream',
          kieu: 'duong-xung-em-ai',
          loai_lien_ket: 'LUU_TRU'
        });
      }

      if (canSpawnChild) {
        const childId = `node-tamper-proof-${timestamp}`;
        childNode = {
          id: childId,
          bieu_tuong: 'khien_bao_ve',
          tieu_de: 'Kho Lưu trữ Ký số Mật mã',
          nhan_buoc: 'SECURITY / IMMUTABILITY',
          tom_tat: 'Ký số hàm băm mật mã học chuỗi log (Hash Chain) đảm bảo tính toàn vẹn bất biến.',
          toa_do: { x: defaultX + 260, y: defaultY },
          tam: { x: defaultX + 370, y: defaultY + 72 },
          fully_explored: false,
          parent_id: rootId,
          hoat_hoa: {
            mau: 'audit_hash_chain',
            tham_so: {
              event: 'MERKLE BLOCK',
              hash_node: 'HMAC ENGINE',
              chain: 'HASH TREE LINK',
              immutability: 'PROOF VALID'
            }
          },
          chi_tiet: {
            phan_loai: 'HẠ TẦNG KIỂM TOÁN & TUÂN THỦ',
            tieu_de: 'Kho Lưu trữ Ký số Mật mã',
            ban_chat: 'Liên kết từng block sự kiện bằng SHA-256 HMAC, bất kỳ hành vi sửa đổi nào ở quá khứ sẽ làm gãy toàn bộ chuỗi chứng thực.',
            chu_thich_so_do: 'Thành phần bảo mật toàn vẹn log kiểm toán',
            ca_thuc_te: ['Cung cấp bằng chứng pháp lý không thể chối bỏ khi có tranh chấp gian lận'],
            rui_ro: ['Hiệu năng tính toán hàm băm khi lưu lượng giao dịch đạt hàng chục ngàn req/s']
          },
          trac_nghiem: {
            cau_hoi: 'Giải thuật nào thường dùng để phát hiện nhanh việc một bản ghi log trong quá khứ bị sửa đổi?',
            lua_chon: ['Chuỗi băm liên kết Merkle Tree / Hash Chain', 'Tìm kiếm nhị phân tuần tự'],
            dung: 0,
            giai_thich: 'Merkle Tree và Hash Chain cho phép xác thực tính toàn vẹn của dữ liệu trong thời gian O(log N).'
          }
        };

        newEdges.push({
          from: rootId,
          to: childId,
          nhan: 'Cryptographic Hash Verification',
          kieu: 'duong-xung-em-ai',
          loai_lien_ket: 'LUU_TRU'
        });
      }
    } else {
      // Concept mở rộng linh hoạt cho bất kỳ chủ đề mới nào
      const cleanSlug = typeLower.replace(/[^a-z0-9]/g, '-');
      const formattedTitle = payload.title || payload.concept_type.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const rootId = `node-${cleanSlug}-core-${timestamp}`;
      const childId = `node-${cleanSlug}-sub-${timestamp}`;

      rootNode = {
        id: rootId,
        bieu_tuong: 'hop_kien_hang_domain',
        tieu_de: formattedTitle,
        nhan_buoc: sanitizeNodeLayerLabel(payload.category, formattedTitle),
        tom_tat: payload.description || `Phân hệ kiến trúc ${formattedTitle} được bổ sung độc lập vào hệ thống đồ thị tri thức.`,
        toa_do: { x: defaultX, y: defaultY },
        tam: { x: defaultX + 110, y: defaultY + 72 },
        fully_explored: false,
        hoat_hoa: {
          mau: 'hybrid_flow_adaptive',
          tham_so: {
            nguon: 'CLIENT REQUEST',
            quy_trinh: formattedTitle.toUpperCase(),
            dich: 'TẦNG DỮ LIỆU ĐÍCH',
            ket_qua: 'HOÀN TẤT',
            mau_chu_dao: '#4F46E5'
          }
        },
        chi_tiet: {
          phan_loai: payload.category || `Phân hệ ${formattedTitle}`,
          tieu_de: formattedTitle,
          ban_chat: payload.description || `Phân hệ cốt lõi ${formattedTitle} chịu trách nhiệm tiếp nhận và xử lý các yêu cầu kỹ thuật chuyên biệt.`,
          chu_thich_so_do: `Cụm chủ đề kiến trúc phân hệ ${formattedTitle}`,
          ca_thuc_te: [`Bảo vệ và phân phối tài nguyên cho phân hệ ${formattedTitle}`],
          rui_ro: ['Tăng chi phí tích hợp và độ phức tạp cấu hình mạng']
        },
        trac_nghiem: {
          cau_hoi: `Mục tiêu chính khi bổ sung phân hệ ${formattedTitle} vào kiến trúc là gì?`,
          lua_chon: ['Tăng tính sẵn sàng, độ tin cậy và khả năng mở rộng', 'Tăng độ phức tạp không cần thiết'],
          dung: 0,
          giai_thich: 'Mỗi phân hệ kiến trúc thêm vào đều nhằm củng cố tính toàn vẹn, hiệu năng và khả năng mở rộng độc lập.'
        }
      };

      if (canSpawnChild) {
        childNode = {
          id: childId,
          bieu_tuong: 'hop_kien_hang_domain',
          tieu_de: `Thành phần Xử lý ${formattedTitle}`,
          nhan_buoc: 'COMPUTE / SUB-COMPONENT',
          tom_tat: `Mô-đun thực thi tác vụ nội bộ và duy trì trạng thái cho phân hệ ${formattedTitle}.`,
          toa_do: { x: defaultX + 260, y: defaultY },
          tam: { x: defaultX + 370, y: defaultY + 72 },
          fully_explored: false,
          parent_id: rootId,
          hoat_hoa: {
            mau: 'hybrid_flow_adaptive',
            tham_so: {
              nguon: formattedTitle.toUpperCase(),
              quy_trinh: 'THỰC THI MÔ-ĐUN CON',
              dich: 'LƯU TRỮ TRẠNG THÁI',
              ket_qua: 'ĐỒNG BỘ XONG',
              mau_chu_dao: '#4F46E5'
            }
          },
          chi_tiet: {
            phan_loai: payload.category || `Phân hệ ${formattedTitle}`,
            tieu_de: `Thành phần Xử lý ${formattedTitle}`,
            ban_chat: `Thành phần con liên kết trực tiếp trong cụm chủ đề ${formattedTitle}, chịu trách nhiệm lưu trữ và tính toán chuyên biệt.`,
            chu_thich_so_do: `Mô-đun con thuộc cụm ${formattedTitle}`,
            ca_thuc_te: [`Xử lý song song tác vụ phụ trợ cho ${formattedTitle}`],
            rui_ro: ['Đồng bộ dữ liệu chậm giữa node gốc và node con']
          },
          trac_nghiem: {
            cau_hoi: `Thành phần con đóng vai trò gì trong cụm phân hệ ${formattedTitle}?`,
            lua_chon: ['Chia nhỏ trách nhiệm và tăng tính module hóa', 'Làm chậm toàn bộ hệ thống'],
            dung: 0,
            giai_thich: 'Module hóa kiến trúc giúp hệ thống dễ bảo trì, cô lập lỗi và mở rộng độc lập.'
          }
        };

        newEdges.push({
          from: rootId,
          to: childId,
          nhan: 'Task Dispatch',
          kieu: 'duong-xung-em-ai',
          loai_lien_ket: 'HOA_GIAI'
        });
      }
    }

    // Nếu người dùng chỉ định targetNode thì nối dây từ targetNode vào rootNode
    if (targetNode) {
      newEdges.push({
        from: targetNode.id,
        to: rootNode.id,
        nhan: 'Module Cross-Link',
        kieu: 'duong-xung-em-ai',
        loai_lien_ket: 'HOA_GIAI'
      });
    }

    // Chuẩn hóa nhãn lớp cho tất cả node sinh ra
    rootNode.nhan_buoc = sanitizeNodeLayerLabel(rootNode.nhan_buoc, rootNode.tieu_de);
    if (childNode) {
      childNode.nhan_buoc = sanitizeNodeLayerLabel(childNode.nhan_buoc, childNode.tieu_de);
    }

    const allSpawnedNodes = childNode ? [rootNode, childNode] : [rootNode];

    // Kiểm duyệt liên kết 3 lớp
    const allGraphNodes = [...current.nodes, ...allSpawnedNodes];
    const validatedEdges = newEdges.length > 0
      ? validateAndSanitizeEdges(allGraphNodes, newEdges)
      : [];

    // Lưu vào SQLite
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
   * Sinh Cụm Phân Hệ hoàn chỉnh (Cluster Spawning Engine)
   * Sử dụng Compact Intent Schema: Tiết kiệm >85% token.
   * Tự động tính toán vị trí, liên kết nội bộ và cắm dây vào hạ tầng chung (Cache / Queue / DB).
   */
  async spawnConceptCluster(payload: SpawnClusterPayload): Promise<{
    graph: GraphData;
    spawned: boolean;
    cluster_id: string;
    message: string;
  }> {
    const current = sqliteClient.getCurrentGraph() || INITIAL_PAYMENT_GRAPH;
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

    // Xác định vị trí xuất phát
    const startX = payload.position?.x ?? (current.nodes.length > 0 ? Math.max(...current.nodes.map(n => n.toa_do.x)) + 300 : 100);
    const startY = payload.position?.y ?? -350;

    const nodesToSpawn = payload.nodes.slice(0, slotsAvailable);
    const spawnedNodes: NodeEntity[] = [];
    const newEdges: EdgeEntity[] = [];

    // 1. Khởi tạo các Node trong Cụm
    nodesToSpawn.forEach((cNode, idx) => {
      const nodeSlug = cNode.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `node-${idx}`;
      const nodeId = `node-${nodeSlug}-${timestamp}`;
      const posX = startX + idx * 260;
      const posY = startY;

      // Nhận diện biểu tượng thích hợp
      let badge: NodeEntity['bieu_tuong'] = 'khien_bao_ve';
      const roleLower = (cNode.role || '').toLowerCase();
      const titleLower = cNode.title.toLowerCase();
      if (roleLower.includes('audit') || titleLower.includes('kiểm toán') || titleLower.includes('sổ cái') || titleLower.includes('nhật ký')) {
        badge = 'ghi_chep_so_sach' as any;
      } else if (roleLower.includes('queue') || titleLower.includes('queue') || titleLower.includes('hàng đợi')) {
        badge = 'hang_doi_message_queue';
      } else if (roleLower.includes('cache') || titleLower.includes('cache') || titleLower.includes('redis')) {
        badge = 'bo_nho_dem_cache';
      }

      const entity: NodeEntity = {
        id: nodeId,
        cluster_id: clusterId,
        bieu_tuong: badge,
        tieu_de: cNode.title,
        nhan_buoc: sanitizeNodeLayerLabel(payload.cluster_name, cNode.title),
        tom_tat: cNode.summary,
        toa_do: { x: posX, y: posY },
        tam: { x: posX + 110, y: posY + 72 },
        fully_explored: true,
        hoat_hoa: {
          mau: cNode.schematic_template || 'zero_trust_pep',
          tham_so: {
            actor: 'INGRESS',
            component: cNode.title.toUpperCase(),
            target: 'INTERNAL BUS',
            status: 'PROCESSING'
          }
        },
        chi_tiet: {
          phan_loai: payload.cluster_name.toUpperCase(),
          tieu_de: cNode.title,
          ban_chat: cNode.summary,
          chu_thich_so_do: `Thành phần thuộc ${payload.cluster_name}`,
          ca_thuc_te: [
            `Đảm bảo luồng xử lý tin cậy trong ${payload.cluster_name}`,
            'Tự động phân giải tải và phòng chống lỗi dây chuyền'
          ],
          rui_ro: [
            'Cần giám sát độ trễ và số lượng kết nối đồng thời'
          ]
        },
        trac_nghiem: {
          cau_hoi: `Vai trò chính của '${cNode.title}' là gì?`,
          lua_chon: [cNode.summary.slice(0, 50) + '...', 'Bỏ qua kiểm tra để tăng tốc độ'],
          dung: 0,
          giai_thich: `Thành phần này thực thi nhiệm vụ: ${cNode.summary}`
        }
      };

      spawnedNodes.push(entity);

      // Cạnh nội bộ nối tuần tự các node trong cụm
      if (idx > 0) {
        newEdges.push({
          from: spawnedNodes[idx - 1].id,
          to: nodeId,
          nhan: `Route to ${cNode.title}`,
          kieu: 'duong-xung-em-ai',
          loai_lien_ket: 'HOA_GIAI'
        });
      }
    });

    // 2. Nối dây vào Hạ tầng Dùng chung (Zero Duplication)
    const existingDb = current.nodes.find(n => n.id === 'node-tru-db' || n.bieu_tuong === 'khoi_tru_database');
    const existingCache = current.nodes.find(n => n.id === 'node-cache' || n.id.includes('redis') || n.bieu_tuong === 'bo_nho_dem_cache');
    const existingQueue = current.nodes.find(n => n.id === 'node-queue' || n.id.includes('queue') || n.bieu_tuong === 'hang_doi_message_queue');

    const connectInfra = payload.connect_to_shared_infra || [];
    const pivotNode = spawnedNodes[spawnedNodes.length - 1] || spawnedNodes[0];

    if (pivotNode) {
      if (connectInfra.includes('cache') && existingCache) {
        newEdges.push({
          from: pivotNode.id,
          to: existingCache.id,
          nhan: 'Distributed Lock / Cache Buffer',
          kieu: 'duong-xung-em-ai',
          loai_lien_ket: 'HOA_GIAI'
        });
      }
      if (connectInfra.includes('queue') && existingQueue) {
        newEdges.push({
          from: pivotNode.id,
          to: existingQueue.id,
          nhan: 'Async Ingestion Buffer',
          kieu: 'duong-xung-em-ai',
          loai_lien_ket: 'HOA_GIAI'
        });
      }
      if (connectInfra.includes('db') && existingDb) {
        newEdges.push({
          from: pivotNode.id,
          to: existingDb.id,
          nhan: 'ACID State Persistence',
          kieu: 'duong-xung-em-ai',
          loai_lien_ket: 'LUU_TRU'
        });
      }
    }

    // 3. Kiểm duyệt và Lưu vào SQLite
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
