import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import http from 'http';
import { app } from '../index.js';

let server: http.Server;
let backendUrl: string;

describe('Live Backend REST API Integration Tests', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        backendUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  beforeEach(async () => {
    await fetch(`${backendUrl}/api/graph/reset`, { method: 'POST' });
  });

  it('GET /api/health should respond with status ok and sqlite_wal cache', async () => {
    const res = await fetch(`${backendUrl}/api/health`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    expect(body.status).toBe('ok');
    expect(body.plugin).toBe('interactive_knowledge_graph');
    expect(body.cache).toBe('sqlite_wal');
  });

  it('GET /api/graph/current should return the current knowledge graph', async () => {
    const res = await fetch(`${backendUrl}/api/graph/current`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    const graph = body.graph || body;

    expect(graph).toBeDefined();
    expect(Array.isArray(graph.nodes)).toBe(true);
  });

  it('POST /api/graph/spawn should spawn a new topic node via REST API and persist to SQLite', async () => {
    const spawnRes = await fetch(`${backendUrl}/api/graph/spawn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        concept_type: 'audit_log',
        title: 'Nhật ký Kiểm toán & Audit Log',
        position: { x: 200, y: -180 }
      })
    });

    expect(spawnRes.status).toBe(200);
    const body = (await spawnRes.json()) as any;
    expect(body.spawned).toBe(true);
    expect(body.node).toBeDefined();
    expect(body.node.tieu_de).toContain('Nhật ký Kiểm toán');
    expect(body.graph.nodes).toHaveLength(1);
  });

  it('POST /api/graph/prune should collapse and expand nodes without token usage', async () => {
    // 1. Spawn a node first
    const spawnRes = await fetch(`${backendUrl}/api/graph/spawn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        concept_type: 'ddos',
        title: 'Lá chắn WAF'
      })
    });
    const spawnBody = await spawnRes.json();
    const nodeId = spawnBody.node.id;

    // 2. Collapse action
    const collapseRes = await fetch(`${backendUrl}/api/graph/prune`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ node_id: nodeId, action: 'collapse' })
    });

    expect(collapseRes.status).toBe(200);
    const collapseBody = (await collapseRes.json()) as any;
    expect(collapseBody.success).toBe(true);

    const targetNode = collapseBody.graph.nodes.find((n: any) => n.id === nodeId);
    expect(targetNode.is_collapsed).toBe(true);

    // 3. Expand action
    const expandRes = await fetch(`${backendUrl}/api/graph/prune`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ node_id: nodeId, action: 'expand' })
    });

    expect(expandRes.status).toBe(200);
    const expandBody = (await expandRes.json()) as any;
    expect(expandBody.success).toBe(true);

    const restoredNode = expandBody.graph.nodes.find((n: any) => n.id === nodeId);
    expect(restoredNode.is_collapsed).toBe(false);
  });

  it('POST /api/graph/spawn-cluster should spawn a multi-node cluster with compact schema via REST API', async () => {
    const res = await fetch(`${backendUrl}/api/graph/spawn-cluster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cluster_name: 'Phân Hệ WAF & Rate Limiting',
        cluster_theme: 'indigo',
        nodes: [
          {
            title: 'Lá chắn WAF & Chống DDoS',
            role: 'EDGE_GATEWAY',
            summary: 'Tường lửa L7 phát hiện tấn công dồn dập từ botnet.',
            schematic_template: 'zero_trust_pep'
          },
          {
            title: 'Bộ lọc Rate Limiting Trượt',
            role: 'RATE_LIMITER',
            summary: 'Đếm tần suất request theo thuật toán Sliding Window trên RAM Redis.',
            schematic_template: 'rate_limit_sliding'
          }
        ]
      })
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.spawned).toBe(true);
    expect(body.cluster_id).toContain('cum-phan-he-waf-rate-limiting');
    expect(body.graph.nodes.length).toBe(2);
  });

  it('POST /api/graph/reset should restore the graph to root state with 0 nodes', async () => {
    const res = await fetch(`${backendUrl}/api/graph/reset`, { method: 'POST' });
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    expect(body.graph.nodes).toHaveLength(0);
  });
});
