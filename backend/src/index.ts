import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { toolHandlers } from './tools/toolHandlers.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Khởi tạo đồ thị mặc định trong SQLite khi server khởi động
toolHandlers.createKnowledgeGraph().catch(err => {
  console.error('Lỗi khi khởi tạo đồ thị SQLite:', err);
});

// API Routes cho Frontend & DeepSeek Harness Webview
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', plugin: 'interactive_knowledge_graph', cache: 'sqlite_wal' });
});

app.get('/api/graph/current', async (req, res) => {
  try {
    const result = await toolHandlers.createKnowledgeGraph();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/graph/create', async (req, res) => {
  try {
    const { topic } = req.body;
    const result = await toolHandlers.createKnowledgeGraph(topic);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/graph/expand', async (req, res) => {
  try {
    const { target_concept_slug, existing_node_slugs, expansion_intent } = req.body;
    const result = await toolHandlers.expandConceptNode({
      target_concept_slug,
      existing_node_slugs: existing_node_slugs || [],
      expansion_intent
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/graph/prune', async (req, res) => {
  try {
    const { node_id, action } = req.body;
    const result = await toolHandlers.pruneKnowledgeGraph({ node_id, action });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/graph/reset', async (req, res) => {
  try {
    const result = await toolHandlers.resetToRoot();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Phục vụ frontend bundle đã build khi chạy dạng plugin độc lập hoặc nhúng webview
const FRONTEND_DIST = path.resolve(process.cwd(), '../frontend/dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[DSH Plugin Backend] Máy chủ đang chạy tại http://localhost:${PORT}`);
  console.log(`[DSH Plugin Backend] SQLite Cache: Sẵn sàng cho 0-token caching.`);
});
