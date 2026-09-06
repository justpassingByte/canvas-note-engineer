import { describe, it, expect, beforeEach, vi } from 'vitest';
import { brainstormRAG, parseBrainstormDocument } from '../rag/brainstormRAG.js';
import { toolHandlers } from '../tools/toolHandlers.js';
import { sqliteClient } from '../db/sqliteClient.js';
import { ProviderFactory } from '../providers/providerFactory.js';

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

  it('should explicitly report offline fallback notice when no AI provider is configured', async () => {
    vi.spyOn(ProviderFactory, 'getActiveProvider').mockReturnValue(null);

    const rawDoc = `
[DOMAIN]: ORDER MANAGEMENT
[SERVICE CLUSTER]: ORDER INGRESS
- [Order Receiver]: Tiếp nhận đơn đặt hàng
    `;

    const result = await brainstormRAG.ingestDocument(rawDoc, 'order_test.md');
    expect(result.success).toBe(true);
    expect(result.review_report?.elevations_applied.some(e => e.includes('LOCAL_OFFLINE_AST'))).toBe(true);
  });

  it('should support AI-driven document ingestion for arbitrary unstructured RFC text when an active AI provider is present', async () => {
    const mockLlmClusterResponse = JSON.stringify({
      cluster_name: 'VIDEO_TRANSCODING_PIPELINE',
      domain_id: 'domain-video-transcoding',
      cluster_theme: 'cyan',
      nodes: [
        {
          title: 'Chunk Upload Gateway (PEP)',
          role: 'gateway',
          summary: 'Tiếp nhận video 4K MP4 và phân đoạn thành các chunks 10MB.',
          is_public_interface: true,
          schematic_template: 'pipeline_filter'
        },
        {
          title: 'Adaptive Bitrate Transcoder',
          role: 'engine',
          summary: 'Mã hóa song song video sang định dạng HLS đa độ phân giải 1080p, 720p, 480p.',
          is_public_interface: false,
          schematic_template: 'split_allocation'
        }
      ],
      sub_clusters: [
        {
          name: 'Video Chunk Storage & S3 Subsystem',
          infra_type: 'postgres',
          nodes: [
            {
              title: 'S3 Chunk Manifest Store',
              summary: 'Lưu trữ siêu dữ liệu phân đoạn video và đường dẫn file MP4.',
              schematic_template: 'table_row_lock'
            }
          ]
        },
        {
          name: 'Transcoding Task Queue',
          infra_type: 'kafka',
          nodes: [
            {
              title: 'Kafka Transcode Job Topic',
              summary: 'Hàng đợi phân phối tác vụ transcode tới cụm GPU Worker.',
              schematic_template: 'queue_outbox_conveyor'
            }
          ]
        }
      ]
    });

    const mockProvider = {
      config: {
        id: 'mock-ai',
        provider_type: 'deepseek',
        name: 'Mock DeepSeek AI',
        base_url: 'https://api.mock.test',
        api_key: 'sk-mock',
        model: 'deepseek-chat',
        temperature: 0.2,
        is_active: true
      },
      generateCompletion: vi.fn().mockResolvedValue(mockLlmClusterResponse),
      testConnection: vi.fn().mockResolvedValue({ success: true, latency_ms: 10 })
    };

    vi.spyOn(ProviderFactory, 'getActiveProvider').mockReturnValue(mockProvider as any);

    // Unstructured text without any Mermaid or bracket syntax
    const unstructuredFreeText = `
RFC-889: Video Transcoding and Distribution Pipeline.
When content creators upload massive 4K MP4 videos, the frontend hits the chunk upload gateway.
We slice the video into 10MB chunks and queue jobs on Kafka.
Our GPU transcode workers transcode each video to HLS 1080p, 720p, and 480p bitrates.
Metadata is persisted in a database while binary files go to S3.
    `;

    const result = await brainstormRAG.ingestDocument(unstructuredFreeText, 'rfc_video_transcoding.txt');

    expect(result.success).toBe(true);
    expect(result.cluster_name).toBe('VIDEO_TRANSCODING_PIPELINE');
    expect(result.nodeCount).toBeGreaterThanOrEqual(4);
    expect(result.review_report?.elevations_applied.some(e => e.includes('AI_DEEP_COMPREHENSION'))).toBe(true);

    const graph = sqliteClient.getCurrentGraph();
    expect(graph).toBeDefined();
    const gatewayNode = graph?.nodes.find(n => n.tieu_de === 'Chunk Upload Gateway (PEP)');
    expect(gatewayNode).toBeDefined();
    expect(gatewayNode?.is_public_interface).toBe(true);

    const kafkaNode = graph?.nodes.find(n => n.tieu_de === 'Kafka Transcode Job Topic');
    expect(kafkaNode).toBeDefined();
    expect(kafkaNode?.infra_type).toBe('kafka');
  });
});
