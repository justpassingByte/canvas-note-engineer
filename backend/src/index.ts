import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { toolHandlers } from './tools/toolHandlers.js';
import { sqliteClient } from './db/sqliteClient.js';
import { brainstormRAG } from './rag/brainstormRAG.js';
import { PROVIDER_PRESETS, ProviderConfig } from './config/providerConfig.js';
import { ProviderFactory } from './providers/providerFactory.js';
import { AIGraphService } from './services/aiGraphService.js';
import { EnvManager } from './config/envManager.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Khởi tạo và nạp biến môi trường từ file .env
EnvManager.init();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Khởi tạo đồ thị sạch từ SQLite (Không tự động seed dữ liệu mẫu cứng)
console.log('[DSH Plugin Backend] Khởi động với SQLite sạch - Sẵn sàng cho AI sinh đồ thị theo yêu cầu.');
console.log(`[DSH Plugin Backend] File .env đang nạp từ: ${EnvManager.getEnvPath()}`);

// API Routes cho Frontend & DeepSeek Harness Webview
app.get('/api/health', (req, res) => {
  const active = sqliteClient.getActiveProviderConfig();
  res.json({
    status: 'ok',
    plugin: 'interactive_knowledge_graph',
    cache: 'sqlite_wal',
    active_provider: active ? { name: active.name, model: active.model, type: active.provider_type } : null
  });
});

// ==========================================
// AI PROVIDER CONFIGURATION & TEST ROUTES
// ==========================================
app.get('/api/provider/config', (req, res) => {
  try {
    let active = sqliteClient.getActiveProviderConfig();
    if (!active) {
      const activeProvider = ProviderFactory.getActiveProvider();
      if (activeProvider) {
        active = activeProvider.config;
      }
    }

    const all = sqliteClient.getAllProviderConfigs();

    // Masking API key trước khi trả về Frontend để bảo mật tuyệt đối
    const safeActive = active
      ? {
          ...active,
          base_url: EnvManager.resolveBaseUrl(active.provider_type, active.base_url),
          model: EnvManager.resolveModel(active.provider_type, active.model),
          api_key: EnvManager.maskKey(EnvManager.resolveApiKey(active.provider_type, active.api_key)),
          has_env_key: EnvManager.hasKeyInEnv(active.provider_type),
          env_var: `${EnvManager.getPrefixForProvider(active.provider_type)}_API_KEY`
        }
      : null;

    res.json({
      active: safeActive,
      all,
      presets: PROVIDER_PRESETS,
      env_path: EnvManager.getEnvPath()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/provider/config', (req, res) => {
  try {
    const config = req.body as ProviderConfig;
    if (!config.id) {
      config.id = `provider-${Date.now()}`;
    }
    if (!config.base_url || !config.model) {
      return res.status(400).json({ error: 'Thiếu Base URL hoặc Model ID' });
    }

    // 1. Tự động lưu Base URL, API Key, và Model ID vào file .env
    EnvManager.saveProviderToEnv(config.provider_type, {
      baseUrl: config.base_url,
      apiKey: config.api_key,
      model: config.model
    });

    // 2. Trong SQLite, chỉ lưu cấu hình mà KHÔNG lưu khóa bí mật dạng plain-text
    const dbConfig = {
      ...config,
      api_key: EnvManager.maskKey(config.api_key) || '[SAVED_IN_ENV]'
    };
    sqliteClient.saveProviderConfig(dbConfig);

    res.json({ success: true, config: dbConfig });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/provider/test', async (req, res) => {
  try {
    const config = req.body as ProviderConfig;
    if (!config.base_url) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập Base URL' });
    }
    const provider = ProviderFactory.createProvider(config);
    const result = await provider.testConnection();
    res.json(result);
  } catch (error: any) {
    res.json({ success: false, latencyMs: 0, message: `Lỗi: ${error.message}` });
  }
});

app.post('/api/provider/models', async (req, res) => {
  try {
    const config = req.body as ProviderConfig;
    if (!config.base_url) {
      return res.status(400).json({ success: false, message: 'Thiếu Base URL' });
    }
    const provider = ProviderFactory.createProvider(config);
    if (provider.fetchModels) {
      const models = await provider.fetchModels();
      return res.json({ success: true, models });
    }
    res.json({ success: true, models: [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, models: [] });
  }
});

app.post('/api/provider/active/:id', (req, res) => {
  try {
    sqliteClient.setActiveProviderConfig(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/provider/:id', (req, res) => {
  try {
    sqliteClient.deleteProviderConfig(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// AI LIVE GRAPH GENERATION & EXPANSION
// ==========================================
app.post('/api/graph/ai-generate', async (req, res) => {
  try {
    const { topic, domain, userPrompt } = req.body;
    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập chủ đề hoặc bài toán cần phân tích.' });
    }
    const result = await AIGraphService.generateNewGraph({ topic: topic.trim(), domain, userPrompt });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/graph/ai-expand', async (req, res) => {
  try {
    const { nodeId, intent, userInstruction } = req.body;
    if (!nodeId) {
      return res.status(400).json({ error: 'Thiếu nodeId cần mở rộng.' });
    }
    const result = await AIGraphService.expandNodeWithAI({ nodeId, intent, userInstruction });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/graph/ai-spawn-cluster', async (req, res) => {
  try {
    const { prompt, position, connectedToNodeId } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập yêu cầu mô tả Cụm Phân Hệ.' });
    }
    const result = await AIGraphService.spawnClusterWithAI({
      prompt: prompt.trim(),
      position,
      connectedToNodeId
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/graph/ai-spawn-concept', async (req, res) => {
  try {
    const { prompt, position } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập mô tả Khái niệm / Domain.' });
    }
    const result = await AIGraphService.spawnConceptWithAI({
      prompt: prompt.trim(),
      position
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
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

app.get('/api/rag/dictionary', (req, res) => {
  try {
    const glossary = brainstormRAG.extractDynamicGlossary();
    res.json({ dictionary: glossary });
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
    const { filename, content, mode } = req.body;
    let docContent = content;
    if (!docContent && filename) {
      docContent = await brainstormRAG.getDocumentContent(filename);
      if (!docContent) return res.status(404).json({ error: `Không tìm thấy file '${filename}' trong folder rag/` });
    }
    if (!docContent) return res.status(400).json({ error: 'Vui lòng cung cấp nội dung tài liệu hoặc tên file trong rag/' });

    const result = await brainstormRAG.ingestDocument(docContent, filename, { forceMode: mode });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rag/upload', async (req, res) => {
  try {
    const { filename, content, mode } = req.body;
    if (!filename || !content) return res.status(400).json({ error: 'Thiếu filename hoặc content' });

    const result = await brainstormRAG.saveAndIngest(filename, content, { forceMode: mode });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Phục vụ frontend bundle đã build khi chạy dạng plugin độc lập hoặc nhúng webview
const frontendCandidates = [
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist'),
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../../../frontend/dist')
];
const FRONTEND_DIST = frontendCandidates.find(p => fs.existsSync(p));
if (FRONTEND_DIST) {
  console.log(`[DSH Plugin Backend] Đang phục vụ frontend từ: ${FRONTEND_DIST}`);
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
