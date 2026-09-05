import { describe, it, expect, beforeEach } from 'vitest';
import { toolHandlers, MAX_GRAPH_NODES } from '../tools/toolHandlers.js';
import { sqliteClient } from '../db/sqliteClient.js';

describe('Dynamic Node Spawning & Anti-Hallucination Capacity Cap', () => {
  beforeEach(async () => {
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
    expect(result.node?.parent_id).toBeUndefined();

    // Verify persisted to SQLite
    const current = sqliteClient.getCurrentGraph();
    expect(current?.nodes.some(n => n.id === 'node-ddos-waf')).toBe(true);
    expect(current?.nodes.length).toBe(1);
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
    // 1. Spawn parent node first
    const parentRes = await toolHandlers.spawnConceptNode({
      concept_type: 'gateway',
      title: 'API Gateway'
    });
    expect(parentRes.spawned).toBe(true);
    const parentId = parentRes.node!.id;

    // 2. Spawn child attached to parent
    const childRes = await toolHandlers.spawnConceptNode({
      concept_type: 'rate_limiter',
      target_concept_slug: parentId
    });
    expect(childRes.spawned).toBe(true);

    // Parent must now be locked with fully_explored = true
    const parentInDb = childRes.graph.nodes.find(n => n.id === parentId);
    expect(parentInDb?.fully_explored).toBe(true);

    // Second attempt to attach from locked parent MUST be rejected (0 token)
    const secondAttempt = await toolHandlers.spawnConceptNode({
      concept_type: 'another_node',
      target_concept_slug: parentId
    });

    expect(secondAttempt.spawned).toBe(false);
    expect(secondAttempt.message).toContain('đã bão hòa và bị khóa');
  });

  it('should enforce Global Graph Capacity Cap (Max 12 Nodes) to block AI hallucination when near full', async () => {
    expect(MAX_GRAPH_NODES).toBe(12);

    let graph = (await toolHandlers.createKnowledgeGraph()).graph;
    expect(graph.nodes).toHaveLength(0);

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
  });

  it('should restore capacity when nodes are pruned or deleted', async () => {
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
    const newSpawn = await toolHandlers.spawnConceptNode({ concept_type: 'freed-slot-node' });
    expect(newSpawn.spawned).toBe(true);
    expect(newSpawn.graph.nodes).toHaveLength(12);
  });

  it('should spawn Audit Log as a new topic with PCI-DSS compliance metadata and reflex quiz in SQLite', async () => {
    const result = await toolHandlers.spawnConceptNode({
      concept_type: 'audit_log',
      title: 'Nhật ký Kiểm toán & Audit Log',
      description: 'Append-only Log bất biến ghi nhận mọi thay đổi trạng thái giao dịch phục vụ đối soát và tuân thủ PCI-DSS.',
      position: { x: 200, y: -180 }
    });

    expect(result.spawned).toBe(true);
    expect(result.node?.tieu_de).toBe('Nhật ký Kiểm toán & Audit Log');
    expect(result.node?.nhan_buoc).toBe('OBSERVABILITY / AUDIT LOG');

    const dbGraph = sqliteClient.getCurrentGraph();
    expect(dbGraph?.nodes.some(n => n.tieu_de.includes('Audit Log'))).toBe(true);
    expect(dbGraph?.nodes.length).toBe(1);
  });

  it('should spawn any arbitrary custom new topic with dynamic title, details and quiz', async () => {
    const result = await toolHandlers.spawnConceptNode({
      concept_type: 'oauth2_token_rotation',
      title: 'Cơ chế RTR Token Rotation',
      category: 'BẢO MẬT PHIÊN ĐĂNG NHẬP',
      description: 'Tự động cấp cặp token mới và hủy token cũ ngay trong 1 lần gọi API.',
      ban_chat: 'Xoay vòng token một lần dùng (Single-Use Token) chống Replay Attack.',
      position: { x: 600, y: -200 }
    });

    expect(result.spawned).toBe(true);
    expect(result.node?.tieu_de).toBe('Cơ chế RTR Token Rotation');
    expect(result.node?.chi_tiet?.phan_loai).toBe('BẢO MẬT PHIÊN ĐĂNG NHẬP');
  });
});
