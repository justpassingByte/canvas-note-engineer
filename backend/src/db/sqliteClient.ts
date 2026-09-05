import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { GraphData, NodeEntity, EdgeEntity } from '../types/graphTypes.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_DB_PATH = path.join(DATA_DIR, 'knowledge.db');

export class SQLiteKnowledgeClient {
  private db: Database.Database;
  private dbPath: string;

  constructor(customPath?: string) {
    this.dbPath = customPath || process.env.SQLITE_DB_PATH || DEFAULT_DB_PATH;
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

      CREATE INDEX IF NOT EXISTS idx_graphs_updated_at ON knowledge_graphs(updated_at DESC);
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
}

// Singleton client cho toàn bộ runtime backend
export const sqliteClient = new SQLiteKnowledgeClient();
