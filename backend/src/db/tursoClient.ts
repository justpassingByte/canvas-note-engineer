import { createClient, Client } from '@libsql/client';
import { GraphData } from '../types/graphTypes.js';
import { ProviderConfig } from '../config/providerConfig.js';
import {
  InterviewTopicEntity,
  UserTopicProgress,
  GapStatus,
  GapMapSummary
} from '../types/interviewTypes.js';

export class TursoKnowledgeClient {
  private client: Client;
  private isInitialized = false;

  constructor(url: string, authToken?: string) {
    this.client = createClient({
      url,
      authToken
    });
  }

  public async initSchema(): Promise<void> {
    if (this.isInitialized) return;

    await this.client.batch([
      `CREATE TABLE IF NOT EXISTS knowledge_graphs (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        graph_data TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS idempotency_keys (
        key TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS provider_configs (
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
      );`,
      `CREATE TABLE IF NOT EXISTS interview_topics (
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
      );`,
      `CREATE TABLE IF NOT EXISTS interview_user_progress (
        topic_id TEXT PRIMARY KEY,
        gap_status TEXT NOT NULL DEFAULT 'MUST_LEARN',
        reviewed_count INTEGER DEFAULT 0,
        last_reviewed_at DATETIME,
        notes TEXT,
        FOREIGN KEY(topic_id) REFERENCES interview_topics(id) ON DELETE CASCADE
      );`
    ]);

    this.isInitialized = true;
  }

  // ==========================================
  // KNOWLEDGE GRAPHS
  // ==========================================
  public async saveGraph(graph: GraphData): Promise<void> {
    await this.initSchema();
    const json = JSON.stringify(graph);
    await this.client.execute({
      sql: `INSERT INTO knowledge_graphs (id, topic, graph_data, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              topic = excluded.topic,
              graph_data = excluded.graph_data,
              updated_at = CURRENT_TIMESTAMP`,
      args: [graph.id, graph.topic || 'Kiến trúc Hệ thống', json]
    });
  }

  public async getGraph(id: string): Promise<GraphData | null> {
    await this.initSchema();
    const rs = await this.client.execute({
      sql: 'SELECT graph_data FROM knowledge_graphs WHERE id = ?',
      args: [id]
    });
    if (rs.rows.length === 0) return null;
    return JSON.parse(rs.rows[0].graph_data as string);
  }

  public async getCurrentGraph(): Promise<GraphData | null> {
    await this.initSchema();
    const rs = await this.client.execute(
      'SELECT graph_data FROM knowledge_graphs ORDER BY updated_at DESC LIMIT 1'
    );
    if (rs.rows.length === 0) return null;
    return JSON.parse(rs.rows[0].graph_data as string);
  }

  // ==========================================
  // PROVIDER CONFIGS
  // ==========================================
  public async saveProviderConfig(config: ProviderConfig): Promise<void> {
    await this.initSchema();
    if (config.is_active) {
      await this.client.execute('UPDATE provider_configs SET is_active = 0');
    }

    await this.client.execute({
      sql: `INSERT INTO provider_configs (
        id, provider_type, name, base_url, api_key, model, temperature, max_tokens, custom_headers, is_active, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        updated_at = excluded.updated_at`,
      args: [
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
        Date.now()
      ]
    });
  }

  public async getAllProviderConfigs(): Promise<ProviderConfig[]> {
    await this.initSchema();
    const rs = await this.client.execute(
      'SELECT * FROM provider_configs ORDER BY updated_at DESC'
    );
    return rs.rows.map(this.mapProviderRow);
  }

  public async getActiveProviderConfig(): Promise<ProviderConfig | null> {
    await this.initSchema();
    const rs = await this.client.execute(
      'SELECT * FROM provider_configs WHERE is_active = 1 LIMIT 1'
    );
    if (rs.rows.length === 0) return null;
    return this.mapProviderRow(rs.rows[0]);
  }

  public async setActiveProviderConfig(id: string): Promise<void> {
    await this.initSchema();
    await this.client.batch([
      'UPDATE provider_configs SET is_active = 0',
      {
        sql: 'UPDATE provider_configs SET is_active = 1 WHERE id = ?',
        args: [id]
      }
    ]);
  }

  public async deleteProviderConfig(id: string): Promise<void> {
    await this.initSchema();
    await this.client.execute({
      sql: 'DELETE FROM provider_configs WHERE id = ?',
      args: [id]
    });
  }

  private mapProviderRow(row: any): ProviderConfig {
    return {
      id: row.id as string,
      provider_type: row.provider_type as any,
      name: row.name as string,
      base_url: row.base_url as string,
      api_key: row.api_key as string,
      model: row.model as string,
      temperature: Number(row.temperature ?? 0.3),
      max_tokens: row.max_tokens ? Number(row.max_tokens) : undefined,
      custom_headers: row.custom_headers ? JSON.parse(row.custom_headers as string) : undefined,
      is_active: Boolean(row.is_active),
      updated_at: Number(row.updated_at)
    };
  }

  // ==========================================
  // INTERVIEW TOPICS & USER PROGRESS
  // ==========================================
  private mapTopicRow(row: any): InterviewTopicEntity & { progress?: UserTopicProgress } {
    return {
      id: row.id as string,
      domain_id: row.domain_id as string,
      domain_title: row.domain_title as string,
      title: row.title as string,
      target_intent: row.target_intent as string,
      trigger_keywords: row.trigger_keywords ? JSON.parse(row.trigger_keywords as string) : [],
      recall_5s: row.recall_5s as string,
      interview_answer: row.interview_answer as string,
      deep_dive: row.deep_dive as string,
      practical_example: row.practical_example ? JSON.parse(row.practical_example as string) : undefined,
      trade_offs: row.trade_offs ? JSON.parse(row.trade_offs as string) : { when_use: '', when_not_use: '', pros: [], cons: [], alternatives: [] },
      follow_ups: row.follow_ups ? JSON.parse(row.follow_ups as string) : [],
      common_traps: row.common_traps ? JSON.parse(row.common_traps as string) : [],
      active_recall: row.active_recall ? JSON.parse(row.active_recall as string) : [],
      layers: row.layers ? JSON.parse(row.layers as string) : { l1_junior: '', l2_middle: '', l3_senior: '' },
      why_ladder: row.why_ladder ? JSON.parse(row.why_ladder as string) : [],
      code_reaction: row.code_reaction ? JSON.parse(row.code_reaction as string) : undefined,
      cross_link_node_id: (row.cross_link_node_id as string) || undefined,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      progress: row.gap_status ? {
        topic_id: row.id as string,
        gap_status: row.gap_status as GapStatus,
        reviewed_count: Number(row.reviewed_count || 0),
        last_reviewed_at: (row.last_reviewed_at as string) || null,
        notes: (row.notes as string) || undefined
      } : undefined
    };
  }

  public async getInterviewTopic(id: string): Promise<(InterviewTopicEntity & { progress?: UserTopicProgress }) | null> {
    await this.initSchema();
    const rs = await this.client.execute({
      sql: `SELECT t.*, p.gap_status, p.reviewed_count, p.last_reviewed_at, p.notes
            FROM interview_topics t
            LEFT JOIN interview_user_progress p ON t.id = p.topic_id
            WHERE t.id = ?`,
      args: [id]
    });
    if (rs.rows.length === 0) return null;
    return this.mapTopicRow(rs.rows[0]);
  }

  public async getAllInterviewTopics(domainId?: string): Promise<Array<InterviewTopicEntity & { progress?: UserTopicProgress }>> {
    await this.initSchema();
    let query = `
      SELECT t.*, p.gap_status, p.reviewed_count, p.last_reviewed_at, p.notes
      FROM interview_topics t
      LEFT JOIN interview_user_progress p ON t.id = p.topic_id
    `;
    const args: any[] = [];
    if (domainId) {
      query += ` WHERE t.domain_id = ?`;
      args.push(domainId);
    }
    query += ` ORDER BY t.created_at ASC`;

    const rs = await this.client.execute({ sql: query, args });
    return rs.rows.map(r => this.mapTopicRow(r));
  }

  public async saveInterviewTopic(topic: InterviewTopicEntity): Promise<void> {
    await this.initSchema();
    const now = new Date().toISOString();

    await this.client.execute({
      sql: `INSERT INTO interview_topics (
        id, domain_id, domain_title, title, target_intent, trigger_keywords,
        recall_5s, interview_answer, deep_dive, practical_example, trade_offs,
        follow_ups, common_traps, active_recall, layers, why_ladder,
        code_reaction, cross_link_node_id, created_at, updated_at
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
        updated_at = excluded.updated_at`,
      args: [
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
      ]
    });

    await this.client.execute({
      sql: `INSERT OR IGNORE INTO interview_user_progress (topic_id, gap_status, reviewed_count, last_reviewed_at)
            VALUES (?, 'MUST_LEARN', 0, NULL)`,
      args: [topic.id]
    });
  }

  public async updateUserTopicProgress(progress: {
    topic_id: string;
    gap_status?: GapStatus;
    reviewed_count?: number;
    last_reviewed_at?: string;
    notes?: string;
  }): Promise<void> {
    await this.initSchema();
    const existing = await this.client.execute({
      sql: 'SELECT * FROM interview_user_progress WHERE topic_id = ?',
      args: [progress.topic_id]
    });

    const now = progress.last_reviewed_at || new Date().toISOString();

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      const newReviewedCount = progress.reviewed_count !== undefined
        ? progress.reviewed_count
        : Number(row.reviewed_count || 0) + 1;

      await this.client.execute({
        sql: `UPDATE interview_user_progress SET
                gap_status = COALESCE(?, gap_status),
                reviewed_count = ?,
                last_reviewed_at = ?,
                notes = COALESCE(?, notes)
              WHERE topic_id = ?`,
        args: [
          progress.gap_status || null,
          newReviewedCount,
          now,
          progress.notes || null,
          progress.topic_id
        ]
      });
    } else {
      await this.client.execute({
        sql: `INSERT INTO interview_user_progress (topic_id, gap_status, reviewed_count, last_reviewed_at, notes)
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          progress.topic_id,
          progress.gap_status || 'MUST_LEARN',
          progress.reviewed_count ?? 1,
          now,
          progress.notes || null
        ]
      });
    }
  }

  public async getGapMapSummary(): Promise<GapMapSummary> {
    await this.initSchema();
    const totalTopicsRs = await this.client.execute('SELECT COUNT(*) as count FROM interview_topics');
    const totalTopics = Number(totalTopicsRs.rows[0]?.count || 0);

    const domainsCountRs = await this.client.execute('SELECT COUNT(DISTINCT domain_id) as count FROM interview_topics');
    const totalDomains = Number(domainsCountRs.rows[0]?.count || 0);

    const statusCountsRs = await this.client.execute(`
      SELECT gap_status, COUNT(*) as count
      FROM interview_user_progress
      GROUP BY gap_status
    `);

    let readyCount = 0;
    let knowCount = 0;
    let weakCount = 0;
    let mustLearnCount = 0;

    for (const row of statusCountsRs.rows) {
      const gs = row.gap_status as string;
      const count = Number(row.count || 0);
      if (gs === 'READY') readyCount = count;
      else if (gs === 'KNOW') knowCount = count;
      else if (gs === 'WEAK') weakCount = count;
      else if (gs === 'MUST_LEARN') mustLearnCount = count;
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
}
