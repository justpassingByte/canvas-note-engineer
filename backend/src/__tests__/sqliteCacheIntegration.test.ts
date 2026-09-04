import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { sqliteClient } from '../db/sqliteClient.js';
import { GraphData, NodeEntity, EdgeEntity } from '../types/graphTypes.js';

function createMockGraph(): GraphData {
  return {
    id: 'test-graph-1',
    topic: 'Kiến trúc Thanh toán Idempotency',
    nodes: [
      {
        id: 'parent-node',
        bieu_tuong: 'khien_bao_ve',
        tieu_de: 'Lá chắn Idempotency',
        nhan_buoc: 'BƯỚC 1',
        tom_tat: 'Khóa chống trùng lặp',
        toa_do: { x: 100, y: 100 },
        tam: { x: 210, y: 172 },
        fully_explored: false,
        hoat_hoa: { mau: '#10B981', tham_so: {} },
        chi_tiet: {
          phan_loai: 'Phòng thủ',
          tieu_de: 'Lá chắn Idempotency',
          ban_chat: 'Khóa nguyên tử',
          chu_thich_so_do: 'Sơ đồ bảo vệ',
          ca_thuc_te: [],
          rui_ro: []
        },
        trac_nghiem: { cau_hoi: 'Idempotency là gì?', lua_chon: ['A', 'B'], dung: 0, giai_thich: '' }
      },
      {
        id: 'secondary-node',
        bieu_tuong: 'khoi_tru_database',
        tieu_de: 'Cơ sở dữ liệu',
        nhan_buoc: 'BƯỚC 2',
        tom_tat: 'Lưu trữ giao dịch',
        toa_do: { x: 400, y: 100 },
        tam: { x: 510, y: 172 },
        fully_explored: false,
        hoat_hoa: { mau: '#3B82F6', tham_so: {} },
        chi_tiet: {
          phan_loai: 'Lưu trữ',
          tieu_de: 'Cơ sở dữ liệu',
          ban_chat: 'ACID',
          chu_thich_so_do: 'Bảo chứng',
          ca_thuc_te: [],
          rui_ro: []
        },
        trac_nghiem: { cau_hoi: 'ACID là gì?', lua_chon: ['A', 'B'], dung: 0, giai_thich: '' }
      }
    ],
    edges: [
      {
        from: 'parent-node',
        to: 'secondary-node',
        nhan: 'Ghi nhận khóa',
        kieu: 'duong-xung-em-ai',
        loai_lien_ket: 'HOA_GIAI'
      }
    ]
  };
}

describe('SQLite & Local Cache Integration Test (Zero Mock)', () => {
  const cachePath = path.resolve(process.cwd(), 'data', 'knowledge_cache.json');
  let originalCacheContent: string | null = null;

  beforeEach(() => {
    if (fs.existsSync(cachePath)) {
      originalCacheContent = fs.readFileSync(cachePath, 'utf-8');
    }
  });

  afterEach(() => {
    // Restore original cache state if it existed
    if (originalCacheContent !== null) {
      fs.writeFileSync(cachePath, originalCacheContent, 'utf-8');
    }
  });

  it('should persist graph to disk and retrieve it correctly', () => {
    const mockGraph = createMockGraph();
    sqliteClient.saveGraph(mockGraph);

    const retrieved = sqliteClient.getGraph('test-graph-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe('test-graph-1');
    expect(retrieved?.nodes).toHaveLength(2);
    expect(retrieved?.edges).toHaveLength(1);
  });

  it('should add delta nodes, link to parent, and apply Saturation Lock', () => {
    const mockGraph = createMockGraph();
    sqliteClient.saveGraph(mockGraph);

    const deltaNodes: NodeEntity[] = [
      {
        id: 'child-delta-1',
        bieu_tuong: 'hang_doi_message_queue',
        tieu_de: 'Hàng đợi RabbitMQ',
        nhan_buoc: 'NHÁNH MỞ RỘNG',
        tom_tat: 'Đệm giao dịch',
        toa_do: { x: 100, y: 300 },
        tam: { x: 210, y: 372 },
        fully_explored: false,
        hoat_hoa: { mau: '#F59E0B', tham_so: {} },
        chi_tiet: { phan_loai: 'Queue', tieu_de: 'Queue', ban_chat: '', chu_thich_so_do: '', ca_thuc_te: [], rui_ro: [] },
        trac_nghiem: { cau_hoi: '', lua_chon: ['', ''], dung: 0, giai_thich: '' }
      }
    ];

    const deltaEdges: EdgeEntity[] = [
      {
        from: 'parent-node',
        to: 'child-delta-1',
        nhan: 'Đẩy vào hàng đợi',
        kieu: 'duong-xung-em-ai',
        loai_lien_ket: 'DEM_LOC'
      }
    ];

    const updated = sqliteClient.addDeltaNodes('test-graph-1', 'parent-node', deltaNodes, deltaEdges);

    expect(updated).not.toBeNull();
    expect(updated?.nodes).toHaveLength(3);
    expect(updated?.edges).toHaveLength(2);

    // Parent must have fully_explored = true (Saturation Lock)
    const parent = updated?.nodes.find(n => n.id === 'parent-node');
    expect(parent?.fully_explored).toBe(true);

    // Child must have parent_id = 'parent-node'
    const child = updated?.nodes.find(n => n.id === 'child-delta-1');
    expect(child?.parent_id).toBe('parent-node');
  });

  it('should cascade collapse state to all child nodes', () => {
    const mockGraph = createMockGraph();
    sqliteClient.saveGraph(mockGraph);

    // Add child node
    const childNode: NodeEntity = {
      id: 'child-node-A',
      bieu_tuong: 'hang_doi_message_queue',
      tieu_de: 'Child A',
      nhan_buoc: 'CHILD',
      tom_tat: '',
      toa_do: { x: 0, y: 0 },
      tam: { x: 0, y: 0 },
      fully_explored: false,
      hoat_hoa: { mau: '#000', tham_so: {} },
      chi_tiet: { phan_loai: '', tieu_de: '', ban_chat: '', chu_thich_so_do: '', ca_thuc_te: [], rui_ro: [] },
      trac_nghiem: { cau_hoi: '', lua_chon: ['', ''], dung: 0, giai_thich: '' }
    };
    sqliteClient.addDeltaNodes('test-graph-1', 'parent-node', [childNode], []);

    // Collapse parent
    const collapsedGraph = sqliteClient.updateNodeCollapse('test-graph-1', 'parent-node', true);

    const parent = collapsedGraph?.nodes.find(n => n.id === 'parent-node');
    const child = collapsedGraph?.nodes.find(n => n.id === 'child-node-A');

    expect(parent?.is_collapsed).toBe(true);
    expect(parent?.collapsed_count).toBe(1);
    expect(child?.is_collapsed).toBe(true);
  });

  it('should permanently delete node and its descendants recursively and cleanup orphan edges', () => {
    const mockGraph = createMockGraph();
    sqliteClient.saveGraph(mockGraph);

    // Add child and grandchild
    const childNode: NodeEntity = {
      id: 'sub-child-1',
      bieu_tuong: 'hang_doi_message_queue',
      tieu_de: 'Sub Child',
      nhan_buoc: '',
      tom_tat: '',
      toa_do: { x: 0, y: 0 },
      tam: { x: 0, y: 0 },
      fully_explored: false,
      parent_id: 'parent-node',
      hoat_hoa: { mau: '#000', tham_so: {} },
      chi_tiet: { phan_loai: '', tieu_de: '', ban_chat: '', chu_thich_so_do: '', ca_thuc_te: [], rui_ro: [] },
      trac_nghiem: { cau_hoi: '', lua_chon: ['', ''], dung: 0, giai_thich: '' }
    };
    sqliteClient.addDeltaNodes('test-graph-1', 'parent-node', [childNode], [
      { from: 'parent-node', to: 'sub-child-1', nhan: 'Link', kieu: 'duong-xung-em-ai' }
    ]);

    // Deleting parent-node should remove parent-node AND sub-child-1, plus all connected edges
    const afterDelete = sqliteClient.deleteNodePermanently('test-graph-1', 'parent-node');

    expect(afterDelete?.nodes.some(n => n.id === 'parent-node')).toBe(false);
    expect(afterDelete?.nodes.some(n => n.id === 'sub-child-1')).toBe(false);
    // Only secondary-node remains
    expect(afterDelete?.nodes).toHaveLength(1);
    expect(afterDelete?.nodes[0].id).toBe('secondary-node');
    // No edges should remain pointing to/from deleted nodes
    expect(afterDelete?.edges).toHaveLength(0);
  });
});
