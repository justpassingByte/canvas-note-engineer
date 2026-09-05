import { NodeEntity } from '../types/graphTypes.js';

export type PortDirection = 'top' | 'bottom' | 'left' | 'right';

export interface Point {
  x: number;
  y: number;
}

export interface EdgePathResult {
  pathD: string;
  midX: number;
  midY: number;
  sourcePoint: Point;
  targetPoint: Point;
}

const CARD_WIDTH = 220;
const CARD_HEIGHT = 145;

/**
 * Lấy tọa độ 4 cổng neo kỹ thuật trên bounding box của node (bao gồm cả Icon Pod và Thẻ nhãn)
 */
export function getNodePorts(node: NodeEntity): Record<PortDirection, Point> {
  const x = node.toa_do.x;
  const y = node.toa_do.y;
  const centerX = x + 110;
  const centerY = y + 70;

  return {
    // Cổng trên: Ngay đỉnh chóp của Icon Pod
    top: { x: centerX, y: y },
    // Cổng dưới: Ngay đáy viền của thẻ nhãn chữ nhật (y + 145)
    bottom: { x: centerX, y: y + CARD_HEIGHT },
    // Cổng trái: Ngay giữa cạnh sườn trái của thẻ
    left: { x: x, y: centerY },
    // Cổng phải: Ngay giữa cạnh sườn phải của thẻ
    right: { x: x + CARD_WIDTH, y: centerY }
  };
}

/**
 * Tự động tìm cặp cổng xuất và cổng nhập tối ưu nhất dựa trên góc tương đối giữa 2 node
 */
export function getOptimalPorts(
  fromNode: NodeEntity,
  toNode: NodeEntity
): { sourcePort: PortDirection; targetPort: PortDirection } {
  const fromCenterX = fromNode.toa_do.x + CARD_WIDTH / 2;
  const fromCenterY = fromNode.toa_do.y + CARD_HEIGHT / 2;

  const toCenterX = toNode.toa_do.x + CARD_WIDTH / 2;
  const toCenterY = toNode.toa_do.y + CARD_HEIGHT / 2;

  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;

  // Nếu lệch theo trục dọc nhiều hơn hoặc bằng trục ngang
  if (Math.abs(dy) >= Math.abs(dx) * 0.8) {
    if (dy > 0) {
      // Node đích nằm phía dưới Node nguồn -> Xuất Đáy, Nhập Đỉnh
      return { sourcePort: 'bottom', targetPort: 'top' };
    } else {
      // Node đích nằm phía trên Node nguồn -> Xuất Đỉnh, Nhập Đáy
      return { sourcePort: 'top', targetPort: 'bottom' };
    }
  } else {
    if (dx > 0) {
      // Node đích nằm phía bên phải -> Xuất Phải, Nhập Trái
      return { sourcePort: 'right', targetPort: 'left' };
    } else {
      // Node đích nằm phía bên trái -> Xuất Trái, Nhập Phải
      return { sourcePort: 'left', targetPort: 'right' };
    }
  }
}

/**
 * Tính toán đường cong Cubic Bezier mượt mà tiếp xúc vuông góc 90 độ vào mép cổng
 */
export function calculateEdgePath(fromNode: NodeEntity, toNode: NodeEntity): EdgePathResult {
  const fromPorts = getNodePorts(fromNode);
  const toPorts = getNodePorts(toNode);
  const { sourcePort, targetPort } = getOptimalPorts(fromNode, toNode);

  const p0 = fromPorts[sourcePort];
  const p3 = toPorts[targetPort];

  const dist = Math.hypot(p3.x - p0.x, p3.y - p0.y);
  const curvature = Math.max(35, Math.min(dist * 0.45, 120));

  let p1: Point = { ...p0 };
  let p2: Point = { ...p3 };

  // Điểm điều khiển p1 xuất phát vuông góc với cổng nguồn
  switch (sourcePort) {
    case 'bottom': p1.y += curvature; break;
    case 'top': p1.y -= curvature; break;
    case 'right': p1.x += curvature; break;
    case 'left': p1.x -= curvature; break;
  }

  // Điểm điều khiển p2 tiếp cận vuông góc với cổng đích
  switch (targetPort) {
    case 'bottom': p2.y += curvature; break;
    case 'top': p2.y -= curvature; break;
    case 'right': p2.x += curvature; break;
    case 'left': p2.x -= curvature; break;
  }

  // Chuỗi lệnh SVG Cubic Bezier: M p0 C p1, p2, p3
  const pathD = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;

  // Tính tọa độ điểm giữa trên đường cong Bezier tại t = 0.5:
  // B(t) = (1-t)^3 * p0 + 3*(1-t)^2 * t * p1 + 3*(1-t) * t^2 * p2 + t^3 * p3
  const t = 0.5;
  const mt = 1 - t;
  const midX = mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x;
  const midY = mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y;

  return {
    pathD,
    midX,
    midY,
    sourcePoint: p0,
    targetPoint: p3
  };
}
