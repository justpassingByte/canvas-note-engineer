import { createClient } from '@libsql/client';
import { SQLiteKnowledgeClient } from '../db/sqliteClient.js';
import { EnvManager } from '../config/envManager.js';
import path from 'path';

// Nạp biến môi trường từ .env
EnvManager.init();

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error('[Turso Seed] Lỗi: Chưa cấu hình biến môi trường TURSO_DATABASE_URL trong file .env');
    console.error('Vui lòng thêm vào .env:\nTURSO_DATABASE_URL=libsql://your-db-name.turso.io\nTURSO_AUTH_TOKEN=your-token');
    process.exit(1);
  }

  console.log(`[Turso Seed] Bắt đầu đồng bộ dữ liệu sang Turso Cloud: ${url}...`);

  const turso = createClient({ url, authToken });

  // 1. Tạo Schema trên Turso
  console.log('[Turso Seed] 1/4 Đang khởi tạo bảng trên Turso...');
  await turso.batch([
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

  // 2. Đọc dữ liệu từ SQLite local
  console.log('[Turso Seed] 2/4 Đang đọc dữ liệu từ local SQLite (data/knowledge.db)...');
  const localDb = new SQLiteKnowledgeClient();
  const currentGraph = localDb.getCurrentGraph();
  const topics = localDb.getAllInterviewTopics();
  const providerConfigs = localDb.getAllProviderConfigs();

  // 3. Đẩy đồ thị kiến trúc lên Turso
  if (currentGraph) {
    console.log(`[Turso Seed] 3/4 Đang đẩy đồ thị '${currentGraph.id}' (${currentGraph.nodes.length} nodes, ${currentGraph.edges.length} edges)...`);
    await turso.execute({
      sql: `INSERT INTO knowledge_graphs (id, topic, graph_data, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              topic = excluded.topic,
              graph_data = excluded.graph_data,
              updated_at = CURRENT_TIMESTAMP`,
      args: [currentGraph.id, currentGraph.topic || 'Kiến trúc Hệ thống', JSON.stringify(currentGraph)]
    });
  }

  // 4. Dọn sạch dữ liệu rỗng/template cũ và đồng bộ các đề tài phỏng vấn lên Turso
  console.log('[Turso Seed] 4/5 Đang dọn dẹp các bản ghi boilerplate cũ trên Turso Cloud...');
  await turso.execute("DELETE FROM interview_topics WHERE recall_5s LIKE '%không nằm ở cú pháp sáo rỗng%' OR practical_example LIKE '%handleProductionWorkload%'");
  await turso.execute("DELETE FROM interview_user_progress WHERE topic_id NOT IN (SELECT id FROM interview_topics)");

  console.log(`[Turso Seed] 5/5 Đang đồng bộ ${topics.length} đề tài phỏng vấn sang Turso Cloud...`);
  const batchStatements: any[] = [];

  for (const t of topics) {
    batchStatements.push({
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
        t.id,
        t.domain_id,
        t.domain_title,
        t.title,
        t.target_intent,
        JSON.stringify(t.trigger_keywords || []),
        t.recall_5s,
        t.interview_answer,
        t.deep_dive,
        t.practical_example ? JSON.stringify(t.practical_example) : null,
        JSON.stringify(t.trade_offs),
        t.follow_ups ? JSON.stringify(t.follow_ups) : null,
        t.common_traps ? JSON.stringify(t.common_traps) : null,
        t.active_recall ? JSON.stringify(t.active_recall) : null,
        JSON.stringify(t.layers),
        t.why_ladder ? JSON.stringify(t.why_ladder) : null,
        t.code_reaction ? JSON.stringify(t.code_reaction) : null,
        t.cross_link_node_id || null,
        t.created_at || new Date().toISOString(),
        t.updated_at || new Date().toISOString()
      ]
    });

    if (t.progress) {
      batchStatements.push({
        sql: `INSERT INTO interview_user_progress (topic_id, gap_status, reviewed_count, last_reviewed_at, notes)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(topic_id) DO UPDATE SET
                gap_status = excluded.gap_status,
                reviewed_count = excluded.reviewed_count,
                last_reviewed_at = excluded.last_reviewed_at,
                notes = excluded.notes`,
        args: [
          t.id,
          t.progress.gap_status || 'MUST_LEARN',
          t.progress.reviewed_count || 0,
          t.progress.last_reviewed_at || null,
          t.progress.notes || null
        ]
      });
    }
  }

  // Chia nhỏ thành các batch 50 statements để an toàn HTTP payload
  const CHUNK_SIZE = 50;
  for (let i = 0; i < batchStatements.length; i += CHUNK_SIZE) {
    const chunk = batchStatements.slice(i, i + CHUNK_SIZE);
    await turso.batch(chunk);
  }

  console.log('🎉 [Turso Seed] Hoàn tất 100%! Cơ sở dữ liệu Turso đã sẵn sàng phục vụ Vercel Serverless.');
}

main().catch(err => {
  console.error('[Turso Seed] Lỗi trong quá trình seed:', err);
  process.exit(1);
});
