import { describe, it, expect } from 'vitest';
import { computeClusters } from '../clusterEngine.js';
import { NodeEntity } from '../../types/graphTypes.js';

function createMockNode(id: string, icon: any, x: number, y: number, label: string = ''): NodeEntity {
  return {
    id,
    bieu_tuong: icon,
    tieu_de: `Node ${id}`,
    nhan_buoc: label,
    tom_tat: 'Tóm tắt kỹ thuật',
    toa_do: { x, y },
    tam: { x: x + 110, y: y + 72 },
    fully_explored: false,
    hoat_hoa: { mau: '#3B82F6', tham_so: {} },
    chi_tiet: {
      phan_loai: 'Technical Component',
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

describe('Cluster Engine - Automated Architecture Topic Grouping', () => {
  it('should return empty array when nodes array is empty', () => {
    const clusters = computeClusters([]);
    expect(clusters).toEqual([]);
  });

  it('should classify nodes into proper technical clusters', () => {
    const nodes: NodeEntity[] = [
      createMockNode('node-tru-db', 'khoi_tru_database', 100, 100),
      createMockNode('node-queue', 'hang_doi_message_queue', 400, 100),
      createMockNode('node-tmdt', 'hop_kien_hang_domain', 700, 100),
      createMockNode('node-su-co', 'su_co_canh_bao', 100, 400),
      createMockNode('node-khien-khoa', 'khien_bao_ve', 400, 400)
    ];

    const clusters = computeClusters(nodes);

    expect(clusters.length).toBe(5);

    const clusterIds = clusters.map(c => c.id);
    expect(clusterIds).toContain('cum-database-acid');
    expect(clusterIds).toContain('cum-async-buffer');
    expect(clusterIds).toContain('cum-tmdt-domain');
    expect(clusterIds).toContain('cum-webhook-gateway');
    expect(clusterIds).toContain('cum-idempotency-defense');
  });

  it('should compute padded bounding boxes and centroid coordinates for clusters', () => {
    const nodes: NodeEntity[] = [
      createMockNode('node-queue', 'hang_doi_message_queue', 200, 300),
      createMockNode('node-cache', 'bo_nho_dem_cache', 500, 300)
    ];

    const clusters = computeClusters(nodes);
    expect(clusters.length).toBe(1); // Both belong to cum-async-buffer

    const cluster = clusters[0];
    expect(cluster.id).toBe('cum-async-buffer');
    expect(cluster.nodeIds).toHaveLength(2);

    // Bounding box calculation:
    // minX = 200, maxX = 500 + 220 = 720
    // minY = 300, maxY = 300 + 145 = 445
    // PADDING = 38, HEADER PADDING = 24
    expect(cluster.bounds.minX).toBe(200 - 38);
    expect(cluster.bounds.maxX).toBe(720 + 38);
    expect(cluster.bounds.minY).toBe(300 - 38 - 24);
    expect(cluster.bounds.maxY).toBe(445 + 38);

    expect(cluster.bounds.width).toBe((720 + 38) - (200 - 38));
    expect(cluster.bounds.height).toBe((445 + 38) - (300 - 38 - 24));
    expect(cluster.bounds.centerX).toBe(cluster.bounds.minX + cluster.bounds.width / 2);
    expect(cluster.bounds.centerY).toBe(cluster.bounds.minY + cluster.bounds.height / 2);
  });
});
