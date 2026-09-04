import { NodeEntity } from '../types/graphTypes.js';

export interface TopicCluster {
  id: string;
  ten_cum: string;
  chu_de_phu: string;
  mau: string;
  icon: string;
  cap_do: 'me' | 'con' | 'doc_lap';
  cum_me_id?: string;
  headerOffsetLeft?: number;
  nodeIds: string[];
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
}

// Kích thước ước tính tiêu chuẩn của thẻ Node Card (width: 220px, height: 145px)
const CARD_WIDTH = 220;
const CARD_HEIGHT = 145;
const PADDING = 34;

/**
 * Xác định Cụm Kiến trúc cho một Node dựa trên phân loại kỹ thuật, nhãn bước và phả hệ mở rộng.
 * Hoàn toàn 0 token AI, chạy thuần client-side.
 */
function determineClusterId(node: NodeEntity, nodeMap: Map<string, NodeEntity>): {
  clusterId: string;
  ten_cum: string;
  chu_de_phu: string;
  mau: string;
  icon: string;
  cap_do: 'me' | 'con' | 'doc_lap';
  cum_me_id?: string;
} {
  const text = `${node.nhan_buoc} ${node.chi_tiet?.phan_loai || ''} ${node.tieu_de} ${node.id}`.toLowerCase();

  // 1. Nhóm Cơ Sở Dữ Liệu & Bảo Chứng ACID (Cụm con thuộc Hệ thống Idempotency)
  if (
    node.bieu_tuong === 'khoi_tru_database' ||
    text.includes('database') ||
    text.includes('acid') ||
    text.includes('khoi_tru_database') ||
    node.id === 'node-tru-db'
  ) {
    return {
      clusterId: 'cum-database-acid',
      ten_cum: 'TẦNG LƯU TRỮ BẢO CHỨNG ACID',
      chu_de_phu: 'Trụ cột toàn vẹn dữ liệu và khóa dòng',
      mau: '#2563EB', // Xanh dương lưu trữ
      icon: 'khoi_tru_database',
      cap_do: 'con',
      cum_me_id: 'cum-idempotency-system'
    };
  }

  // 2. Nhóm Hàng Đợi Message Queue & Bộ Nhớ Đệm Cache (Cụm con thuộc Hệ thống Idempotency)
  if (
    node.bieu_tuong === 'hang_doi_message_queue' ||
    node.bieu_tuong === 'bo_nho_dem_cache' ||
    text.includes('queue') ||
    text.includes('redis') ||
    text.includes('cache') ||
    node.id === 'node-queue' ||
    node.id === 'node-cache'
  ) {
    return {
      clusterId: 'cum-async-buffer',
      ten_cum: 'TẦNG HẠ TẦNG ĐỆM & RAM',
      chu_de_phu: 'Hạ tầng đệm giảm tải bất đồng bộ',
      mau: '#D97706', // Vàng cam hạ tầng
      icon: 'hang_doi_message_queue',
      cap_do: 'con',
      cum_me_id: 'cum-idempotency-system'
    };
  }

  // 3. Nhóm Sàn Thương Mại Điện Tử & Flash Sale (Cụm Độc Lập)
  if (
    node.bieu_tuong === 'hop_kien_hang_domain' ||
    text.includes('tmdt') ||
    text.includes('thương mại') ||
    text.includes('flash sale') ||
    node.id === 'node-tmdt'
  ) {
    return {
      clusterId: 'cum-tmdt-domain',
      ten_cum: 'MIỀN SÀN THƯƠNG MẠI (FLASH SALE)',
      chu_de_phu: 'Bài toán giao thoa cùng bản chất kỹ thuật',
      mau: '#7C3AED', // Tím giao thoa miền
      icon: 'hop_kien_hang_domain',
      cap_do: 'doc_lap'
    };
  }

  // 4. Nhóm Cổng Thanh Toán & Sự Cố Webhook (Cụm Độc Lập)
  if (
    node.bieu_tuong === 'su_co_canh_bao' ||
    text.includes('sự cố') ||
    text.includes('webhook') ||
    text.includes('gateway') ||
    node.id === 'node-su-co'
  ) {
    return {
      clusterId: 'cum-webhook-gateway',
      ten_cum: 'CỔNG THANH TOÁN & WEBHOOK',
      chu_de_phu: 'Phân hệ tiếp nhận và xử lý sự cố mạng',
      mau: '#DC2626', // Đỏ cảnh báo
      icon: 'su_co_canh_bao',
      cap_do: 'doc_lap'
    };
  }

  // 5. Nhóm Phòng Thủ Biên & Chống DDoS / WAF (Cụm Độc Lập)
  if (
    text.includes('ddos') ||
    text.includes('waf') ||
    text.includes('rate limit') ||
    text.includes('cloudflare') ||
    node.id.includes('ddos')
  ) {
    return {
      clusterId: 'cum-edge-waf',
      ten_cum: 'LÁ CHẮN BIÊN & CHỐNG DDOS',
      chu_de_phu: 'Phân hệ phòng thủ tầng mạng và WAF',
      mau: '#4338CA', // Màu chàm phòng thủ biên
      icon: 'khien_bao_ve',
      cap_do: 'doc_lap'
    };
  }

  // 6. Nhóm Phòng Thủ Idempotency, Tranh Chấp & Khóa Phân Tán (Cụm con thuộc Hệ thống Idempotency)
  if (
    node.bieu_tuong === 'khien_bao_ve' ||
    node.bieu_tuong === 'tranh_chap_phan_nhanh' ||
    text.includes('idempotency') ||
    text.includes('tranh chấp') ||
    text.includes('phòng thủ') ||
    node.id === 'node-khien-khoa' ||
    node.id === 'node-tranh-chap'
  ) {
    return {
      clusterId: 'cum-idempotency-app',
      ten_cum: 'TẦNG ỨNG DỤNG & LÁ CHẮN KHÓA',
      chu_de_phu: 'Khử trùng lặp giao dịch & Race Condition',
      mau: '#059669', // Xanh ngọc an toàn
      icon: 'khien_bao_ve',
      cap_do: 'con',
      cum_me_id: 'cum-idempotency-system'
    };
  }

  // 6. Kế thừa cụm từ node cha nếu là nhánh mở rộng mới không thuộc phân loại trên
  if (node.parent_id && nodeMap.has(node.parent_id)) {
    const parentNode = nodeMap.get(node.parent_id)!;
    return determineClusterId(parentNode, nodeMap);
  }

  // Mặc định: Phân hệ Kiến trúc mở rộng
  return {
    clusterId: `cum-${node.id.replace('node-', '')}`,
    ten_cum: node.chi_tiet?.phan_loai || node.tieu_de.toUpperCase(),
    chu_de_phu: node.nhan_buoc,
    mau: '#4B5563',
    icon: node.bieu_tuong,
    cap_do: 'doc_lap'
  };
}

/**
 * Tính toán toàn bộ các Cụm Topic từ danh sách node hiện có trên Canvas.
 * Tự động tính toán Cụm Lồng Cụm (Nested Clusters 2 Tầng).
 */
export function computeClusters(nodes: NodeEntity[]): TopicCluster[] {
  if (!nodes || nodes.length === 0) return [];

  const nodeMap = new Map<string, NodeEntity>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  const clusterGroups = new Map<string, {
    info: ReturnType<typeof determineClusterId>;
    nodes: NodeEntity[];
  }>();

  // Gom các node vào từng Cụm con hoặc Cụm độc lập
  for (const node of nodes) {
    const info = determineClusterId(node, nodeMap);
    if (!clusterGroups.has(info.clusterId)) {
      clusterGroups.set(info.clusterId, { info, nodes: [] });
    }
    clusterGroups.get(info.clusterId)!.nodes.push(node);
  }

  const subClusters: TopicCluster[] = [];

  // Tính Bounding Box cho từng Cụm con / độc lập
  for (const [id, group] of clusterGroups.entries()) {
    const cNodes = group.nodes;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const n of cNodes) {
      minX = Math.min(minX, n.toa_do.x);
      minY = Math.min(minY, n.toa_do.y);
      maxX = Math.max(maxX, n.toa_do.x + CARD_WIDTH);
      maxY = Math.max(maxY, n.toa_do.y + CARD_HEIGHT);
    }

    // Thêm padding kỹ thuật
    const paddedMinX = minX - PADDING;
    const paddedMinY = minY - PADDING - 20; // Thêm không gian cho Header Topic
    const paddedMaxX = maxX + PADDING;
    const paddedMaxY = maxY + PADDING;

    const width = paddedMaxX - paddedMinX;
    const height = paddedMaxY - paddedMinY;

    subClusters.push({
      id,
      ten_cum: group.info.ten_cum,
      chu_de_phu: group.info.chu_de_phu,
      mau: group.info.mau,
      icon: group.info.icon,
      cap_do: group.info.cap_do,
      cum_me_id: group.info.cum_me_id,
      nodeIds: cNodes.map(n => n.id),
      bounds: {
        minX: paddedMinX,
        minY: paddedMinY,
        maxX: paddedMaxX,
        maxY: paddedMaxY,
        width,
        height,
        centerX: paddedMinX + width / 2,
        centerY: paddedMinY + height / 2
      }
    });
  }

  // Tạo Cụm Mẹ bao bọc (Nested Outer Cluster) cho Hệ Thống Phòng Thủ Idempotency
  const idempotencySubs = subClusters.filter(c => c.cum_me_id === 'cum-idempotency-system');
  const results: TopicCluster[] = [];

  if (idempotencySubs.length > 0) {
    let outerMinX = Infinity;
    let outerMinY = Infinity;
    let outerMaxX = -Infinity;
    let outerMaxY = -Infinity;
    const outerNodeIds: string[] = [];

    for (const sub of idempotencySubs) {
      outerMinX = Math.min(outerMinX, sub.bounds.minX);
      outerMinY = Math.min(outerMinY, sub.bounds.minY);
      outerMaxX = Math.max(outerMaxX, sub.bounds.maxX);
      outerMaxY = Math.max(outerMaxY, sub.bounds.maxY);
      outerNodeIds.push(...sub.nodeIds);
    }

    const PADDING_OUTER = 22;
    const paddedOuterMinX = outerMinX - PADDING_OUTER;
    const paddedOuterMinY = outerMinY - PADDING_OUTER - 26; // Thêm không gian cho Thẻ Tiêu đề Cụm Mẹ
    const paddedOuterMaxX = outerMaxX + PADDING_OUTER;
    const paddedOuterMaxY = outerMaxY + PADDING_OUTER;

    const outerWidth = paddedOuterMaxX - paddedOuterMinX;
    const outerHeight = paddedOuterMaxY - paddedOuterMinY;

    // Đưa Cụm Mẹ vào đầu danh sách để vẽ bên dưới các Cụm con
    results.push({
      id: 'cum-idempotency-system',
      ten_cum: 'HỆ THỐNG PHÒNG THỦ IDEMPOTENCY',
      chu_de_phu: 'Khử trùng lặp giao dịch & Bảo chứng toàn vẹn ACID',
      mau: '#059669',
      icon: 'khien_bao_ve',
      cap_do: 'me',
      headerOffsetLeft: 270, // Đặt tiêu đề tại khoảng trống giữa 2 cột để không bị đường nối Sự cố đè lên
      nodeIds: outerNodeIds,
      bounds: {
        minX: paddedOuterMinX,
        minY: paddedOuterMinY,
        maxX: paddedOuterMaxX,
        maxY: paddedOuterMaxY,
        width: outerWidth,
        height: outerHeight,
        centerX: paddedOuterMinX + outerWidth / 2,
        centerY: paddedOuterMinY + outerHeight / 2
      }
    });
  }

  // Thêm tất cả các cụm con và cụm độc lập vào danh sách kết xuất
  results.push(...subClusters);

  return results;
}
