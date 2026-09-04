import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { SQLiteKnowledgeClient } from '../db/sqliteClient.js';
import { GraphData, NodeEntity } from '../types/graphTypes.js';

const TEST_DB_PATH = path.resolve(process.cwd(), 'data', 'test_knowledge_real.db');

function cleanupDbFiles(dbPath: string): void {
  for (const ext of ['', '-wal', '-shm', '.tmp']) {
    const p = `${dbPath}${ext}`;
    if (fs.existsSync(p)) {
      try {
        fs.unlinkSync(p);
      } catch (err) {
        // Ignore file lock delays
      }
    }
  }
}

function createSampleGraph(id: string = 'graph-acid-test'): GraphData {
  return {
    id,
    topic: 'Kiến trúc Thanh toán Idempotency & ACID',
    nodes: [
      {
        id: 'node-khien-khoa',
        bieu_tuong: 'khien_bao_ve',
        tieu_de: 'Khóa Phân Tán',
        nhan_buoc: 'BƯỚC 1',
        tom_tat: 'Phòng thủ Race Condition',
        toa_do: { x: 100, y: 100 },
        tam: { x: 210, y: 172 },
        fully_explored: false,
        hoat_hoa: { mau: '#059669', tham_so: {} },
        chi_tiet: {
          phan_loai: 'Phòng thủ',
          tieu_de: 'Khóa Phân Tán',
          ban_chat: 'Khóa nguyên tử',
          chu_thich_so_do: 'Sơ đồ',
          ca_thuc_te: [],
          rui_ro: []
        },
        trac_nghiem: { cau_hoi: 'ACID?', lua_chon: ['Có', 'Không'], dung: 0, giai_thich: '' }
      }
    ],
    edges: []
  };
}

describe('Real SQLite Database Integration Tests (Zero-Mock)', () => {
  let client: SQLiteKnowledgeClient;

  beforeEach(() => {
    cleanupDbFiles(TEST_DB_PATH);
    client = new SQLiteKnowledgeClient(TEST_DB_PATH);
  });

  afterEach(() => {
    client.close();
    cleanupDbFiles(TEST_DB_PATH);
  });

  it('should initialize real SQLite file on disk with WAL journal mode', () => {
    expect(fs.existsSync(TEST_DB_PATH)).toBe(true);

    const rawDb = client.getRawDb();
    const pragmaResult = rawDb.pragma('journal_mode') as Array<{ journal_mode: string }>;
    expect(pragmaResult[0].journal_mode).toBe('wal');

    // Verify tables exist in sqlite_master
    const tables = rawDb
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as Array<{ name: string }>;
    const tableNames = tables.map(t => t.name);

    expect(tableNames).toContain('knowledge_graphs');
    expect(tableNames).toContain('idempotency_keys');
  });

  it('should strictly enforce UNIQUE constraint on idempotency keys (Zero Double-Writes Guarantee)', () => {
    const testKey = 'req-idemp-9999-order';

    // 1st insert: Request succeeds
    expect(() => {
      client.recordIdempotencyKey(testKey, 'SUCCESS');
    }).not.toThrow();

    // Verify record in SQLite table
    const record = client.getIdempotencyKey(testKey);
    expect(record).not.toBeNull();
    expect(record?.status).toBe('SUCCESS');

    // 2nd duplicate insert: MUST fail with SQLite UNIQUE constraint violation
    expect(() => {
      client.recordIdempotencyKey(testKey, 'DUPLICATE_PAYLOAD');
    }).toThrow(/UNIQUE constraint failed/);

    // Assert row count in SQLite is strictly 1
    const rawDb = client.getRawDb();
    const countRow = rawDb
      .prepare('SELECT count(*) as total FROM idempotency_keys WHERE key = ?')
      .get(testKey) as { total: number };

    expect(countRow.total).toBe(1);
  });

  it('should rollback transactions atomically on failure (ACID Guarantee)', () => {
    const rawDb = client.getRawDb();

    // Transaction that inserts graph then fails deliberately
    const faultyTransaction = rawDb.transaction(() => {
      rawDb
        .prepare('INSERT INTO knowledge_graphs (id, topic, graph_data) VALUES (?, ?, ?)')
        .run('atomic-fail-graph', 'Topic Test', JSON.stringify({ test: true }));

      // Force a constraint error
      throw new Error('Simulated network/hardware crash mid-transaction');
    });

    expect(() => faultyTransaction()).toThrow(/Simulated network/);

    // Verify that the record was NOT committed to disk (0 partial writes)
    const row = rawDb
      .prepare('SELECT * FROM knowledge_graphs WHERE id = ?')
      .get('atomic-fail-graph');
    expect(row).toBeUndefined();
  });

  it('should persist graph data, apply Saturation Lock, and query back correctly', () => {
    const initialGraph = createSampleGraph('graph-sqlite-001');
    client.saveGraph(initialGraph);

    // Verify stored
    const retrieved = client.getGraph('graph-sqlite-001');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.nodes).toHaveLength(1);
    expect(retrieved?.nodes[0].fully_explored).toBe(false);

    // Add delta node
    const deltaNode: NodeEntity = {
      id: 'node-delta-child',
      bieu_tuong: 'hang_doi_message_queue',
      tieu_de: 'RabbitMQ Buffer',
      nhan_buoc: 'DELTA',
      tom_tat: 'Buffer',
      toa_do: { x: 300, y: 100 },
      tam: { x: 410, y: 172 },
      fully_explored: false,
      hoat_hoa: { mau: '#D97706', tham_so: {} },
      chi_tiet: { phan_loai: 'Queue', tieu_de: 'Queue', ban_chat: '', chu_thich_so_do: '', ca_thuc_te: [], rui_ro: [] },
      trac_nghiem: { cau_hoi: '', lua_chon: ['', ''], dung: 0, giai_thich: '' }
    };

    const updated = client.addDeltaNodes('graph-sqlite-001', 'node-khien-khoa', [deltaNode], []);
    expect(updated?.nodes).toHaveLength(2);

    // Check Saturation Lock persisted to SQLite disk
    const reloaded = client.getGraph('graph-sqlite-001');
    const parentInDb = reloaded?.nodes.find(n => n.id === 'node-khien-khoa');
    expect(parentInDb?.fully_explored).toBe(true);

    const childInDb = reloaded?.nodes.find(n => n.id === 'node-delta-child');
    expect(childInDb?.parent_id).toBe('node-khien-khoa');
  });

  it('should persist cascade collapse and permanent recursive node deletion in SQLite', () => {
    const graph = createSampleGraph('graph-collapse-del');
    client.saveGraph(graph);

    // Add child
    const childNode: NodeEntity = {
      id: 'child-del-1',
      bieu_tuong: 'khoi_tru_database',
      tieu_de: 'Child DB',
      nhan_buoc: 'CHILD',
      tom_tat: '',
      toa_do: { x: 0, y: 0 },
      tam: { x: 0, y: 0 },
      fully_explored: false,
      hoat_hoa: { mau: '#000', tham_so: {} },
      chi_tiet: { phan_loai: '', tieu_de: '', ban_chat: '', chu_thich_so_do: '', ca_thuc_te: [], rui_ro: [] },
      trac_nghiem: { cau_hoi: '', lua_chon: ['', ''], dung: 0, giai_thich: '' }
    };
    client.addDeltaNodes('graph-collapse-del', 'node-khien-khoa', [childNode], []);

    // 1. Test Collapse
    client.updateNodeCollapse('graph-collapse-del', 'node-khien-khoa', true);
    let current = client.getGraph('graph-collapse-del');
    expect(current?.nodes.find(n => n.id === 'node-khien-khoa')?.is_collapsed).toBe(true);
    expect(current?.nodes.find(n => n.id === 'child-del-1')?.is_collapsed).toBe(true);

    // 2. Test Delete child
    client.deleteNodePermanently('graph-collapse-del', 'child-del-1');
    current = client.getGraph('graph-collapse-del');
    expect(current?.nodes.some(n => n.id === 'child-del-1')).toBe(false);
    expect(current?.nodes.find(n => n.id === 'node-khien-khoa')?.fully_explored).toBe(false);
  });
});
