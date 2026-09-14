import { InterviewTopicEntity } from '../types/interviewTypes.js';

export interface NodeDisplayMeta {
  id: string;
  title: string;
  layer: string;
  description: string;
}

export const MASTER_NODE_CATALOG: Record<string, NodeDisplayMeta> = {
  'node-ui-view': {
    id: 'node-ui-view',
    title: 'React Client UI & State',
    layer: 'GATEWAY / INGRESS',
    description: 'Render Virtual DOM, Hook closure, memoization & TanStack Query cache'
  },
  'node-rendering-ssr': {
    id: 'node-rendering-ssr',
    title: 'Next.js App Router (RSC Boundary)',
    layer: 'COMPUTE / CONCURRENCY',
    description: 'Server Components, Streaming HTML & Serialization Boundary'
  },
  'node-cong-gateway': {
    id: 'node-cong-gateway',
    title: 'API Gateway & Ingress WAF',
    layer: 'GATEWAY / INGRESS',
    description: 'Rate Limiting (Sliding Window), Idempotency-Key & Reverse Proxy'
  },
  'node-auth-service': {
    id: 'node-auth-service',
    title: 'Auth Service (JWT RTR & Session)',
    layer: 'SECURITY / IDEMPOTENCY',
    description: 'HttpOnly Cookie, Refresh Token Rotation & Token Family Revocation'
  },
  'node-backend-service': {
    id: 'node-backend-service',
    title: 'NestJS Core API Service',
    layer: 'COMPUTE / CONCURRENCY',
    description: 'Request Pipeline, Guards, Interceptors, Pipes & Clean Architecture'
  },
  'node-s3-upload': {
    id: 'node-s3-upload',
    title: 'S3 Object Storage & CDN',
    layer: 'STORAGE / ACID DB',
    description: 'Presigned URL Direct Upload, multipart chunking & CDN caching'
  },
  'node-cache-redis': {
    id: 'node-cache-redis',
    title: 'Redis Distributed Cache & Redlock',
    layer: 'CACHE / DISTRIBUTED LOCK',
    description: 'Cache-Aside, Mutex Redlock, Pipeline TTL & Pub/Sub'
  },
  'node-tru-db': {
    id: 'node-tru-db',
    title: 'PostgreSQL ACID Database',
    layer: 'STORAGE / ACID DB',
    description: 'MVCC Snapshot Isolation, B-Tree Index, Row-level Lock & WAL'
  },
  'node-queue-kafka': {
    id: 'node-queue-kafka',
    title: 'Kafka Message Queue & Event Stream',
    layer: 'ASYNC / QUEUE BUFFER',
    description: 'Consumer Group Partitioning, Dead Letter Queue & At-Least-Once'
  },
  'node-observability': {
    id: 'node-observability',
    title: 'Telemetry Tracing & Correlation ID',
    layer: 'OBSERVABILITY / AUDIT LOG',
    description: 'OpenTelemetry, X-Request-ID propagation, P99 Latency & 4 Golden Signals'
  },
  'node-websocket-realtime': {
    id: 'node-websocket-realtime',
    title: 'WebSocket & Realtime Hub',
    layer: 'COMPUTE / CONCURRENCY',
    description: 'WebSocket lifecycle, heartbeat ping-pong, horizontal scaling with Redis Pub/Sub adapter'
  },
  'node-docker-linux': {
    id: 'node-docker-linux',
    title: 'Docker & Linux Runtime',
    layer: 'COMPUTE / CONCURRENCY',
    description: 'Multi-stage builds, cgroups, POSIX signals (SIGTERM grace period), memory leak diagnosis'
  },
  'node-cicd-pipeline': {
    id: 'node-cicd-pipeline',
    title: 'CI/CD & Zero-Downtime Deploy',
    layer: 'EDGE / WAF RATE LIMIT',
    description: 'GitHub Actions, Blue-Green / Canary deployment & zero-downtime database migrations'
  },
  'node-testing-qa': {
    id: 'node-testing-qa',
    title: 'Playwright & QA Shield',
    layer: 'GATEWAY / INGRESS',
    description: 'Testing trophy, Playwright E2E UI automation, API integration & regression defense'
  }
};

/**
 * Suy luận và tìm Node ID tương ứng trên Canvas từ Topic hoặc Domain
 */
export function resolveTopicCrossLinkNodeId(topic?: Partial<InterviewTopicEntity> | null, domainId?: string): string {
  if (topic?.cross_link_node_id && MASTER_NODE_CATALOG[topic.cross_link_node_id]) {
    return topic.cross_link_node_id;
  }

  const d = (domainId || topic?.domain_id || '').toLowerCase();
  const t = (topic?.title || '').toLowerCase();
  const keywords = (topic?.trigger_keywords || []).map((k) => k.toLowerCase()).join(' ');

  // 1. Frontend & Client View
  if (
    d.includes('react') ||
    t.includes('react') ||
    t.includes('virtual dom') ||
    t.includes('hook') ||
    t.includes('usememo') ||
    t.includes('usecallback') ||
    t.includes('state') ||
    t.includes('stale closure') ||
    keywords.includes('fiber')
  ) {
    return 'node-ui-view';
  }

  // 2. Next.js & Rendering SSR
  if (
    d.includes('nextjs') ||
    t.includes('nextjs') ||
    t.includes('server component') ||
    t.includes('ssr') ||
    t.includes('rsc') ||
    t.includes('streaming') ||
    keywords.includes('app router')
  ) {
    return 'node-rendering-ssr';
  }

  // 3. Auth, Security & Tokens
  if (
    d.includes('auth') ||
    d.includes('security') ||
    t.includes('jwt') ||
    t.includes('auth') ||
    t.includes('cookie') ||
    t.includes('token') ||
    t.includes('rotation') ||
    t.includes('session') ||
    keywords.includes('rtr')
  ) {
    return 'node-auth-service';
  }

  // 4. Ingress, Gateway, API Design & Rate Limiting
  if (
    d.includes('gateway') ||
    d.includes('api-design') ||
    t.includes('gateway') ||
    t.includes('rate limit') ||
    t.includes('idempotency') ||
    t.includes('cors') ||
    t.includes('webhook')
  ) {
    return 'node-cong-gateway';
  }

  // 5. Database, PostgreSQL, ACID & Indexes
  if (
    d.includes('postgresql') ||
    d.includes('database') ||
    t.includes('postgres') ||
    t.includes('mvcc') ||
    t.includes('isolation') ||
    t.includes('acid') ||
    t.includes('index') ||
    t.includes('transaction') ||
    t.includes('deadlock') ||
    keywords.includes('btree')
  ) {
    return 'node-tru-db';
  }

  // 6. Redis & Caching
  if (
    d.includes('redis') ||
    t.includes('redis') ||
    t.includes('cache') ||
    t.includes('redlock') ||
    t.includes('ttl') ||
    t.includes('thundering herd')
  ) {
    return 'node-cache-redis';
  }

  // 7. Message Queues & Kafka
  if (
    d.includes('queue') ||
    t.includes('kafka') ||
    t.includes('rabbitmq') ||
    t.includes('bullmq') ||
    t.includes('queue') ||
    t.includes('dlq') ||
    t.includes('consumer')
  ) {
    return 'node-queue-kafka';
  }

  // 8. File Storage & S3
  if (
    d.includes('file') ||
    d.includes('storage') ||
    t.includes('s3') ||
    t.includes('presigned') ||
    t.includes('upload') ||
    t.includes('cdn')
  ) {
    return 'node-s3-upload';
  }

  // 9. Observability & Monitoring
  if (
    d.includes('observability') ||
    t.includes('telemetry') ||
    t.includes('tracing') ||
    t.includes('opentelemetry') ||
    t.includes('correlation') ||
    t.includes('p99') ||
    t.includes('golden signals')
  ) {
    return 'node-observability';
  }

  // 10. WebSocket & Realtime
  if (
    d.includes('websocket') ||
    t.includes('websocket') ||
    t.includes('realtime') ||
    t.includes('sse') ||
    keywords.includes('heartbeat') ||
    keywords.includes('socket')
  ) {
    return 'node-websocket-realtime';
  }

  // 11. Docker & Linux Runtime
  if (
    d.includes('docker') ||
    d.includes('linux') ||
    t.includes('docker') ||
    t.includes('container') ||
    t.includes('sigterm') ||
    t.includes('oom') ||
    keywords.includes('cgroups')
  ) {
    return 'node-docker-linux';
  }

  // 12. CI/CD & Deployments
  if (
    d.includes('cicd') ||
    t.includes('github actions') ||
    t.includes('blue-green') ||
    t.includes('canary') ||
    t.includes('zero-downtime') ||
    t.includes('migration')
  ) {
    return 'node-cicd-pipeline';
  }

  // 13. Testing & QA Shield
  if (
    d.includes('testing') ||
    t.includes('playwright') ||
    t.includes('test') ||
    t.includes('vitest') ||
    t.includes('mock') ||
    keywords.includes('pyramid')
  ) {
    return 'node-testing-qa';
  }

  // 14. Node.js Runtime & NestJS Core
  return 'node-backend-service';
}

/**
 * Phát sự kiện chuyển chế độ sang Canvas, căn giữa camera và mở Drawer kiểm tra
 */
export function jumpToCanvasNode(nodeId: string) {
  const event = new CustomEvent('switch-to-canvas', { detail: { nodeId } });
  window.dispatchEvent(event);
}

/**
 * Phát sự kiện chuyển sang Interview Lab (tùy chọn mở thẳng topic / flashcard drill)
 */
export function jumpToInterviewLab(options?: {
  topicId?: string;
  domainId?: string;
  tab?: 'reader' | 'drill' | 'gap_map';
  nodeId?: string;
}) {
  const event = new CustomEvent('switch-to-interview', { detail: options || {} });
  window.dispatchEvent(event);
}

export function getNodeMeta(nodeId: string): NodeDisplayMeta {
  return MASTER_NODE_CATALOG[nodeId] || {
    id: nodeId,
    title: 'Kiến Trúc Thành Phần',
    layer: 'COMPUTE / CONCURRENCY',
    description: 'Thành phần kiến trúc hệ thống phân tán'
  };
}

