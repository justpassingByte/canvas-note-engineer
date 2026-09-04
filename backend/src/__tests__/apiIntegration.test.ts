import { describe, it, expect } from 'vitest';

const BACKEND_URL = process.env.TEST_BACKEND_URL || 'http://localhost:3001';

describe('Live Backend REST API Integration Tests', () => {
  it('GET /api/health should respond with status ok and sqlite_wal cache', async () => {
    const res = await fetch(`${BACKEND_URL}/api/health`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    expect(body.status).toBe('ok');
    expect(body.plugin).toBe('interactive_knowledge_graph');
    expect(body.cache).toBe('sqlite_wal');
  });

  it('GET /api/graph/current should return the current knowledge graph with 5 seed nodes', async () => {
    const res = await fetch(`${BACKEND_URL}/api/graph/current`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    const graph = body.graph || body;

    expect(graph).toBeDefined();
    expect(Array.isArray(graph.nodes)).toBe(true);
    expect(graph.nodes.length).toBeGreaterThanOrEqual(5);

    // Verify key nodes exist
    const nodeIds = graph.nodes.map((n: any) => n.id);
    expect(nodeIds).toContain('node-su-co');
    expect(nodeIds).toContain('node-khien-khoa');
  });

  it('POST /api/graph/expand should expand delta nodes and mark parent explored', async () => {
    // First reset to clean state
    await fetch(`${BACKEND_URL}/api/graph/reset`, { method: 'POST' });

    const payload = {
      target_concept_slug: 'node-khien-khoa',
      existing_node_slugs: ['node-su-co', 'node-tranh-chap', 'node-khien-khoa', 'node-tru-db', 'node-tmdt'],
      expansion_intent: 'Tìm hiểu sâu về cơ chế đệm bất đồng bộ'
    };

    const res = await fetch(`${BACKEND_URL}/api/graph/expand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;

    expect(body.expanded).toBe(true);
    expect(body.graph.nodes.length).toBe(7); // 5 initial + 2 delta nodes

    const parent = body.graph.nodes.find((n: any) => n.id === 'node-khien-khoa');
    expect(parent.fully_explored).toBe(true);
  });

  it('POST /api/graph/prune should collapse and expand nodes without token usage', async () => {
    // Collapse action
    const collapseRes = await fetch(`${BACKEND_URL}/api/graph/prune`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ node_id: 'node-khien-khoa', action: 'collapse' })
    });

    expect(collapseRes.status).toBe(200);
    const collapseBody = (await collapseRes.json()) as any;
    expect(collapseBody.success).toBe(true);

    const targetNode = collapseBody.graph.nodes.find((n: any) => n.id === 'node-khien-khoa');
    expect(targetNode.is_collapsed).toBe(true);

    // Expand action
    const expandRes = await fetch(`${BACKEND_URL}/api/graph/prune`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ node_id: 'node-khien-khoa', action: 'expand' })
    });

    expect(expandRes.status).toBe(200);
    const expandBody = (await expandRes.json()) as any;
    expect(expandBody.success).toBe(true);

    const restoredNode = expandBody.graph.nodes.find((n: any) => n.id === 'node-khien-khoa');
    expect(restoredNode.is_collapsed).toBe(false);
  });

  it('POST /api/graph/reset should restore the graph to root state with 5 nodes', async () => {
    const res = await fetch(`${BACKEND_URL}/api/graph/reset`, { method: 'POST' });
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    expect(body.graph.nodes).toHaveLength(5);
  });
});
