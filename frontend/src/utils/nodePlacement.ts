import { NodeEntity } from '../types/graphTypes.js';

export const CARD_WIDTH = 220;
export const CARD_HEIGHT = 145;
export const BUFFER_X = 80;
export const BUFFER_Y = 70;

/**
 * Kiểm tra xem hình chữ nhật bao quanh vị trí (x, y) có va chạm với bất kỳ node nào khác không
 */
export function isNodeColliding(
  x: number,
  y: number,
  otherNodes: NodeEntity[],
  ignoreNodeId?: string
): boolean {
  const boxLeft = x - BUFFER_X;
  const boxRight = x + CARD_WIDTH + BUFFER_X;
  const boxTop = y - BUFFER_Y;
  const boxBottom = y + CARD_HEIGHT + BUFFER_Y;

  for (const node of otherNodes) {
    if (ignoreNodeId && node.id === ignoreNodeId) continue;

    const otherLeft = node.toa_do.x;
    const otherRight = node.toa_do.x + CARD_WIDTH;
    const otherTop = node.toa_do.y;
    const otherBottom = node.toa_do.y + CARD_HEIGHT;

    // Kiểm tra giao cắt trục X và trục Y
    const overlapX = boxLeft < otherRight && boxRight > otherLeft;
    const overlapY = boxTop < otherBottom && boxBottom > otherTop;

    if (overlapX && overlapY) {
      return true; // Có va chạm
    }
  }

  return false;
}

/**
 * Dò tìm ô trống tối ưu theo thuật toán xoắn ốc (Spiral Slot Search) bắt đầu từ vị trí ưu tiên.
 * Đảm bảo 100% tìm được vị trí không va chạm với bất kỳ node nào.
 */
export function findAvailableSlot(
  preferredX: number,
  preferredY: number,
  existingNodes: NodeEntity[],
  ignoreNodeId?: string
): { x: number; y: number } {
  // Nếu vị trí ưu tiên đã hoàn toàn thông thoáng thì dùng ngay
  if (!isNodeColliding(preferredX, preferredY, existingNodes, ignoreNodeId)) {
    return { x: Math.round(preferredX), y: Math.round(preferredY) };
  }

  // Bán kính bước nhảy
  const stepX = CARD_WIDTH + BUFFER_X;  // ~285px
  const stepY = CARD_HEIGHT + BUFFER_Y; // ~200px

  // Các hướng phân nhánh ưu tiên: [phải-trên, phải-dưới, phải, dưới, trên, trái-dưới, trái-trên]
  const offsets = [
    { dx: 0, dy: -stepY },
    { dx: 0, dy: stepY },
    { dx: stepX, dy: 0 },
    { dx: stepX, dy: -stepY * 0.8 },
    { dx: stepX, dy: stepY * 0.8 },
    { dx: stepX * 1.5, dy: 0 },
    { dx: stepX * 1.5, dy: -stepY },
    { dx: stepX * 1.5, dy: stepY },
    { dx: -stepX, dy: 0 },
    { dx: -stepX, dy: stepY },
    { dx: 0, dy: stepY * 2 },
    { dx: 0, dy: -stepY * 2 }
  ];

  for (const offset of offsets) {
    const candidateX = preferredX + offset.dx;
    const candidateY = preferredY + offset.dy;

    // Cho phép tọa độ âm hợp lệ trong không gian 2D Canvas vô tận
    if (!isNodeColliding(candidateX, candidateY, existingNodes, ignoreNodeId)) {
      return { x: Math.round(candidateX), y: Math.round(candidateY) };
    }
  }

  // Fallback an toàn: Dịch sang phía ngoài cùng bên phải của đồ thị
  const maxRightX = existingNodes.length > 0
    ? Math.max(...existingNodes.map(n => n.toa_do.x + CARD_WIDTH))
    : 800;
  return {
    x: Math.round(maxRightX + BUFFER_X + 40),
    y: Math.round(preferredY)
  };
}

/**
 * Quét và giải quyết triệt để mọi va chạm trong đồ thị.
 * Tự động sắp xếp vị trí hình nan quạt (Fanout) có trật tự cho các node con mở rộng từ node cha.
 */
export function resolveNodeCollisions(nodes: NodeEntity[]): NodeEntity[] {
  const result: NodeEntity[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Đếm số lượng con của từng cha để tính offset phân nhánh đều
  const childIndexMap = new Map<string, { current: number; total: number }>();
  for (const node of nodes) {
    if (node.parent_id && nodeMap.has(node.parent_id)) {
      const info = childIndexMap.get(node.parent_id) || { current: 0, total: 0 };
      info.total += 1;
      childIndexMap.set(node.parent_id, info);
    }
  }

  for (const node of nodes) {
    let targetX = node.toa_do.x;
    let targetY = node.toa_do.y;

    // Nếu node có parent, sắp xếp theo nan quạt đối xứng sang bên phải của node cha
    if (node.parent_id && nodeMap.has(node.parent_id)) {
      const parent = nodeMap.get(node.parent_id)!;
      const childInfo = childIndexMap.get(node.parent_id)!;
      const idx = childInfo.current;
      childInfo.current += 1;

      // Tính toán độ lệch Y đối xứng (Fanout Offset)
      let offsetY = 0;
      if (childInfo.total === 1) {
        offsetY = 0;
      } else if (childInfo.total === 2) {
        offsetY = idx === 0 ? -65 : 75;
      } else {
        offsetY = (idx - (childInfo.total - 1) / 2) * (CARD_HEIGHT + 35);
      }

      const fanoutChildX = parent.toa_do.x + CARD_WIDTH + 80;
      const fanoutChildY = parent.toa_do.y + offsetY;

      // Nếu vị trí hiện tại bị va chạm hoặc là node mới chưa có tọa độ chuẩn, dùng vị trí nan quạt
      if (isNodeColliding(targetX, targetY, result, node.id)) {
        if (!isNodeColliding(fanoutChildX, fanoutChildY, result, node.id)) {
          targetX = fanoutChildX;
          targetY = fanoutChildY;
        } else {
          const slot = findAvailableSlot(fanoutChildX, fanoutChildY, result, node.id);
          targetX = slot.x;
          targetY = slot.y;
        }
      }
    } else {
      // Đối với node độc lập, nếu bị va chạm cũng tìm ô trống gần nhất
      if (isNodeColliding(targetX, targetY, result, node.id)) {
        const slot = findAvailableSlot(targetX + 60, targetY + 60, result, node.id);
        targetX = slot.x;
        targetY = slot.y;
      }
    }

    const updatedNode: NodeEntity = {
      ...node,
      toa_do: { x: targetX, y: targetY },
      tam: { x: targetX + CARD_WIDTH / 2, y: targetY + CARD_HEIGHT / 2 }
    };

    result.push(updatedNode);
  }

  return result;
}
