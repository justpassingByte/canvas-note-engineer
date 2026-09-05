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

// Kích thước chuẩn bao gồm cả Icon Pod tròn và Thẻ Nhãn chữ nhật bên dưới (width: 225px, height: 215px)
const CARD_WIDTH = 225;
const CARD_HEIGHT = 215;

// Khoảng đệm rộng rãi (Generous Breathing Room) nới rộng khung cụm chống dính mép
const PADDING_X = 52;       // Đệm rộng 52px hai bên hông (trái / phải)
const PADDING_TOP = 64;     // Đệm 64px phía trên để thẻ Tiêu đề Cụm không chạm node
const PADDING_BOTTOM = 46;  // Đệm 46px phía dưới đáy cụm

/**
 * Xác định Cụm Kiến trúc cho một Node dựa trên ID, phả hệ cha-con hoặc phân loại kỹ thuật.
 * Hoàn toàn 0 token AI, chạy thuần client-side.
 */
export function determineClusterId(node: NodeEntity, nodeMap: Map<string, NodeEntity>): {
  clusterId: string;
  ten_cum: string;
  chu_de_phu: string;
  mau: string;
  icon: string;
  cap_do: 'me' | 'con' | 'doc_lap';
  cum_me_id?: string;
} {
  // 1. Nếu node có cluster_id tường minh
  if (node.cluster_id) {
    let clusterColor = '#6366F1';
    const cId = node.cluster_id.toLowerCase();
    if (cId.includes('zero-trust') || cId.includes('auth')) clusterColor = '#10B981';
    else if (cId.includes('waf') || cId.includes('ddos') || cId.includes('rate')) clusterColor = '#6366F1';
    else if (cId.includes('audit') || cId.includes('merkle') || cId.includes('kiem-toan')) clusterColor = '#F59E0B';
    else if (cId.includes('queue') || cId.includes('async')) clusterColor = '#D97706';
    else if (cId.includes('db') || cId.includes('acid') || cId.includes('data')) clusterColor = '#2563EB';
    else if (node.hoat_hoa?.mau && node.hoat_hoa.mau.startsWith('#')) clusterColor = node.hoat_hoa.mau;

    return {
      clusterId: node.cluster_id,
      ten_cum: node.chi_tiet?.phan_loai || node.tieu_de.toUpperCase(),
      chu_de_phu: node.nhan_buoc,
      mau: clusterColor,
      icon: node.bieu_tuong,
      cap_do: 'doc_lap'
    };
  }

  // 2. Kế thừa cụm từ node cha nếu có liên kết phả hệ
  if (node.parent_id && nodeMap.has(node.parent_id)) {
    const parentNode = nodeMap.get(node.parent_id)!;
    return determineClusterId(parentNode, nodeMap);
  }

  const id = node.id.toLowerCase();

  // 3. Phân hệ Zero Trust & JWT Authentication
  if (id.includes('zero-trust') || id.includes('jwt-pdp') || id.includes('auth')) {
    return {
      clusterId: 'cum-zero-trust',
      ten_cum: 'PHÂN HỆ ZERO-TRUST AUTH',
      chu_de_phu: 'Xác thực mTLS & Phân quyền Policy Enforcement Point',
      mau: '#4F46E5',
      icon: 'khien_bao_ve',
      cap_do: 'doc_lap'
    };
  }

  // 4. Phân hệ Phòng Thủ Trùng Lặp & Khóa Idempotency
  if (
    id === 'node-khien-khoa' ||
    id === 'node-tranh-chap' ||
    id.includes('idempotency')
  ) {
    return {
      clusterId: 'cum-idempotency-app',
      ten_cum: 'PHÂN HỆ PHÒNG THỦ & KHÓA',
      chu_de_phu: 'Khử trùng lặp giao dịch & Race Condition',
      mau: '#059669',
      icon: 'khien_bao_ve',
      cap_do: 'doc_lap'
    };
  }

  // 5. Tầng Hạ Tầng Đệm & Message Queue
  if (
    id === 'node-queue' ||
    id === 'node-cache' ||
    node.bieu_tuong === 'hang_doi_message_queue' ||
    node.bieu_tuong === 'bo_nho_dem_cache'
  ) {
    return {
      clusterId: 'cum-async-buffer',
      ten_cum: 'TẦNG HẠ TẦNG ĐỆM & RAM',
      chu_de_phu: 'Hạ tầng đệm giảm tải bất đồng bộ',
      mau: '#D97706',
      icon: 'hang_doi_message_queue',
      cap_do: 'doc_lap'
    };
  }

  // 6. Tầng Cơ Sở Dữ Liệu & Toàn Vẹn ACID
  if (
    id === 'node-tru-db' ||
    node.bieu_tuong === 'khoi_tru_database'
  ) {
    return {
      clusterId: 'cum-database-acid',
      ten_cum: 'TẦNG LƯU TRỮ BẢO CHỨNG ACID',
      chu_de_phu: 'Trụ cột toàn vẹn dữ liệu và khóa dòng',
      mau: '#2563EB',
      icon: 'khoi_tru_database',
      cap_do: 'doc_lap'
    };
  }

  // 7. Miền Sàn Thương Mại & Flash Sale
  if (
    id === 'node-tmdt' ||
    node.parent_id === 'node-tmdt'
  ) {
    return {
      clusterId: 'cum-tmdt-domain',
      ten_cum: 'MIỀN SÀN THƯƠNG MẠI (FLASH SALE)',
      chu_de_phu: 'Bài toán giao thoa cùng bản chất kỹ thuật',
      mau: '#7C3AED',
      icon: 'hop_kien_hang_domain',
      cap_do: 'doc_lap'
    };
  }

  // 8. Tiếp Nhận Sự Cố & Webhook Gateway
  if (
    id === 'node-su-co' ||
    node.parent_id === 'node-su-co'
  ) {
    return {
      clusterId: 'cum-webhook-gateway',
      ten_cum: 'CỔNG THANH TOÁN & WEBHOOK',
      chu_de_phu: 'Phân hệ tiếp nhận và xử lý sự cố mạng',
      mau: '#DC2626',
      icon: 'su_co_canh_bao',
      cap_do: 'doc_lap'
    };
  }

  // 9. Lá Chắn Biên & Chống DDoS / WAF
  if (
    id.includes('ddos') ||
    id.includes('waf')
  ) {
    return {
      clusterId: 'cum-edge-waf',
      ten_cum: 'LÁ CHẮN BIÊN & CHỐNG DDOS',
      chu_de_phu: 'Phân hệ phòng thủ tầng mạng và WAF',
      mau: '#4338CA',
      icon: 'khien_bao_ve',
      cap_do: 'doc_lap'
    };
  }

  // Mặc định: Phân hệ Kiến trúc mở rộng theo prefix ID của node
  const clusterPrefix = node.parent_id
    ? node.parent_id.replace('node-', '')
    : node.id.replace('node-', '').replace(/-\d+$/, '');

  return {
    clusterId: `cum-${clusterPrefix}`,
    ten_cum: node.chi_tiet?.phan_loai || node.tieu_de.toUpperCase(),
    chu_de_phu: node.nhan_buoc,
    mau: node.hoat_hoa?.mau || '#4F46E5',
    icon: node.bieu_tuong,
    cap_do: 'doc_lap'
  };
}

/**
 * Tính toán các Cụm Topic từ danh sách node hiển thị trên Canvas.
 * - Single-Level Clusters: Không lồng Cụm Mẹ gây trùng lặp viền nét đứt.
 * - Min Nodes Filter (mặc định >= 2): Chỉ vẽ viền cụm khi có từ 2 node trở lên.
 *   Node đơn lẻ đứng độc lập sạch sẽ, không bị bao bởi hộp thừa.
 */
export function computeClusters(nodes: NodeEntity[], minNodes: number = 2): TopicCluster[] {
  if (!nodes || nodes.length === 0) return [];

  const nodeMap = new Map<string, NodeEntity>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  const clusterGroups = new Map<string, {
    info: ReturnType<typeof determineClusterId>;
    nodes: NodeEntity[];
  }>();

  // Gom các node vào từng Cụm
  for (const node of nodes) {
    const info = determineClusterId(node, nodeMap);
    if (!clusterGroups.has(info.clusterId)) {
      clusterGroups.set(info.clusterId, { info, nodes: [] });
    }
    clusterGroups.get(info.clusterId)!.nodes.push(node);
  }

  const clusters: TopicCluster[] = [];

  // Tính Bounding Box cho từng Cụm
  for (const [id, group] of clusterGroups.entries()) {
    const cNodes = group.nodes;

    // Chỉ tạo khung cụm nếu số lượng node đạt ngưỡng (mặc định >= 2)
    if (cNodes.length < minNodes) {
      continue;
    }

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

    const paddedMinX = minX - PADDING_X;
    const paddedMinY = minY - PADDING_TOP;
    const paddedMaxX = maxX + PADDING_X;
    const paddedMaxY = maxY + PADDING_BOTTOM;

    const width = paddedMaxX - paddedMinX;
    const height = paddedMaxY - paddedMinY;

    clusters.push({
      id,
      ten_cum: group.info.ten_cum,
      chu_de_phu: group.info.chu_de_phu,
      mau: group.info.mau,
      icon: group.info.icon,
      cap_do: group.info.cap_do,
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

  return clusters;
}
