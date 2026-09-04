import { describe, it, expect } from 'vitest';
import { getNodePorts, getOptimalPorts, calculateEdgePath } from '../geometry.js';
import { NodeEntity } from '../../types/graphTypes.js';

function createMockNode(id: string, x: number, y: number): NodeEntity {
  return {
    id,
    bieu_tuong: 'khoi_tru_database',
    tieu_de: `Node ${id}`,
    nhan_buoc: 'BƯỚC 1',
    tom_tat: 'Tóm tắt kỹ thuật',
    toa_do: { x, y },
    tam: { x: x + 110, y: y + 72 },
    fully_explored: false,
    hoat_hoa: { mau: '#3B82F6', tham_so: {} },
    chi_tiet: {
      phan_loai: 'Database',
      tieu_de: `Node ${id}`,
      ban_chat: 'Bản chất',
      chu_thich_so_do: 'Sơ đồ',
      ca_thuc_te: [],
      rui_ro: []
    },
    trac_nghiem: {
      cau_hoi: 'Câu hỏi?',
      lua_chon: ['A', 'B'],
      dung: 0,
      giai_thich: 'Giải thích'
    }
  };
}

describe('Geometry Utilities - Canvas Edge Routing & Ports', () => {
  it('should calculate accurate 4 anchor ports for a node card', () => {
    const node = createMockNode('node-1', 100, 200);
    const ports = getNodePorts(node);

    // Card width = 220, Card height = 145, CenterX = 100 + 110 = 210
    expect(ports.top).toEqual({ x: 210, y: 200 });
    expect(ports.bottom).toEqual({ x: 210, y: 345 });
    expect(ports.left).toEqual({ x: 100, y: 270 });
    expect(ports.right).toEqual({ x: 320, y: 270 });
  });

  describe('getOptimalPorts - Dynamic Port Selection', () => {
    it('should select bottom -> top ports when target is below source', () => {
      const fromNode = createMockNode('source', 100, 100);
      const toNode = createMockNode('target', 100, 400); // directly below

      const { sourcePort, targetPort } = getOptimalPorts(fromNode, toNode);
      expect(sourcePort).toBe('bottom');
      expect(targetPort).toBe('top');
    });

    it('should select top -> bottom ports when target is above source', () => {
      const fromNode = createMockNode('source', 100, 400);
      const toNode = createMockNode('target', 100, 100); // directly above

      const { sourcePort, targetPort } = getOptimalPorts(fromNode, toNode);
      expect(sourcePort).toBe('top');
      expect(targetPort).toBe('bottom');
    });

    it('should select right -> left ports when target is to the right', () => {
      const fromNode = createMockNode('source', 100, 100);
      const toNode = createMockNode('target', 500, 110); // directly right

      const { sourcePort, targetPort } = getOptimalPorts(fromNode, toNode);
      expect(sourcePort).toBe('right');
      expect(targetPort).toBe('left');
    });

    it('should select left -> right ports when target is to the left', () => {
      const fromNode = createMockNode('source', 500, 100);
      const toNode = createMockNode('target', 100, 110); // directly left

      const { sourcePort, targetPort } = getOptimalPorts(fromNode, toNode);
      expect(sourcePort).toBe('left');
      expect(targetPort).toBe('right');
    });
  });

  describe('calculateEdgePath - Cubic Bezier S-Curve Output', () => {
    it('should generate valid SVG Cubic Bezier string and midpoint', () => {
      const fromNode = createMockNode('source', 100, 100);
      const toNode = createMockNode('target', 400, 400);

      const result = calculateEdgePath(fromNode, toNode);

      // SVG path format: M p0x p0y C p1x p1y, p2x p2y, p3x p3y
      expect(result.pathD).toMatch(/^M \d+(\.\d+)? \d+(\.\d+)? C \d+(\.\d+)? \d+(\.\d+)?, \d+(\.\d+)? \d+(\.\d+)?, \d+(\.\d+)? \d+(\.\d+)?$/);
      
      // Check midpoint values are valid numbers (not NaN)
      expect(Number.isFinite(result.midX)).toBe(true);
      expect(Number.isFinite(result.midY)).toBe(true);
      expect(result.sourcePoint).toBeDefined();
      expect(result.targetPoint).toBeDefined();

      // Midpoint should lie roughly between source and target
      const minX = Math.min(result.sourcePoint.x, result.targetPoint.x);
      const maxX = Math.max(result.sourcePoint.x, result.targetPoint.x);
      expect(result.midX).toBeGreaterThanOrEqual(minX - 50);
      expect(result.midX).toBeLessThanOrEqual(maxX + 50);
    });
  });
});
