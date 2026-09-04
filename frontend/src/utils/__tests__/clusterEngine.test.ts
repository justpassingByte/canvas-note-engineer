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

describe('Cluster Engine - Automated Architecture Topic Grouping (2-Tier Nested Clusters)', () => {
  it('should return empty array when nodes array is empty', () => {
    const clusters = computeClusters([]);
    expect(clusters).toEqual([]);
  });

  it('should classify nodes into proper technical clusters and generate parent container', () => {
    const nodes: NodeEntity[] = [
      createMockNode('node-tru-db', 'khoi_tru_database', 100, 100),
      createMockNode('node-queue', 'hang_doi_message_queue', 400, 100),
      createMockNode('node-tmdt', 'hop_kien_hang_domain', 700, 100),
      createMockNode('node-su-co', 'su_co_canh_bao', 100, 400),
      createMockNode('node-khien-khoa', 'khien_bao_ve', 400, 400)
    ];

    const clusters = computeClusters(nodes);

    // 1 Parent Cluster (cum-idempotency-system) + 5 Sub-clusters/Independent clusters = 6 total
    expect(clusters.length).toBe(6);

    const clusterIds = clusters.map(c => c.id);
    expect(clusterIds).toContain('cum-idempotency-system');
    expect(clusterIds).toContain('cum-database-acid');
    expect(clusterIds).toContain('cum-async-buffer');
    expect(clusterIds).toContain('cum-tmdt-domain');
    expect(clusterIds).toContain('cum-webhook-gateway');
    expect(clusterIds).toContain('cum-idempotency-app');

    // Verify parent cluster metadata
    const parentCluster = clusters.find(c => c.id === 'cum-idempotency-system');
    expect(parentCluster?.cap_do).toBe('me');
  });

  it('should classify DDoS Protection node into independent Edge WAF cluster', () => {
    const nodes: NodeEntity[] = [
      createMockNode('node-ddos-waf', 'khien_bao_ve', 100, -200, 'HẠ TẦNG PHÒNG THỦ BIÊN')
    ];

    const clusters = computeClusters(nodes);
    expect(clusters.length).toBe(1);

    const ddosCluster = clusters[0];
    expect(ddosCluster.id).toBe('cum-edge-waf');
    expect(ddosCluster.ten_cum).toBe('LÁ CHẮN BIÊN & CHỐNG DDOS');
    expect(ddosCluster.cap_do).toBe('doc_lap');
    expect(ddosCluster.mau).toBe('#4338CA');
  });

  it('should compute padded bounding boxes and centroid coordinates for clusters', () => {
    const nodes: NodeEntity[] = [
      createMockNode('node-queue', 'hang_doi_message_queue', 200, 300),
      createMockNode('node-cache', 'bo_nho_dem_cache', 500, 300)
    ];

    const clusters = computeClusters(nodes);
    // Both belong to cum-async-buffer and are wrapped in parent cum-idempotency-system
    expect(clusters.length).toBe(2);

    const subCluster = clusters.find(c => c.id === 'cum-async-buffer');
    expect(subCluster).toBeDefined();
    expect(subCluster?.nodeIds).toHaveLength(2);

    // Bounding box calculation for sub-cluster:
    // minX = 200, maxX = 500 + 220 = 720
    // minY = 300, maxY = 300 + 145 = 445
    // PADDING = 34, HEADER PADDING = 20
    expect(subCluster!.bounds.minX).toBe(200 - 34);
    expect(subCluster!.bounds.maxX).toBe(720 + 34);
    expect(subCluster!.bounds.minY).toBe(300 - 34 - 20);
    expect(subCluster!.bounds.maxY).toBe(445 + 34);

    expect(subCluster!.bounds.width).toBe((720 + 34) - (200 - 34));
    expect(subCluster!.bounds.height).toBe((445 + 34) - (300 - 34 - 20));
    expect(subCluster!.bounds.centerX).toBe(subCluster!.bounds.minX + subCluster!.bounds.width / 2);
    expect(subCluster!.bounds.centerY).toBe(subCluster!.bounds.minY + subCluster!.bounds.height / 2);
  });
});
