import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { toolHandlers } from './tools/toolHandlers.js';
import { sqliteClient } from './db/sqliteClient.js';
import { brainstormRAG } from './rag/brainstormRAG.js';

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
    const result = await toolHandlers.spawnConceptNode(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/graph/spawn-cluster', async (req, res) => {
  try {
    const { domain_id, cluster_name, cluster_theme, sub_title, nodes, sub_clusters, connect_to_shared_infra, position } = req.body;
    const result = await toolHandlers.spawnConceptCluster({
      domain_id,
      cluster_name: cluster_name || 'Phân Hệ Kiến Trúc Mới',
      cluster_theme,
      sub_title,
      nodes: nodes || [],
      sub_clusters,
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

// ==========================================
// RAG BRAINSTORM INGESTION & UPLOAD ROUTES
// ==========================================
app.get('/api/rag/documents', (req, res) => {
  try {
    const docs = brainstormRAG.listDocuments();
    res.json({ documents: docs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/rag/document/:filename', async (req, res) => {
  try {
    const content = await brainstormRAG.getDocumentContent(req.params.filename);
    if (content === null) return res.status(404).json({ error: 'Tài liệu không tồn tại' });
    res.json({ filename: req.params.filename, content });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rag/ingest', async (req, res) => {
  try {
    const { filename, content } = req.body;
    let docContent = content;
    if (!docContent && filename) {
      docContent = await brainstormRAG.getDocumentContent(filename);
      if (!docContent) return res.status(404).json({ error: `Không tìm thấy file '${filename}' trong folder rag/` });
    }
    if (!docContent) return res.status(400).json({ error: 'Vui lòng cung cấp nội dung tài liệu hoặc tên file trong rag/' });

    const result = await brainstormRAG.ingestDocument(docContent, filename);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rag/upload', async (req, res) => {
  try {
    const { filename, content } = req.body;
    if (!filename || !content) return res.status(400).json({ error: 'Thiếu filename hoặc content' });

    const result = await brainstormRAG.saveAndIngest(filename, content);
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

export { app };

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  app.listen(PORT, () => {
    console.log(`[DSH Plugin Backend] Máy chủ đang chạy tại http://localhost:${PORT}`);
    console.log(`[DSH Plugin Backend] SQLite Cache: Sẵn sàng cho 0-token caching.`);
  });
}
