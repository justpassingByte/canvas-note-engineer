import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CompactClusterNode, CompactSubCluster, SpawnClusterPayload } from '../types/graphTypes.js';
import { toolHandlers } from '../tools/toolHandlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getRagDir(): string {
  const candidates = [
    'C:\\Users\\MSI\\Desktop\\plugin\\rag',
    path.resolve(__dirname, '../../../rag'),
    path.resolve(__dirname, '../../rag'),
    path.resolve(__dirname, '../rag'),
    path.resolve(process.cwd(), 'rag'),
    path.resolve(process.cwd(), '../rag')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.readdirSync(c).some(f => f.endsWith('.md') || f.endsWith('.txt') || f.endsWith('.json'))) {
      return c;
    }
  }
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  const defaultDir = candidates[0];
  if (!fs.existsSync(defaultDir)) fs.mkdirSync(defaultDir, { recursive: true });
  return defaultDir;
}

export interface IngestResult {
  success: boolean;
  cluster_id?: string;
  cluster_name: string;
  domain_id?: string;
  nodeCount: number;
  message: string;
  graph?: any;
}

/**
 * Trình phân tích tài liệu Brainstorm / RFC / Kiến trúc Hệ thống thông minh
 * Hỗ trợ đa định dạng:
 * 1. Markdown Brainstorm phân cấp chuẩn ([DOMAIN], [SERVICE CLUSTER], [SUB-CLUSTER])
 * 2. Technical Design Specification / RFC (Mermaid diagrams, Module boundaries tables)
 * 3. Raw JSON SpawnClusterPayload
 */
export function parseBrainstormDocument(rawText: string, fallbackName: string = 'Phân Hệ Brainstorm'): SpawnClusterPayload {
  const text = rawText.trim();

  // 1. Nếu là định dạng JSON trực tiếp
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.cluster_name && Array.isArray(parsed.nodes)) {
        return parsed as SpawnClusterPayload;
      }
    } catch {}
  }

  // 2. Kiểm tra nếu tài liệu chứa sơ đồ Mermaid Flowchart (như RFC / Technical Spec)
  const mermaidMatch = text.match(/\`\`\`mermaid[\s\S]*?flowchart[\s\S]*?\`\`\`/i);
  if (mermaidMatch) {
    const mermaidBlock = mermaidMatch[0];
    const nodeMatches = [...mermaidBlock.matchAll(/([A-Za-z0-9_]+)\["([^"\]]+)"\]/g)];
    
    if (nodeMatches.length >= 2) {
      let docTitle = fallbackName;
      const titleMatch = text.match(/^#\s+([^\n]+)/m);
      if (titleMatch) {
        docTitle = titleMatch[1].replace(/Technical Design Specification\s*[-—:]?\s*/i, '').trim();
      }

      const domainSlug = 'domain-' + docTitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const serviceNodes: CompactClusterNode[] = [];
      const subClusters: CompactSubCluster[] = [];

      let dbSubCluster: CompactSubCluster | null = null;
      let cacheSubCluster: CompactSubCluster | null = null;
      let workerSubCluster: CompactSubCluster | null = null;

      for (const m of nodeMatches) {
        const id = m[1];
        const label = m[2].trim();
        const labelLower = label.toLowerCase();

        if (labelLower.includes('postgres') || labelLower.includes('database') || labelLower.includes('sql') || labelLower.includes('acid')) {
          if (!dbSubCluster) {
            dbSubCluster = {
              name: 'PostgreSQL Storage & Ledger Subsystem',
              infra_type: 'postgres',
              nodes: []
            };
            subClusters.push(dbSubCluster);
          }
          dbSubCluster.nodes.push({
            title: label,
            summary: `Lưu trữ ACID bền vững cho ${docTitle}`,
            infra_type: 'postgres',
            schematic_template: 'luu_tru_acid'
          });
        } else if (labelLower.includes('redis') || labelLower.includes('cache') || labelLower.includes('rate limit')) {
          if (!cacheSubCluster) {
            cacheSubCluster = {
              name: 'Redis Cache & Rate Limit Subsystem',
              infra_type: 'redis',
              namespace: 'promo:cache:*',
              nodes: []
            };
            subClusters.push(cacheSubCluster);
          }
          cacheSubCluster.nodes.push({
            title: label,
            summary: `Bộ nhớ đệm RAM và kiểm soát tần suất cho ${docTitle}`,
            infra_type: 'redis',
            schematic_template: 'bo_nho_dem_redis'
          });
        } else if (labelLower.includes('outbox') || labelLower.includes('worker') || labelLower.includes('queue') || labelLower.includes('async')) {
          if (!workerSubCluster) {
            workerSubCluster = {
              name: 'Transactional Outbox & Worker Subsystem',
              infra_type: 'kafka',
              nodes: []
            };
            subClusters.push(workerSubCluster);
          }
          workerSubCluster.nodes.push({
            title: label,
            summary: `Xử lý sự kiện bất đồng bộ và outbox cho ${docTitle}`,
            infra_type: 'kafka',
            schematic_template: 'hang_doi_dieu_tiet'
          });
        } else {
          const isPublic = labelLower.includes('http') || labelLower.includes('express') || labelLower.includes('gateway') || labelLower.includes('ingress') || serviceNodes.length === 0;
          serviceNodes.push({
            title: label,
            summary: `Thành phần xử lý nghiệp vụ ${label} trong ${docTitle}`,
            is_public_interface: isPublic,
            schematic_template: isPublic ? 'zero_trust_pep' : 'default'
          });
        }
      }

      if (serviceNodes.length > 0) {
        return {
          domain_id: domainSlug,
          cluster_name: docTitle,
          cluster_theme: 'emerald',
          nodes: serviceNodes,
          sub_clusters: subClusters.length > 0 ? subClusters : undefined,
          connect_to_shared_infra: subClusters.length > 0 ? undefined : ['db', 'cache']
        };
      }
    }
  }

  // 3. Phân tích tài liệu Markdown / Brainstorm text phân cấp chuẩn
  const lines = text.split('\n');
  let domainId = 'domain-custom';
  let clusterName = fallbackName;
  let clusterTheme: any = 'indigo';
  let serviceNodes: CompactClusterNode[] = [];
  const subClusters: CompactSubCluster[] = [];

  let currentSubCluster: CompactSubCluster | null = null;
  let isParsingSubCluster = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.toUpperCase().includes('[DOMAIN]:') || line.toLowerCase().startsWith('domain:')) {
      const dName = line.split(':')[1]?.replace(/[\[\]]/g, '').trim() || 'Custom Domain';
      domainId = 'domain-' + dName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      continue;
    }

    if (line.toUpperCase().includes('[SERVICE CLUSTER]:') || line.toLowerCase().startsWith('service:')) {
      clusterName = line.split(':')[1]?.replace(/[\[\]]/g, '').trim() || fallbackName;
      isParsingSubCluster = false;
      currentSubCluster = null;

      const lower = clusterName.toLowerCase();
      if (lower.includes('auth') || lower.includes('identity')) clusterTheme = 'indigo';
      else if (lower.includes('payment') || lower.includes('promo') || lower.includes('voucher') || lower.includes('idempot')) clusterTheme = 'emerald';
      else if (lower.includes('waf') || lower.includes('ddos')) clusterTheme = 'purple';
      else if (lower.includes('audit') || lower.includes('log')) clusterTheme = 'amber';
      continue;
    }

    if (line.toUpperCase().includes('[SUB-CLUSTER]:') || line.toUpperCase().includes('[INFRA:')) {
      const sName = line.split(':')[1]?.replace(/[\[\]]/g, '').trim() || 'Sub-Cluster';
      const sLower = sName.toLowerCase();
      let infraType: 'redis' | 'postgres' | 'kafka' | 'service' = 'redis';
      if (sLower.includes('db') || sLower.includes('postgres') || sLower.includes('acid')) infraType = 'postgres';
      if (sLower.includes('queue') || sLower.includes('kafka')) infraType = 'kafka';

      currentSubCluster = {
        name: sName,
        infra_type: infraType,
        nodes: []
      };
      subClusters.push(currentSubCluster);
      isParsingSubCluster = true;
      continue;
    }

    if (line.toLowerCase().includes('namespace:') && currentSubCluster) {
      const idx = line.toLowerCase().indexOf('namespace:');
      currentSubCluster.namespace = line.slice(idx + 10).replace(/[()]/g, '').trim();
      continue;
    }

    const isBulletOrNode = line.startsWith('-') || line.startsWith('*') || line.startsWith('•') || line.toLowerCase().startsWith('node:');
    if (isBulletOrNode) {
      const cleanLine = line.replace(/^[-*•]\s*/, '').replace(/^node:\s*/i, '').trim();
      let title = cleanLine;
      let summary = 'Thành phần nghiệp vụ phân hệ';

      if (cleanLine.includes(':')) {
        const parts = cleanLine.split(':');
        title = parts[0].replace(/[\[\]]/g, '').trim();
        summary = parts.slice(1).join(':').trim();
      } else if (cleanLine.includes(']')) {
        const parts = cleanLine.split(']');
        title = parts[0].replace(/[\[]/g, '').trim();
        summary = parts.slice(1).join(']').replace(/^[:\s-]+/, '').trim();
      }

      if (title) {
        const titleLower = title.toLowerCase();
        const isPublic = titleLower.includes('gateway') || titleLower.includes('pep') || titleLower.includes('ingress') || titleLower.includes('public');
        let template = 'default';
        if (titleLower.includes('pep') || titleLower.includes('zero-trust')) template = 'zero_trust_pep';
        else if (titleLower.includes('token') || titleLower.includes('oidc') || titleLower.includes('jwt')) template = 'oauth2_oidc';
        else if (titleLower.includes('blacklist') || titleLower.includes('revocation')) template = 'token_blacklist';
        else if (titleLower.includes('lock') || titleLower.includes('setnx')) template = 'bo_nho_dem_redis';

        const compactNode: CompactClusterNode = {
          title,
          summary: summary || ('Thành phần ' + title),
          is_public_interface: isPublic,
          schematic_template: template
        };

        if (isParsingSubCluster && currentSubCluster) {
          compactNode.infra_type = currentSubCluster.infra_type;
          currentSubCluster.nodes.push(compactNode);
        } else {
          serviceNodes.push(compactNode);
        }
      }
    }
  }

  // 4. Fallback thông minh: nếu là tài liệu Markdown tổng quát với tiêu đề # hoặc ##
  if (serviceNodes.length === 0 && subClusters.length === 0) {
    const titleMatch = text.match(/^#\s+([^\n]+)/m);
    if (titleMatch) {
      clusterName = titleMatch[1].replace(/Technical Design Specification\s*[-—:]?\s*/i, '').trim();
      domainId = 'domain-' + clusterName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    // Trích xuất các đề mục H2 hoặc H3 làm node
    const headingMatches = [...text.matchAll(/#+\s+([\d\.]*\s*[^\n]+)/g)];
    const validHeadings = headingMatches
      .map(m => m[1].replace(/^[\d\.]+\s*/, '').trim())
      .filter(h => h.length > 3 && !h.toLowerCase().includes('mục đích') && !h.toLowerCase().includes('quyết định'));

    if (validHeadings.length >= 2) {
      serviceNodes = validHeadings.slice(0, 4).map((h, idx) => ({
        title: h.slice(0, 32),
        summary: `Mô-đun ${h} trong hệ thống ${clusterName}`,
        is_public_interface: idx === 0
      }));
    } else {
      const meaningfulLines = lines.filter(l => l.length > 5 && !l.startsWith('#') && !l.startsWith('=')).slice(0, 4);
      serviceNodes = meaningfulLines.map((ml, idx) => ({
        title: ml.slice(0, 28).replace(/[\[\]*`]/g, '').trim() || ('Mô-đun ' + (idx + 1)),
        summary: ml,
        is_public_interface: idx === 0
      }));
    }
  }

  if (serviceNodes.length === 0) {
    serviceNodes = [
      {
        title: clusterName + ' Core',
        summary: 'Thành phần xử lý trung tâm sinh từ tài liệu brainstorm.',
        is_public_interface: true
      }
    ];
  }

  return {
    domain_id: domainId,
    cluster_name: clusterName,
    cluster_theme: clusterTheme,
    nodes: serviceNodes,
    sub_clusters: subClusters.length > 0 ? subClusters : undefined,
    connect_to_shared_infra: subClusters.length > 0 ? undefined : ['cache', 'db']
  };
}

export const brainstormRAG = {
  listDocuments(): Array<{ filename: string; size: number; updatedAt: number; title: string }> {
    const ragDir = getRagDir();
    if (!fs.existsSync(ragDir)) return [];
    const files = fs.readdirSync(ragDir);
    return files
      .filter(f => f.endsWith('.md') || f.endsWith('.txt') || f.endsWith('.json'))
      .map(filename => {
        const fullPath = path.join(ragDir, filename);
        const stats = fs.statSync(fullPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const firstLine = content.split('\n')[0].replace(/^[#\[\]\s*-]+/, '').trim() || filename;
        return {
          filename,
          size: stats.size,
          updatedAt: stats.mtimeMs,
          title: firstLine
        };
      });
  },

  async getDocumentContent(filename: string): Promise<string | null> {
    const ragDir = getRagDir();
    const safeFilename = path.basename(filename);
    const fullPath = path.join(ragDir, safeFilename);
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath, 'utf8');
  },

  async ingestDocument(rawText: string, filename?: string): Promise<IngestResult> {
    const payload = parseBrainstormDocument(rawText, filename?.replace(/\.[^/.]+$/, '') || 'Phân Hệ Brainstorm');
    const result = await toolHandlers.spawnConceptCluster(payload);

    return {
      success: result.spawned,
      cluster_id: result.cluster_id,
      cluster_name: payload.cluster_name,
      domain_id: payload.domain_id,
      nodeCount: payload.nodes.length + (payload.sub_clusters?.reduce((acc, s) => acc + s.nodes.length, 0) || 0),
      message: result.message,
      graph: result.graph
    };
  },

  async saveAndIngest(filename: string, content: string): Promise<IngestResult> {
    const ragDir = getRagDir();
    const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9_.-]/g, '_');
    const fullPath = path.join(ragDir, safeFilename);
    fs.writeFileSync(fullPath, content, 'utf8');
    return this.ingestDocument(content, safeFilename);
  }
};
