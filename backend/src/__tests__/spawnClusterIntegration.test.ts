import { describe, it, expect, beforeEach } from 'vitest';
import { toolHandlers } from '../tools/toolHandlers.js';
import { sqliteClient } from '../db/sqliteClient.js';

describe('Parallel Cluster Spawning & Compact Intent Schema Integration', () => {
  beforeEach(async () => {
    await toolHandlers.resetToRoot();
  });

  it('should spawn a multi-node cluster with compact schema and internal sequential links', async () => {
    const result = await toolHandlers.spawnConceptCluster({
      cluster_name: 'Phân Hệ WAF & Rate Limiting',
      cluster_theme: 'indigo',
      nodes: [
        {
          title: 'Lá chắn WAF & Chống DDoS',
          role: 'EDGE_GATEWAY',
          summary: 'Phát hiện và loại bỏ các gói tin rác dội lưu lượng ảo.',
          schematic_template: 'zero_trust_pep'
        },
        {
          title: 'Bộ lọc Rate Limiting Trượt',
          role: 'RATE_LIMITER',
          summary: 'Đếm tần suất request theo thuật toán Sliding Window trên RAM Redis.',
          schematic_template: 'rate_limit_sliding'
        }
      ],
      position: { x: 500, y: -400 }
    });

    expect(result.spawned).toBe(true);
    expect(result.cluster_id).toContain('cum-phan-he-waf-rate-limiting');

    const current = sqliteClient.getCurrentGraph();
    expect(current).toBeDefined();

    // Verify both nodes exist in the graph with the same cluster_id
    const clusterNodes = current!.nodes.filter(n => n.cluster_id === result.cluster_id);
    expect(clusterNodes).toHaveLength(2);
    expect(clusterNodes[0].tieu_de).toBe('Lá chắn WAF & Chống DDoS');
    expect(clusterNodes[1].tieu_de).toBe('Bộ lọc Rate Limiting Trượt');

    // Verify sequential internal edge exists between node 0 and node 1
    const internalEdge = current!.edges.find(e => e.from === clusterNodes[0].id && e.to === clusterNodes[1].id);
    expect(internalEdge).toBeDefined();
    expect(internalEdge?.nhan).toContain('Bộ lọc Rate Limiting Trượt');
  });

  it('should automatically connect to shared infrastructure without creating duplicates', async () => {
    // 1. Spawn cluster with connect_to_shared_infra
    const result = await toolHandlers.spawnConceptCluster({
      cluster_name: 'Phân Hệ Giám Sát Tài Chính',
      cluster_theme: 'amber',
      nodes: [
        {
          title: 'Cổng Thu Thập Telemetry',
          role: 'EDGE_GATEWAY',
          summary: 'Thu thập log và sự kiện tài chính.',
          schematic_template: 'audit_hash_chain'
        }
      ],
      connect_to_shared_infra: ['db', 'cache', 'queue']
    });

    expect(result.spawned).toBe(true);

    const graph = sqliteClient.getCurrentGraph()!;
    expect(graph.nodes.length).toBeGreaterThanOrEqual(2);

    // Verify edges to shared infrastructure exist
    const gatewayNode = graph.nodes.find(n => n.tieu_de === 'Cổng Thu Thập Telemetry')!;
    expect(gatewayNode).toBeDefined();
    expect(graph.edges.some(e => e.from === gatewayNode.id)).toBe(true);
  });
});
