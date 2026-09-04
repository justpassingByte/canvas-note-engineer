import { describe, it, expect, beforeEach } from 'vitest';
import { toolHandlers, MAX_GRAPH_NODES } from '../tools/toolHandlers.js';
import { sqliteClient } from '../db/sqliteClient.js';

describe('Dynamic Node Spawning & Anti-Hallucination Capacity Cap', () => {
  beforeEach(async () => {
    // Reset back to initial 5 root nodes before each test
    await toolHandlers.resetToRoot();
  });

  it('should spawn a DDoS Protection node as an independent standalone component in SQLite', async () => {
    const result = await toolHandlers.spawnConceptNode({
      concept_type: 'ddos',
      position: { x: 50, y: -220 }
    });

    expect(result.spawned).toBe(true);
    expect(result.node).toBeDefined();
    expect(result.node?.id).toBe('node-ddos-waf');
    expect(result.node?.tieu_de).toBe('Lá chắn WAF & Chống DDoS');
    expect(result.node?.bieu_tuong).toBe('khien_bao_ve');
    expect(result.node?.parent_id).toBeUndefined(); // Standalone node!

    // Verify persisted to SQLite
    const current = sqliteClient.getCurrentGraph();
    expect(current?.nodes.some(n => n.id === 'node-ddos-waf')).toBe(true);
    expect(current?.nodes.length).toBeGreaterThanOrEqual(6);
  });

  it('should spawn node with valid technical metadata and reflex quiz in SQLite', async () => {
    const result = await toolHandlers.spawnConceptNode({
      concept_type: 'ddos',
      position: { x: 50, y: -220 }
    });

    expect(result.spawned).toBe(true);
    expect(result.node?.chi_tiet?.phan_loai).toBe('CỔNG BẢO VỆ BIÊN & CHỐNG DDOS');
    expect(result.node?.chi_tiet?.ca_thuc_te).toHaveLength(2);
    expect(result.node?.trac_nghiem?.cau_hoi).toContain('Rate Limiting');
  });

  it('should support targeted attachment and enforce Saturation Lock when target slug is specified', async () => {
    // Spawn connected to node-khien-khoa
    const result = await toolHandlers.spawnConceptNode({
      concept_type: 'rate_limiter',
      target_concept_slug: 'node-khien-khoa'
    });

    expect(result.spawned).toBe(true);

    // Parent must now be locked with fully_explored = true
    const parentInDb = result.graph.nodes.find(n => n.id === 'node-khien-khoa');
    expect(parentInDb?.fully_explored).toBe(true);

    // Second attempt to expand from node-khien-khoa MUST be rejected (0 token)
    const secondAttempt = await toolHandlers.spawnConceptNode({
      concept_type: 'another_node',
      target_concept_slug: 'node-khien-khoa'
    });

    expect(secondAttempt.spawned).toBe(false);
    expect(secondAttempt.message).toContain('đã bão hòa và bị khóa');
  });

  it('should enforce Global Graph Capacity Cap (Max 12 Nodes) to block AI hallucination when near full', async () => {
    expect(MAX_GRAPH_NODES).toBe(12);

    let graph = (await toolHandlers.createKnowledgeGraph()).graph;
    expect(graph.nodes).toHaveLength(5);

    // Spawn nodes until reaching 12
    let counter = 1;
    while (graph.nodes.length < MAX_GRAPH_NODES) {
      const res = await toolHandlers.spawnConceptNode({
        concept_type: `service-${counter++}`
      });
      expect(res.spawned).toBe(true);
      graph = res.graph;
    }

    expect(graph.nodes).toHaveLength(MAX_GRAPH_NODES);

    // 13th spawn attempt MUST be blocked by the Anti-Hallucination Capacity Cap
    const blockedSpawn = await toolHandlers.spawnConceptNode({
      concept_type: 'overflow-node'
    });

    expect(blockedSpawn.spawned).toBe(false);
    expect(blockedSpawn.message).toContain(`ngưỡng trần an toàn (${MAX_GRAPH_NODES} nodes)`);

    // expandConceptNode must ALSO respect the capacity cap
    const blockedExpand = await toolHandlers.expandConceptNode({
      target_concept_slug: 'node-su-co',
      existing_node_slugs: graph.nodes.map(n => n.id)
    });

    expect(blockedExpand.expanded).toBe(false);
    expect(blockedExpand.message).toContain(`ngưỡng trần an toàn (${MAX_GRAPH_NODES} nodes)`);
  });

  it('should restore capacity when nodes are pruned or deleted', async () => {
    // Fill to 12
    let graph = (await toolHandlers.createKnowledgeGraph()).graph;
    while (graph.nodes.length < MAX_GRAPH_NODES) {
      const res = await toolHandlers.spawnConceptNode({ concept_type: `fill-${graph.nodes.length}` });
      graph = res.graph;
    }
    expect(graph.nodes).toHaveLength(12);

    // Delete one node
    const lastNode = graph.nodes[graph.nodes.length - 1];
    const pruneRes = await toolHandlers.pruneKnowledgeGraph({
      node_id: lastNode.id,
      action: 'delete_permanently'
    });
    expect(pruneRes.success).toBe(true);
    expect(pruneRes.graph.nodes).toHaveLength(11);

    // Now spawning is permitted again!
    const allowedSpawn = await toolHandlers.spawnConceptNode({ concept_type: 'new-node-after-prune' });
    expect(allowedSpawn.spawned).toBe(true);
    expect(allowedSpawn.graph.nodes).toHaveLength(12);
  });

  it('should spawn Audit Log as a new topic with PCI-DSS compliance metadata and reflex quiz in SQLite', async () => {
    const result = await toolHandlers.spawnConceptNode({
      concept_type: 'audit_log',
      position: { x: 300, y: -250 }
    });

    expect(result.spawned).toBe(true);
    expect(result.node).toBeDefined();
    expect(result.node?.id).toMatch(/^node-audit-/);
    expect(result.node?.tieu_de).toContain('Nhật ký Kiểm toán & Audit Log');
    expect(result.node?.bieu_tuong).toBe('ghi_chep_so_sach');
    expect(result.node?.chi_tiet?.phan_loai).toBe('HẠ TẦNG KIỂM TOÁN & TUÂN THỦ');
    expect(result.node?.chi_tiet?.ban_chat).toContain('Append-Only Event Store');
    expect(result.node?.trac_nghiem?.cau_hoi).toContain('Audit Trail');
    expect(result.node?.trac_nghiem?.dung).toBe(0);

    // Verify written to SQLite database
    const dbGraph = sqliteClient.getCurrentGraph();
    expect(dbGraph?.nodes.some(n => n.tieu_de.includes('Audit Log'))).toBe(true);
    expect(dbGraph?.nodes.length).toBeGreaterThanOrEqual(6);
  });

  it('should spawn any arbitrary custom new topic with dynamic title, details and quiz', async () => {
    const customResult = await toolHandlers.spawnConceptNode({
      concept_type: 'elasticsearch_cluster',
      title: 'Cụm Tìm kiếm Phân tán Elasticsearch',
      category: 'HẠ TẦNG CHỈ MỤC & TRUY VẤN',
      description: 'Chỉ mục ngược Reverse Indexing cho phép tìm kiếm toàn văn trong hàng tỷ bản ghi log với độ trễ dưới 10ms.',
      position: { x: 600, y: 150 }
    });

    expect(customResult.spawned).toBe(true);
    expect(customResult.node).toBeDefined();
    expect(customResult.node?.tieu_de).toBe('Cụm Tìm kiếm Phân tán Elasticsearch');
    expect(customResult.node?.nhan_buoc).toBe('HẠ TẦNG CHỈ MỤC & TRUY VẤN');
    expect(customResult.node?.tom_tat).toContain('Reverse Indexing');
    expect(customResult.node?.toa_do).toEqual({ x: 600, y: 150 });
    expect(customResult.node?.chi_tiet?.ca_thuc_te.length).toBeGreaterThan(0);
    expect(customResult.node?.trac_nghiem?.cau_hoi).toContain('Cụm Tìm kiếm Phân tán Elasticsearch');

    // Verify persisted in SQLite
    const current = sqliteClient.getCurrentGraph();
    expect(current?.nodes.some(n => n.tieu_de === 'Cụm Tìm kiếm Phân tán Elasticsearch')).toBe(true);
  });
});
