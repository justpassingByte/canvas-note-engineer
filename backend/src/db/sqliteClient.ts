import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { TursoKnowledgeClient } from './tursoClient.js';
import { GraphData, NodeEntity, EdgeEntity } from '../types/graphTypes.js';
import { ProviderConfig } from '../config/providerConfig.js';
import {
  InterviewTopicEntity,
  UserTopicProgress,
  GapStatus,
  GapMapSummary
} from '../types/interviewTypes.js';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getDefaultDbPath(): string {
  if (process.env.SQLITE_DB_PATH) return process.env.SQLITE_DB_PATH;
  
  // Luôn hướng về thư mục gốc data/knowledge.db của repository
  const candidates = [
    path.resolve(process.cwd(), 'data/knowledge.db'),
    path.resolve(process.cwd(), '../data/knowledge.db'),
    path.resolve(__dirname, '../../../data/knowledge.db'),
    path.resolve(__dirname, '../../data/knowledge.db')
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }

  // Nếu chưa có, tạo tại thư mục data gốc
  const fallback = process.cwd().endsWith('backend')
    ? path.resolve(process.cwd(), '../data/knowledge.db')
    : path.resolve(process.cwd(), 'data/knowledge.db');
  
  const dir = path.dirname(fallback);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return fallback;
}

export class SQLiteKnowledgeClient {
  private db: Database.Database;
  private dbPath: string;
  private tursoClient: TursoKnowledgeClient | null = null;

  constructor(customPath?: string) {
    if (process.env.TURSO_DATABASE_URL) {
      console.log(`[Database Adapter] Phát hiện TURSO_DATABASE_URL. Kết nối Turso LibSQL Cloud.`);
      this.tursoClient = new TursoKnowledgeClient(
        process.env.TURSO_DATABASE_URL,
        process.env.TURSO_AUTH_TOKEN
      );
    }

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

      CREATE TABLE IF NOT EXISTS interview_topics (
        id TEXT PRIMARY KEY,
        domain_id TEXT NOT NULL,
        domain_title TEXT NOT NULL,
        title TEXT NOT NULL,
        target_intent TEXT NOT NULL,
        trigger_keywords TEXT NOT NULL,
        recall_5s TEXT NOT NULL,
        interview_answer TEXT NOT NULL,
        deep_dive TEXT NOT NULL,
        practical_example TEXT,
        trade_offs TEXT NOT NULL,
        follow_ups TEXT,
        common_traps TEXT,
        active_recall TEXT,
        layers TEXT NOT NULL,
        why_ladder TEXT,
        code_reaction TEXT,
        cross_link_node_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS interview_user_progress (
        topic_id TEXT PRIMARY KEY,
        gap_status TEXT DEFAULT 'MUST_LEARN',
        reviewed_count INTEGER DEFAULT 0,
        last_reviewed_at DATETIME,
        notes TEXT,
        FOREIGN KEY (topic_id) REFERENCES interview_topics(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_topics_domain ON interview_topics(domain_id);
      CREATE INDEX IF NOT EXISTS idx_progress_status ON interview_user_progress(gap_status);
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

  // ==========================================
  // INTERVIEW CHEATSHEET & USER PROGRESS METHODS
  // ==========================================

  public saveInterviewTopic(topic: InterviewTopicEntity): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO interview_topics (
        id, domain_id, domain_title, title, target_intent, trigger_keywords,
        recall_5s, interview_answer, deep_dive, practical_example, trade_offs,
        follow_ups, common_traps, active_recall, layers, why_ladder, code_reaction,
        cross_link_node_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        domain_id = excluded.domain_id,
        domain_title = excluded.domain_title,
        title = excluded.title,
        target_intent = excluded.target_intent,
        trigger_keywords = excluded.trigger_keywords,
        recall_5s = excluded.recall_5s,
        interview_answer = excluded.interview_answer,
        deep_dive = excluded.deep_dive,
        practical_example = excluded.practical_example,
        trade_offs = excluded.trade_offs,
        follow_ups = excluded.follow_ups,
        common_traps = excluded.common_traps,
        active_recall = excluded.active_recall,
        layers = excluded.layers,
        why_ladder = excluded.why_ladder,
        code_reaction = excluded.code_reaction,
        cross_link_node_id = excluded.cross_link_node_id,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      topic.id,
      topic.domain_id,
      topic.domain_title,
      topic.title,
      topic.target_intent,
      JSON.stringify(topic.trigger_keywords || []),
      topic.recall_5s,
      topic.interview_answer,
      topic.deep_dive,
      topic.practical_example ? JSON.stringify(topic.practical_example) : null,
      JSON.stringify(topic.trade_offs),
      topic.follow_ups ? JSON.stringify(topic.follow_ups) : null,
      topic.common_traps ? JSON.stringify(topic.common_traps) : null,
      topic.active_recall ? JSON.stringify(topic.active_recall) : null,
      JSON.stringify(topic.layers),
      topic.why_ladder ? JSON.stringify(topic.why_ladder) : null,
      topic.code_reaction ? JSON.stringify(topic.code_reaction) : null,
      topic.cross_link_node_id || null,
      topic.created_at || now,
      now
    );

    // Đảm bảo topic có bản ghi progress mặc định nếu chưa có
    const checkProgress = this.db.prepare('SELECT topic_id FROM interview_user_progress WHERE topic_id = ?').get(topic.id);
    if (!checkProgress) {
      this.db.prepare(`
        INSERT INTO interview_user_progress (topic_id, gap_status, reviewed_count, last_reviewed_at)
        VALUES (?, 'MUST_LEARN', 0, NULL)
      `).run(topic.id);
    }
  }

  public saveInterviewTopics(topics: InterviewTopicEntity[]): void {
    const transaction = this.db.transaction(() => {
      for (const t of topics) {
        this.saveInterviewTopic(t);
      }
    });
    transaction();
  }

  private mapTopicRow(row: any): InterviewTopicEntity & { progress?: UserTopicProgress } {
    return {
      id: row.id,
      domain_id: row.domain_id,
      domain_title: row.domain_title,
      title: row.title,
      target_intent: row.target_intent,
      trigger_keywords: row.trigger_keywords ? JSON.parse(row.trigger_keywords) : [],
      recall_5s: row.recall_5s,
      interview_answer: row.interview_answer,
      deep_dive: row.deep_dive,
      practical_example: row.practical_example ? JSON.parse(row.practical_example) : undefined,
      trade_offs: row.trade_offs ? JSON.parse(row.trade_offs) : { when_use: '', when_not_use: '', pros: [], cons: [], alternatives: [] },
      follow_ups: row.follow_ups ? JSON.parse(row.follow_ups) : [],
      common_traps: row.common_traps ? JSON.parse(row.common_traps) : [],
      active_recall: row.active_recall ? JSON.parse(row.active_recall) : [],
      layers: row.layers ? JSON.parse(row.layers) : { l1_junior: '', l2_middle: '', l3_senior: '' },
      why_ladder: row.why_ladder ? JSON.parse(row.why_ladder) : [],
      code_reaction: row.code_reaction ? JSON.parse(row.code_reaction) : undefined,
      cross_link_node_id: row.cross_link_node_id || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
      progress: row.gap_status ? {
        topic_id: row.id,
        gap_status: row.gap_status as GapStatus,
        reviewed_count: row.reviewed_count || 0,
        last_reviewed_at: row.last_reviewed_at || null,
        notes: row.notes || undefined
      } : undefined
    };
  }

  public getInterviewTopic(id: string): (InterviewTopicEntity & { progress?: UserTopicProgress }) | null {
    const stmt = this.db.prepare(`
      SELECT t.*, p.gap_status, p.reviewed_count, p.last_reviewed_at, p.notes
      FROM interview_topics t
      LEFT JOIN interview_user_progress p ON t.id = p.topic_id
      WHERE t.id = ?
    `);
    const row = stmt.get(id);
    if (!row) return null;
    return this.mapTopicRow(row);
  }

  public getAllInterviewTopics(domainId?: string): Array<InterviewTopicEntity & { progress?: UserTopicProgress }> {
    let query = `
      SELECT t.*, p.gap_status, p.reviewed_count, p.last_reviewed_at, p.notes
      FROM interview_topics t
      LEFT JOIN interview_user_progress p ON t.id = p.topic_id
    `;
    const params: any[] = [];
    if (domainId) {
      query += ` WHERE t.domain_id = ?`;
      params.push(domainId);
    }
    query += ` ORDER BY t.created_at ASC`;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params);
    return rows.map(r => this.mapTopicRow(r));
  }

  public deleteInterviewTopic(id: string): void {
    this.db.prepare('DELETE FROM interview_topics WHERE id = ?').run(id);
    this.db.prepare('DELETE FROM interview_user_progress WHERE topic_id = ?').run(id);
  }

  public updateUserTopicProgress(progress: {
    topic_id: string;
    gap_status?: GapStatus;
    reviewed_count?: number;
    last_reviewed_at?: string;
    notes?: string;
  }): void {
    const existing = this.db.prepare('SELECT * FROM interview_user_progress WHERE topic_id = ?').get(progress.topic_id) as any;
    const now = progress.last_reviewed_at || new Date().toISOString();

    if (existing) {
      const newReviewedCount = progress.reviewed_count !== undefined
        ? progress.reviewed_count
        : (existing.reviewed_count || 0) + 1;

      this.db.prepare(`
        UPDATE interview_user_progress SET
          gap_status = COALESCE(?, gap_status),
          reviewed_count = ?,
          last_reviewed_at = ?,
          notes = COALESCE(?, notes)
        WHERE topic_id = ?
      `).run(progress.gap_status || null, newReviewedCount, now, progress.notes || null, progress.topic_id);
    } else {
      this.db.prepare(`
        INSERT INTO interview_user_progress (topic_id, gap_status, reviewed_count, last_reviewed_at, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(progress.topic_id, progress.gap_status || 'MUST_LEARN', progress.reviewed_count ?? 1, now, progress.notes || null);
    }
  }

  public getGapMapSummary(): GapMapSummary {
    const totalTopicsRow = this.db.prepare('SELECT COUNT(*) as count FROM interview_topics').get() as { count: number };
    const totalTopics = totalTopicsRow?.count || 0;

    const domainsCountRow = this.db.prepare('SELECT COUNT(DISTINCT domain_id) as count FROM interview_topics').get() as { count: number };
    const totalDomains = domainsCountRow?.count || 0;

    const statusCounts = this.db.prepare(`
      SELECT gap_status, COUNT(*) as count
      FROM interview_user_progress
      GROUP BY gap_status
    `).all() as Array<{ gap_status: string; count: number }>;

    let readyCount = 0;
    let knowCount = 0;
    let weakCount = 0;
    let mustLearnCount = 0;

    for (const sc of statusCounts) {
      if (sc.gap_status === 'READY') readyCount = sc.count;
      else if (sc.gap_status === 'KNOW') knowCount = sc.count;
      else if (sc.gap_status === 'WEAK') weakCount = sc.count;
      else if (sc.gap_status === 'MUST_LEARN') mustLearnCount = sc.count;
    }

    const unassigned = Math.max(0, totalTopics - (readyCount + knowCount + weakCount + mustLearnCount));
    mustLearnCount += unassigned;

    const readyPercentage = totalTopics > 0 ? Math.round((readyCount / totalTopics) * 100) : 0;

    return {
      total_domains: totalDomains,
      total_topics: totalTopics,
      ready_count: readyCount,
      know_count: knowCount,
      weak_count: weakCount,
      must_learn_count: mustLearnCount,
      ready_percentage: readyPercentage
    };
  }

  // ==========================================
  // DUAL-ENGINE ASYNC APIS (TURSO CLOUD + LOCAL SQLITE)
  // ==========================================
  public isTursoEnabled(): boolean {
    return this.tursoClient !== null;
  }

  public async getCurrentGraphAsync(): Promise<GraphData | null> {
    if (this.tursoClient) return this.tursoClient.getCurrentGraph();
    return this.getCurrentGraph();
  }

  public async getGraphAsync(id: string): Promise<GraphData | null> {
    if (this.tursoClient) return this.tursoClient.getGraph(id);
    return this.getGraph(id);
  }

  public async saveGraphAsync(graph: GraphData): Promise<void> {
    if (this.tursoClient) {
      await this.tursoClient.saveGraph(graph);
    }
    this.saveGraph(graph);
  }

  public async getAllProviderConfigsAsync(): Promise<ProviderConfig[]> {
    if (this.tursoClient) return this.tursoClient.getAllProviderConfigs();
    return this.getAllProviderConfigs();
  }

  public async getActiveProviderConfigAsync(): Promise<ProviderConfig | null> {
    if (this.tursoClient) return this.tursoClient.getActiveProviderConfig();
    return this.getActiveProviderConfig();
  }

  public async saveProviderConfigAsync(config: ProviderConfig): Promise<void> {
    if (this.tursoClient) {
      await this.tursoClient.saveProviderConfig(config);
    }
    this.saveProviderConfig(config);
  }

  public async setActiveProviderConfigAsync(id: string): Promise<void> {
    if (this.tursoClient) {
      await this.tursoClient.setActiveProviderConfig(id);
    }
    this.setActiveProviderConfig(id);
  }

  public async deleteProviderConfigAsync(id: string): Promise<void> {
    if (this.tursoClient) {
      await this.tursoClient.deleteProviderConfig(id);
    }
    this.deleteProviderConfig(id);
  }

  public async getAllInterviewTopicsAsync(domainId?: string): Promise<Array<InterviewTopicEntity & { progress?: UserTopicProgress }>> {
    if (this.tursoClient) return this.tursoClient.getAllInterviewTopics(domainId);
    return this.getAllInterviewTopics(domainId);
  }

  public async getInterviewTopicAsync(id: string): Promise<(InterviewTopicEntity & { progress?: UserTopicProgress }) | null> {
    if (this.tursoClient) return this.tursoClient.getInterviewTopic(id);
    return this.getInterviewTopic(id);
  }

  public async saveInterviewTopicAsync(topic: InterviewTopicEntity): Promise<void> {
    if (this.tursoClient) {
      await this.tursoClient.saveInterviewTopic(topic);
    }
    this.saveInterviewTopic(topic);
  }

  public async updateUserTopicProgressAsync(progress: {
    topic_id: string;
    gap_status?: GapStatus;
    reviewed_count?: number;
    last_reviewed_at?: string;
    notes?: string;
  }): Promise<void> {
    if (this.tursoClient) {
      await this.tursoClient.updateUserTopicProgress(progress);
    }
    this.updateUserTopicProgress(progress);
  }

  public async getGapMapSummaryAsync(): Promise<GapMapSummary> {
    if (this.tursoClient) return this.tursoClient.getGapMapSummary();
    return this.getGapMapSummary();
  }
}

// Singleton client cho toàn bộ runtime backend
export const sqliteClient = new SQLiteKnowledgeClient();
