import { describe, it, expect, beforeEach } from 'vitest';
import { toolHandlers, validateAndSanitizeEdges } from '../tools/toolHandlers.js';
import { sqliteClient } from '../db/sqliteClient.js';
import { NodeEntity, EdgeEntity } from '../types/graphTypes.js';

describe('Hierarchical Spawning & Bounded Context Multi-Cluster Engine (Option B)', () => {
  beforeEach(async () => {
    await toolHandlers.resetToRoot();
  });

  it('should spawn a Domain Service Cluster together with its dedicated Infrastructure Sub-Cluster', async () => {
    const result = await toolHandlers.spawnConceptCluster({
      domain_id: 'domain-auth',
      cluster_name: 'OIDC Identity Service',
      cluster_theme: 'indigo',
      nodes: [
        {
          title: 'API Gateway (PEP)',
          role: 'GATEWAY_PEP',
          summary: 'Zero-Trust Policy Enforcement Point xác thực mTLS và chuyển tiếp token.',
          is_public_interface: true,
          schematic_template: 'zero_trust_pep'
        },
        {
          title: 'OIDC Provider Server',
          role: 'IDP_SERVER',
          summary: 'Máy chủ cấp phát và luân chuyển khóa định danh RSA / ECDSA.',
          is_public_interface: false,
          schematic_template: 'oauth2_oidc'
        }
      ],
      sub_clusters: [
        {
          sub_cluster_id: 'sub-auth-redis',
          name: 'Auth Redis Subsystem',
          infra_type: 'redis',
          namespace: 'auth:*',
          nodes: [
            {
              title: 'Token Revocation Blacklist',
              summary: 'Lưu trữ danh sách JTI bị thu hồi trên Redis với TTL định kỳ.',
              is_public_interface: false,
              infra_type: 'redis',
              schematic_template: 'token_blacklist'
            }
          ]
        }
      ],
      position: { x: 300, y: -450 }
    });

    expect(result.spawned).toBe(true);
    expect(result.cluster_id).toContain('cum-oidc-identity-service');

    const graph = sqliteClient.getCurrentGraph();
    expect(graph).toBeDefined();

    // Verify main service nodes
    const pepNode = graph?.nodes.find(n => n.tieu_de === 'API Gateway (PEP)');
    expect(pepNode).toBeDefined();
    expect(pepNode?.domain_id).toBe('domain-auth');
    expect(pepNode?.is_public_interface).toBe(true);
    expect(pepNode?.infra_type).toBe('gateway');

    // Verify sub-cluster node
    const blacklistNode = graph?.nodes.find(n => n.tieu_de === 'Token Revocation Blacklist');
    expect(blacklistNode).toBeDefined();
    expect(blacklistNode?.domain_id).toBe('domain-auth');
    expect(blacklistNode?.sub_cluster_id).toBe('sub-auth-redis');
    expect(blacklistNode?.is_public_interface).toBe(false);
    expect(blacklistNode?.infra_type).toBe('redis');

    // Verify internal pipeline edge from service cluster to sub-cluster
    const pipelineEdge = graph?.edges.find(e => e.to === blacklistNode?.id);
    expect(pipelineEdge).toBeDefined();
    expect(pipelineEdge?.nhan).toContain('Auth Redis Subsystem');
  });

  it('Anti-Cross-Wiring Defense: should block foreign services from directly wiring into private sub-cluster nodes', () => {
    const authBlacklistNode: NodeEntity = {
      id: 'node-auth-blacklist',
      domain_id: 'domain-auth',
      cluster_id: 'cum-auth-oidc',
      sub_cluster_id: 'sub-auth-redis',
      is_public_interface: false, // Private internal node!
      infra_type: 'redis',
      bieu_tuong: 'bo_nho_dem_cache',
      tieu_de: 'Token Revocation Blacklist',
      nhan_buoc: 'CACHE / BLACKLIST',
      tom_tat: 'Auth Redis',
      toa_do: { x: 500, y: 100 },
      tam: { x: 610, y: 172 },
      fully_explored: true,
      hoat_hoa: { mau: '#059669', tham_so: {} },
      chi_tiet: { phan_loai: 'Cache', tieu_de: 'Token Blacklist', ban_chat: '', chu_thich_so_do: '', ca_thuc_te: [], rui_ro: [] },
      trac_nghiem: { cau_hoi: '', lua_chon: ['', ''], dung: 0, giai_thich: '' }
    };

    const paymentWebhookNode: NodeEntity = {
      id: 'node-payment-webhook',
      domain_id: 'domain-payment',
      cluster_id: 'cum-payment-ingress',
      is_public_interface: true,
      infra_type: 'gateway',
      bieu_tuong: 'su_co_canh_bao',
      tieu_de: 'Payment Webhook Receiver',
      nhan_buoc: 'GATEWAY / INGRESS',
      tom_tat: 'Payment Webhook',
      toa_do: { x: 100, y: 100 },
      tam: { x: 210, y: 172 },
      fully_explored: true,
      hoat_hoa: { mau: '#DC2626', tham_so: {} },
      chi_tiet: { phan_loai: 'Gateway', tieu_de: 'Webhook', ban_chat: '', chu_thich_so_do: '', ca_thuc_te: [], rui_ro: [] },
      trac_nghiem: { cau_hoi: '', lua_chon: ['', ''], dung: 0, giai_thich: '' }
    };

    const allNodes = [authBlacklistNode, paymentWebhookNode];

    // Illegal cross-wiring attempt: Payment directly plugging into Auth's private Token Blacklist
    const illegalEdge: EdgeEntity = {
      from: 'node-payment-webhook',
      to: 'node-auth-blacklist',
      nhan: 'Cross-Domain Hack',
      kieu: 'duong-xung-em-ai'
    };

    const sanitized = validateAndSanitizeEdges(allNodes, [illegalEdge]);

    // Must be rejected by Bounded Context Validator!
    expect(sanitized).toHaveLength(0);
  });

  it('Public Contract Interface: should allow inter-domain communication through public gateways', () => {
    const authGatewayNode: NodeEntity = {
      id: 'node-auth-pep',
      domain_id: 'domain-auth',
      cluster_id: 'cum-auth-oidc',
      is_public_interface: true, // Public PEP Gateway!
      infra_type: 'gateway',
      bieu_tuong: 'khien_bao_ve',
      tieu_de: 'Zero-Trust PEP Gateway',
      nhan_buoc: 'SECURITY / ZERO-TRUST',
      tom_tat: 'Auth Gateway',
      toa_do: { x: 500, y: 100 },
      tam: { x: 610, y: 172 },
      fully_explored: true,
      hoat_hoa: { mau: '#4F46E5', tham_so: {} },
      chi_tiet: { phan_loai: 'Gateway', tieu_de: 'PEP', ban_chat: '', chu_thich_so_do: '', ca_thuc_te: [], rui_ro: [] },
      trac_nghiem: { cau_hoi: '', lua_chon: ['', ''], dung: 0, giai_thich: '' }
    };

    const paymentWebhookNode: NodeEntity = {
      id: 'node-payment-webhook',
      domain_id: 'domain-payment',
      cluster_id: 'cum-payment-ingress',
      is_public_interface: true,
      infra_type: 'gateway',
      bieu_tuong: 'su_co_canh_bao',
      tieu_de: 'Payment Webhook Receiver',
      nhan_buoc: 'GATEWAY / INGRESS',
      tom_tat: 'Payment Webhook',
      toa_do: { x: 100, y: 100 },
      tam: { x: 210, y: 172 },
      fully_explored: true,
      hoat_hoa: { mau: '#DC2626', tham_so: {} },
      chi_tiet: { phan_loai: 'Gateway', tieu_de: 'Webhook', ban_chat: '', chu_thich_so_do: '', ca_thuc_te: [], rui_ro: [] },
      trac_nghiem: { cau_hoi: '', lua_chon: ['', ''], dung: 0, giai_thich: '' }
    };

    const allNodes = [authGatewayNode, paymentWebhookNode];

    const validContractEdge: EdgeEntity = {
      from: 'node-payment-webhook',
      to: 'node-auth-pep',
      nhan: 'mTLS / JWKS Verify JWT',
      kieu: 'duong-xung-em-ai'
    };

    const sanitized = validateAndSanitizeEdges(allNodes, [validContractEdge]);
    expect(sanitized).toHaveLength(1);
    expect(sanitized[0].from).toBe('node-payment-webhook');
    expect(sanitized[0].to).toBe('node-auth-pep');
  });
});
