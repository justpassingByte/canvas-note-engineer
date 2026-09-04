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

describe('Cluster Engine - Automated Architecture Topic Grouping (Clean Single-Level Clusters)', () => {
  it('should return empty array when nodes array is empty', () => {
    const clusters = computeClusters([]);
    expect(clusters).toEqual([]);
  });

  it('should create cluster bounds for groups with >= 2 nodes, skipping isolated single nodes', () => {
    const nodes: NodeEntity[] = [
      createMockNode('node-khien-khoa', 'khien_bao_ve', 400, 400),
      createMockNode('node-tranh-chap', 'tranh_chap_phan_nhanh', 400, 200),
      createMockNode('node-su-co', 'su_co_canh_bao', 100, 400), // isolated 1 node
      createMockNode('node-tmdt', 'hop_kien_hang_domain', 700, 100) // isolated 1 node
    ];

    // Mặc định minNodes = 2: chỉ nhóm có >= 2 node mới vẽ viền cụm
    const clusters = computeClusters(nodes);

    expect(clusters.length).toBe(1);
    expect(clusters[0].id).toBe('cum-idempotency-app');
    expect(clusters[0].nodeIds).toEqual(['node-khien-khoa', 'node-tranh-chap']);
    expect(clusters[0].cap_do).toBe('doc_lap');
  });

  it('should allow minNodes = 1 when all cluster topics need to be enumerated', () => {
    const nodes: NodeEntity[] = [
      createMockNode('node-ddos-waf', 'khien_bao_ve', 100, -200, 'HẠ TẦNG PHÒNG THỦ BIÊN')
    ];

    const clusters = computeClusters(nodes, 1);
    expect(clusters.length).toBe(1);

    const ddosCluster = clusters[0];
    expect(ddosCluster.id).toBe('cum-edge-waf');
    expect(ddosCluster.ten_cum).toBe('LÁ CHẮN BIÊN & CHỐNG DDOS');
    expect(ddosCluster.cap_do).toBe('doc_lap');
    expect(ddosCluster.mau).toBe('#4338CA');
  });

  it('should compute padded bounding boxes and centroid coordinates for 2-node clusters without nested outer cluster', () => {
    const nodes: NodeEntity[] = [
      createMockNode('node-queue', 'hang_doi_message_queue', 200, 300),
      createMockNode('node-cache', 'bo_nho_dem_cache', 500, 300)
    ];

    const clusters = computeClusters(nodes);
    // Both belong to cum-async-buffer, exactly 1 clean cluster (no mother cluster)
    expect(clusters.length).toBe(1);

    const subCluster = clusters[0];
    expect(subCluster.id).toBe('cum-async-buffer');
    expect(subCluster.nodeIds).toHaveLength(2);

    // Bounding box calculation:
    // minX = 200, maxX = 500 + 220 = 720
    // minY = 300, maxY = 300 + 145 = 445
    // PADDING = 28, HEADER PADDING = 22
    expect(subCluster.bounds.minX).toBe(200 - 28);
    expect(subCluster.bounds.maxX).toBe(720 + 28);
    expect(subCluster.bounds.minY).toBe(300 - 28 - 22);
    expect(subCluster.bounds.maxY).toBe(445 + 28);

    expect(subCluster.bounds.width).toBe((720 + 28) - (200 - 28));
    expect(subCluster.bounds.height).toBe((445 + 28) - (300 - 28 - 22));
    expect(subCluster.bounds.centerX).toBe(subCluster.bounds.minX + subCluster.bounds.width / 2);
    expect(subCluster.bounds.centerY).toBe(subCluster.bounds.minY + subCluster.bounds.height / 2);
  });
});
