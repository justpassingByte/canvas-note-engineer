import { describe, it, expect, beforeEach } from 'vitest';
import { toolHandlers } from '../tools/toolHandlers.js';
import { sqliteClient } from '../db/sqliteClient.js';

describe('Parallel Cluster Spawning & Compact Intent Schema Integration', () => {
  beforeEach(async () => {
    // Reset back to initial 5 root nodes before each test
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
      connect_to_shared_infra: ['cache', 'queue'],
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
    // Expand queue & cache first to ensure node-cache and node-queue exist
    await toolHandlers.expandConceptNode({
      target_concept_slug: 'node-khien-khoa',
      existing_node_slugs: ['node-su-co', 'node-tranh-chap', 'node-khien-khoa', 'node-tru-db', 'node-tmdt']
    });

    // Verify initial count of DB, Cache, and Queue nodes
    const beforeGraph = sqliteClient.getCurrentGraph()!;
    const dbNodesBefore = beforeGraph.nodes.filter(n => n.id === 'node-tru-db' || n.bieu_tuong === 'khoi_tru_database');
    const cacheNodesBefore = beforeGraph.nodes.filter(n => n.id === 'node-cache' || n.bieu_tuong === 'bo_nho_dem_cache');
    const queueNodesBefore = beforeGraph.nodes.filter(n => n.id === 'node-queue' || n.bieu_tuong === 'hang_doi_message_queue');

    expect(dbNodesBefore).toHaveLength(1);
    expect(cacheNodesBefore).toHaveLength(1);
    expect(queueNodesBefore).toHaveLength(1);

    // Spawn a new cluster that connects to all 3 shared infrastructures
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

    const afterGraph = sqliteClient.getCurrentGraph()!;

    // Verify NO DUPLICATE infrastructure nodes were created
    const dbNodesAfter = afterGraph.nodes.filter(n => n.id === 'node-tru-db' || n.bieu_tuong === 'khoi_tru_database');
    const cacheNodesAfter = afterGraph.nodes.filter(n => n.id === 'node-cache' || n.bieu_tuong === 'bo_nho_dem_cache');
    const queueNodesAfter = afterGraph.nodes.filter(n => n.id === 'node-queue' || n.bieu_tuong === 'hang_doi_message_queue');

    expect(dbNodesAfter).toHaveLength(1);
    expect(cacheNodesAfter).toHaveLength(1);
    expect(queueNodesAfter).toHaveLength(1);

    // Verify edges to existing shared infrastructure exist
    const spawnedNode = afterGraph.nodes.find(n => n.cluster_id === result.cluster_id)!;
    expect(afterGraph.edges.some(e => e.from === spawnedNode.id && e.to === 'node-tru-db')).toBe(true);
    expect(afterGraph.edges.some(e => e.from === spawnedNode.id && e.to === 'node-cache')).toBe(true);
    expect(afterGraph.edges.some(e => e.from === spawnedNode.id && e.to === 'node-queue')).toBe(true);
  });
});
