import { NodeEntity } from '../types/graphTypes.js';

export interface TopicCluster {
  id: string;
  ten_cum: string;
  chu_de_phu: string;
  mau: string;
  icon: string;
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
const PADDING = 38;

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
} {
  // 1. Kế thừa cụm từ node cha nếu là nhánh mở rộng từ [+]
  if (node.parent_id && nodeMap.has(node.parent_id)) {
    const parentNode = nodeMap.get(node.parent_id)!;
    return determineClusterId(parentNode, nodeMap);
  }

  const text = `${node.nhan_buoc} ${node.chi_tiet?.phan_loai || ''} ${node.tieu_de} ${node.id}`.toLowerCase();

  // 2. Nhóm Cổng Thanh Toán & Sự Cố Webhook
  if (text.includes('sự cố') || text.includes('webhook') || text.includes('gateway') || node.bieu_tuong === 'su_co_canh_bao') {
    return {
      clusterId: 'cum-webhook-gateway',
      ten_cum: 'CỔNG THANH TOÁN & WEBHOOK',
      chu_de_phu: 'Phân hệ tiếp nhận và xử lý sự cố mạng',
      mau: '#DC2626', // Đỏ cảnh báo
      icon: 'su_co_canh_bao'
    };
  }

  // 3. Nhóm Phòng Thủ Idempotency, Tranh Chấp & Khóa Phân Tán
  if (text.includes('idempotency') || text.includes('tranh chấp') || text.includes('khóa') || text.includes('phòng thủ') || node.bieu_tuong === 'khien_bao_ve' || node.bieu_tuong === 'tranh_chap_phan_nhanh') {
    return {
      clusterId: 'cum-idempotency-defense',
      ten_cum: 'LÁ CHẮN PHÒNG THỦ IDEMPOTENCY',
      chu_de_phu: 'Khử trùng lặp giao dịch & Race Condition',
      mau: '#059669', // Xanh ngọc an toàn
      icon: 'khien_bao_ve'
    };
  }

  // 4. Nhóm Cơ Sở Dữ Liệu & Bảo Chứng ACID
  if (text.includes('database') || text.includes('acid') || text.includes('unique') || text.includes('lưu trữ') || node.bieu_tuong === 'khoi_tru_database') {
    return {
      clusterId: 'cum-database-acid',
      ten_cum: 'CƠ SỞ DỮ LIỆU & BẢO CHỨNG ACID',
      chu_de_phu: 'Trụ cột toàn vẹn dữ liệu và khóa dòng',
      mau: '#2563EB', // Xanh dương lưu trữ
      icon: 'khoi_tru_database'
    };
  }

  // 5. Nhóm Sàn Thương Mại Điện Tử & Flash Sale
  if (text.includes('tmdt') || text.includes('thương mại') || text.includes('flash sale') || node.bieu_tuong === 'hop_kien_hang_domain') {
    return {
      clusterId: 'cum-tmdt-domain',
      ten_cum: 'MIỀN SÀN THƯƠNG MẠI (FLASH SALE)',
      chu_de_phu: 'Bài toán giao thoa cùng bản chất kỹ thuật',
      mau: '#7C3AED', // Tím giao thoa miền
      icon: 'hop_kien_hang_domain'
    };
  }

  // 6. Nhóm Hàng Đợi Message Queue & Bộ Nhớ Đệm Cache
  if (text.includes('queue') || text.includes('cache') || node.bieu_tuong === 'hang_doi_message_queue' || node.bieu_tuong === 'bo_nho_dem_cache') {
    return {
      clusterId: 'cum-async-buffer',
      ten_cum: 'MESSAGE QUEUE & BỘ NHỚ ĐỆM',
      chu_de_phu: 'Hạ tầng đệm giảm tải bất đồng bộ',
      mau: '#D97706', // Vàng cam hạ tầng
      icon: 'hang_doi_message_queue'
    };
  }

  // Mặc định: Phân hệ Kiến trúc mở rộng
  return {
    clusterId: `cum-${node.id.replace('node-', '')}`,
    ten_cum: node.chi_tiet?.phan_loai || node.tieu_de.toUpperCase(),
    chu_de_phu: node.nhan_buoc,
    mau: '#4B5563',
    icon: node.bieu_tuong
  };
}

/**
 * Tính toán toàn bộ các Cụm Topic từ danh sách node hiện có trên Canvas.
 * Tự động gom node và tính toán Bounding Box 2D có viền đệm an toàn.
 */
export function computeClusters(nodes: NodeEntity[]): TopicCluster[] {
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

  const results: TopicCluster[] = [];

  // Tính Bounding Box cho từng Cụm
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
    const paddedMinY = minY - PADDING - 24; // Thêm không gian cho Header Topic phía trên
    const paddedMaxX = maxX + PADDING;
    const paddedMaxY = maxY + PADDING;

    const width = paddedMaxX - paddedMinX;
    const height = paddedMaxY - paddedMinY;

    results.push({
      id,
      ten_cum: group.info.ten_cum,
      chu_de_phu: group.info.chu_de_phu,
      mau: group.info.mau,
      icon: group.info.icon,
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

  return results;
}
