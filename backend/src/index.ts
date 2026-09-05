import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { toolHandlers } from './tools/toolHandlers.js';
import { sqliteClient } from './db/sqliteClient.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Khởi tạo đồ thị sạch từ SQLite (Không tự động seed dữ liệu mẫu cứng)
console.log('[DSH Plugin Backend] Khởi động với SQLite sạch - Sẵn sàng cho AI sinh đồ thị theo yêu cầu.');

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

app.post('/api/graph/spawn', async (req, res) => {
  try {
    const { concept_type, target_concept_slug, position, title, category, description } = req.body;
    const result = await toolHandlers.spawnConceptNode({
      concept_type: concept_type || 'ddos',
      target_concept_slug,
      position,
      title,
      category,
      description
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/graph/spawn-cluster', async (req, res) => {
  try {
    const { cluster_name, cluster_theme, sub_title, nodes, connect_to_shared_infra, position } = req.body;
    const result = await toolHandlers.spawnConceptCluster({
      cluster_name: cluster_name || 'Phân Hệ Kiến Trúc Mới',
      cluster_theme,
      sub_title,
      nodes: nodes || [],
      connect_to_shared_infra,
      position
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

app.post('/api/graph/update-positions', async (req, res) => {
  try {
    const { positions } = req.body as { positions: Array<{ id: string; x: number; y: number }> };
    const current = sqliteClient.getCurrentGraph();
    if (!current) return res.status(404).json({ error: 'Không tìm thấy đồ thị' });

    if (Array.isArray(positions)) {
      for (const p of positions) {
        const node = current.nodes.find(n => n.id === p.id);
        if (node) {
          node.toa_do = { x: Math.round(p.x), y: Math.round(p.y) };
          node.tam = { x: Math.round(p.x + 110), y: Math.round(p.y + 72) };
        }
      }
      sqliteClient.saveGraph(current);
    }
    res.json({ success: true, graph: current });
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
