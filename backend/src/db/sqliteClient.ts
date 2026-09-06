import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { GraphData, NodeEntity, EdgeEntity } from '../types/graphTypes.js';
import { ProviderConfig } from '../config/providerConfig.js';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getDefaultDbPath(): string {
  if (process.env.SQLITE_DB_PATH) return process.env.SQLITE_DB_PATH;
  const rootData = path.resolve(__dirname, '../../../data');
  if (fs.existsSync(rootData)) return path.join(rootData, 'knowledge.db');
  const parentData = path.resolve(__dirname, '../../data');
  if (fs.existsSync(parentData)) return path.join(parentData, 'knowledge.db');
  const cwdData = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(cwdData)) fs.mkdirSync(cwdData, { recursive: true });
  return path.join(cwdData, 'knowledge.db');
}

export class SQLiteKnowledgeClient {
  private db: Database.Database;
  private dbPath: string;

  constructor(customPath?: string) {
    this.dbPath = customPath || getDefaultDbPath();
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(this.dbPath);
    this.initializeSchema();
  }

  private initializeSchema(): void {
    // Kích hoạt chế độ WAL (Write-Ahead Logging) cho hiệu năng cao và an toàn đồng thời
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('foreign_keys = ON');

    // Bảng lưu trữ đồ thị tri thức kỹ thuật
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS knowledge_graphs (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        graph_data TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS idempotency_keys (
        key TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS provider_configs (
        id TEXT PRIMARY KEY,
        provider_type TEXT NOT NULL,
        name TEXT NOT NULL,
        base_url TEXT NOT NULL,
        api_key TEXT NOT NULL,
        model TEXT NOT NULL,
        temperature REAL DEFAULT 0.3,
        max_tokens INTEGER,
        custom_headers TEXT,
        is_active INTEGER DEFAULT 0,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_graphs_updated_at ON knowledge_graphs(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_provider_active ON provider_configs(is_active);
    `);
  }

  public getRawDb(): Database.Database {
    return this.db;
  }

  public close(): void {
    if (this.db.open) {
      this.db.close();
    }
  }

  public saveGraph(graph: GraphData): void {
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO knowledge_graphs (id, topic, graph_data, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        topic = excluded.topic,
        graph_data = excluded.graph_data,
        updated_at = excluded.updated_at
    `);
    stmt.run(graph.id, graph.topic, JSON.stringify(graph), now);
  }

  public getGraph(id: string): GraphData | null {
    const stmt = this.db.prepare('SELECT graph_data FROM knowledge_graphs WHERE id = ?');
    const row = stmt.get(id) as { graph_data: string } | undefined;
    if (!row) return null;
    try {
      return JSON.parse(row.graph_data);
    } catch {
      return null;
    }
  }

  public getCurrentGraph(): GraphData | null {
    // Lấy đồ thị hoạt động gần nhất
    const stmt = this.db.prepare('SELECT graph_data FROM knowledge_graphs ORDER BY updated_at DESC LIMIT 1');
    const row = stmt.get() as { graph_data: string } | undefined;
    if (!row) return null;
    try {
      return JSON.parse(row.graph_data);
    } catch {
      return null;
    }
  }

  public addDeltaNodes(
    graphId: string,
    parentNodeId: string | undefined | null,
    newNodes: NodeEntity[],
    newEdges: EdgeEntity[] = []
  ): GraphData | null {
    const graph = this.getGraph(graphId) || this.getCurrentGraph();
    if (!graph) return null;

    if (parentNodeId) {
      const parent = graph.nodes.find(n => n.id === parentNodeId);
      if (parent) {
        parent.fully_explored = true;
      }
    }

    for (const node of newNodes) {
      if (node.nhan_buoc) {
        node.nhan_buoc = node.nhan_buoc.replace(/^(bước|buoc|step)\s*[\d\.]+\s*(\/\/|:|-)?\s*/i, '').trim();
      }
      if (!graph.nodes.some(n => n.id === node.id)) {
        if (parentNodeId) {
          node.parent_id = parentNodeId;
        }
        graph.nodes.push(node);
      }
    }

    for (const edge of newEdges) {
      if (edge.nhan) {
        edge.nhan = edge.nhan.replace(/^(\d+(\.\d+)*)\s*[:.-]?\s*/i, '').replace(/^(bước|buoc|step)\s*[\d\.]+\s*[:.-]?\s*/i, '').trim();
      }
      if (!graph.edges.some(e => e.from === edge.from && e.to === edge.to)) {
        graph.edges.push(edge);
      }
    }

    this.saveGraph(graph);
    return graph;
  }

  public updateNodeCollapse(
    graphId: string,
    nodeId: string,
    isCollapsed: boolean
  ): GraphData | null {
    const graph = this.getGraph(graphId) || this.getCurrentGraph();
    if (!graph) return null;

    const parent = graph.nodes.find(n => n.id === nodeId);
    if (!parent) return graph;

    const childNodes = graph.nodes.filter(n => n.parent_id === nodeId);
    parent.is_collapsed = isCollapsed;
    parent.collapsed_count = childNodes.length;

    this.saveGraph(graph);
    return graph;
  }

  public deleteNodePermanently(
    graphId: string,
    nodeId: string
  ): GraphData | null {
    const graph = this.getGraph(graphId) || this.getCurrentGraph();
    if (!graph) return null;

    const idsToDelete = new Set<string>([nodeId]);
    let added = true;
    while (added) {
      added = false;
      for (const n of graph.nodes) {
        if (n.parent_id && idsToDelete.has(n.parent_id) && !idsToDelete.has(n.id)) {
          idsToDelete.add(n.id);
          added = true;
        }
      }
    }

    graph.nodes = graph.nodes.filter(n => !idsToDelete.has(n.id));
    graph.edges = graph.edges.filter(e => !idsToDelete.has(e.from) && !idsToDelete.has(e.to));

    for (const parent of graph.nodes) {
      const remainingChildren = graph.nodes.filter(n => n.parent_id === parent.id);
      if (remainingChildren.length === 0 && parent.fully_explored && parent.id === 'node-khien-khoa') {
        parent.fully_explored = false;
        parent.is_collapsed = false;
        parent.collapsed_count = 0;
      }
    }

    this.saveGraph(graph);
    return graph;
  }

  /**
   * Khóa Idempotency & chống Race Condition cấp độ SQLite
   */
  public recordIdempotencyKey(key: string, status: string = 'SUCCESS'): void {
    const stmt = this.db.prepare('INSERT INTO idempotency_keys (key, status) VALUES (?, ?)');
    stmt.run(key, status);
  }

  public getIdempotencyKey(key: string): { key: string; status: string; created_at: string } | null {
    const stmt = this.db.prepare('SELECT key, status, created_at FROM idempotency_keys WHERE key = ?');
    const row = stmt.get(key);
    return (row as any) || null;
  }

  // ==========================================
  // PROVIDER CONFIGURATION REPOSITORY METHODS
  // ==========================================
  public saveProviderConfig(config: ProviderConfig): void {
    const now = Date.now();
    // Nếu config này được set is_active = true, de-activate các config khác
    if (config.is_active) {
      this.db.prepare('UPDATE provider_configs SET is_active = 0').run();
    }

    const stmt = this.db.prepare(`
      INSERT INTO provider_configs (id, provider_type, name, base_url, api_key, model, temperature, max_tokens, custom_headers, is_active, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        provider_type = excluded.provider_type,
        name = excluded.name,
        base_url = excluded.base_url,
        api_key = excluded.api_key,
        model = excluded.model,
        temperature = excluded.temperature,
        max_tokens = excluded.max_tokens,
        custom_headers = excluded.custom_headers,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      config.id,
      config.provider_type,
      config.name,
      config.base_url,
      config.api_key,
      config.model,
      config.temperature ?? 0.3,
      config.max_tokens ?? null,
      config.custom_headers ? JSON.stringify(config.custom_headers) : null,
      config.is_active ? 1 : 0,
      now
    );
  }

  public getActiveProviderConfig(): ProviderConfig | null {
    const stmt = this.db.prepare('SELECT * FROM provider_configs WHERE is_active = 1 LIMIT 1');
    const row = stmt.get() as any;
    if (!row) return null;
    return {
      id: row.id,
      provider_type: row.provider_type,
      name: row.name,
      base_url: row.base_url,
      api_key: row.api_key,
      model: row.model,
      temperature: row.temperature,
      max_tokens: row.max_tokens,
      custom_headers: row.custom_headers ? JSON.parse(row.custom_headers) : undefined,
      is_active: Boolean(row.is_active),
      updated_at: row.updated_at
    };
  }

  public getAllProviderConfigs(): ProviderConfig[] {
    const stmt = this.db.prepare('SELECT * FROM provider_configs ORDER BY updated_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      id: row.id,
      provider_type: row.provider_type,
      name: row.name,
      base_url: row.base_url,
      api_key: row.api_key,
      model: row.model,
      temperature: row.temperature,
      max_tokens: row.max_tokens,
      custom_headers: row.custom_headers ? JSON.parse(row.custom_headers) : undefined,
      is_active: Boolean(row.is_active),
      updated_at: row.updated_at
    }));
  }

  public setActiveProviderConfig(id: string): void {
    const transaction = this.db.transaction(() => {
      this.db.prepare('UPDATE provider_configs SET is_active = 0').run();
      this.db.prepare('UPDATE provider_configs SET is_active = 1, updated_at = ? WHERE id = ?').run(Date.now(), id);
    });
    transaction();
  }

  public deleteProviderConfig(id: string): void {
    this.db.prepare('DELETE FROM provider_configs WHERE id = ?').run(id);
  }
}

// Singleton client cho toàn bộ runtime backend
export const sqliteClient = new SQLiteKnowledgeClient();
