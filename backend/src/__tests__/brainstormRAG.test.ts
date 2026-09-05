import { describe, it, expect, beforeEach } from 'vitest';
import { brainstormRAG, parseBrainstormDocument } from '../rag/brainstormRAG.js';
import { toolHandlers } from '../tools/toolHandlers.js';
import { sqliteClient } from '../db/sqliteClient.js';

describe('RAG Brainstorm Ingestion & Document Parser', () => {
  beforeEach(async () => {
    await toolHandlers.resetToRoot();
  });

  it('should parse a structured brainstorm document into domain, cluster, sub-clusters and nodes', () => {
    const rawDoc = `
[DOMAIN]: AUTHENTICATION & IDENTITY PLATFORM

[SERVICE CLUSTER]: OIDC IDENTITY SERVICE
- [API Gateway (PEP)]: Policy Enforcement Point xác thực mTLS.
- [OIDC Provider Server]: Máy chủ cấp phát JWT và luân chuyển khóa RS256.

[SUB-CLUSTER]: AUTH REDIS CLUSTER
(Namespace: auth:*)
- [Token Revocation Blacklist]: Danh sách token bị thu hồi trên Redis.

[PUBLIC CONTRACT INTERFACE]
(Verify JWT via JWKS / mTLS)
    `;

    const payload = parseBrainstormDocument(rawDoc);

    expect(payload.domain_id).toBe('domain-authentication-identity-platform');
    expect(payload.cluster_name).toBe('OIDC IDENTITY SERVICE');
    expect(payload.nodes).toHaveLength(2);
    expect(payload.nodes[0].title).toBe('API Gateway (PEP)');
    expect(payload.nodes[0].is_public_interface).toBe(true);

    expect(payload.sub_clusters).toBeDefined();
    expect(payload.sub_clusters).toHaveLength(1);
    expect(payload.sub_clusters![0].name).toBe('AUTH REDIS CLUSTER');
    expect(payload.sub_clusters![0].namespace).toBe('auth:*');
    expect(payload.sub_clusters![0].infra_type).toBe('redis');
    expect(payload.sub_clusters![0].nodes[0].title).toBe('Token Revocation Blacklist');
  });

  it('should list available documents in rag/ directory', () => {
    const docs = brainstormRAG.listDocuments();
    expect(Array.isArray(docs)).toBe(true);
    expect(docs.length).toBeGreaterThanOrEqual(1);

    const authDoc = docs.find(d => d.filename.includes('auth'));
    expect(authDoc).toBeDefined();
  });

  it('should ingest and spawn a brainstorm document directly onto the canvas', async () => {
    const rawDoc = `
[DOMAIN]: PAYMENT & FINANCIAL PLATFORM

[SERVICE CLUSTER]: WEBHOOK INGRESS
- [Webhook Receiver]: Nhận webhook thanh toán từ ngân hàng.
- [Idempotency Filter]: Kiểm tra khóa Idempotency Key UUID v4.

[SUB-CLUSTER]: PAYMENT REDIS CLUSTER
(Namespace: payment:lock:*)
- [Distributed Lock]: Khóa nhanh 1ms trên RAM Redis chống race condition.
    `;

    const result = await brainstormRAG.ingestDocument(rawDoc, 'payment_webhook_ingress.md');
    expect(result.success).toBe(true);
    expect(result.cluster_name).toBe('WEBHOOK INGRESS');
    expect(result.nodeCount).toBeGreaterThanOrEqual(3);

    // Verify in SQLite
    const graph = sqliteClient.getCurrentGraph();
    expect(graph).toBeDefined();
    const receiverNode = graph?.nodes.find(n => n.tieu_de === 'Webhook Receiver');
    expect(receiverNode).toBeDefined();
    expect(receiverNode?.domain_id).toBe('domain-payment-financial-platform');

    const lockNode = graph?.nodes.find(n => n.tieu_de === 'Distributed Lock');
    expect(lockNode).toBeDefined();
    expect(lockNode?.sub_cluster_id).toBeDefined();
  });
});
