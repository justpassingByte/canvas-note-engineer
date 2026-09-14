export interface DomainMetaItem {
  id: string;
  number: number;
  title: string;
  description: string;
  icon: string;
}

export const DOMAIN_CATALOG: DomainMetaItem[] = [
  { id: 'domain-01-js-fundamentals', number: 1, title: 'JavaScript Fundamentals', description: 'Event loop, closures, execution context, prototypes, async/await, memory', icon: 'Code' },
  { id: 'domain-02-browser-platform', number: 2, title: 'Browser & Web Platform', description: 'Rendering pipeline, reflow/repaint, event delegation, storage, CORS, WebSocket', icon: 'Globe' },
  { id: 'domain-03-react-fundamentals', number: 3, title: 'React Fundamentals', description: 'Reconciliation, Fiber, component lifecycle, controlled inputs, key identity', icon: 'Layers' },
  { id: 'domain-04-react-hooks', number: 4, title: 'React Hooks', description: 'useState, useEffect, useCallback, useMemo, custom hooks, stale closures', icon: 'Zap' },
  { id: 'domain-05-react-advanced', number: 5, title: 'React Advanced', description: 'Suspense, concurrent mode, transitions, error boundaries, memoization', icon: 'Cpu' },
  { id: 'domain-06-nextjs', number: 6, title: 'Next.js App Router', description: 'RSC vs Client Components, SSR/SSG/ISR, streaming hydration, Server Actions', icon: 'Compass' },
  { id: 'domain-07-frontend-state', number: 7, title: 'Frontend State & Data', description: 'Server state vs Client state, TanStack Query, optimistic updates, cache', icon: 'Database' },
  { id: 'domain-08-frontend-perf', number: 8, title: 'Frontend Performance', description: 'Bundle splitting, virtualization, Core Web Vitals (LCP, CLS, INP), profiler', icon: 'Activity' },
  { id: 'domain-09-typescript', number: 9, title: 'TypeScript Deep Dive', description: 'Generics, conditional & mapped types, narrowing, structural typing, zod', icon: 'FileCode' },
  { id: 'domain-10-nodejs', number: 10, title: 'Node.js Internals', description: 'libuv event loop, streams, backpressure, clustering, graceful shutdown', icon: 'Server' },
  { id: 'domain-11-nestjs', number: 11, title: 'NestJS Architecture', description: 'Dependency injection, guards, interceptors, pipes, filters, lifecycle', icon: 'Box' },
  { id: 'domain-12-api-design', number: 12, title: 'API Design & Protocols', description: 'REST, idempotency keys, cursor pagination, circuit breaker, rate limiting', icon: 'Share2' },
  { id: 'domain-13-auth-security', number: 13, title: 'Authentication & Security', description: 'JWT vs Session, RTR, HttpOnly cookie, CSRF, XSS, OAuth2, RBAC, Argon2', icon: 'Shield' },
  { id: 'domain-14-postgresql', number: 14, title: 'PostgreSQL & SQL', description: 'B-Tree indexes, EXPLAIN ANALYZE, ACID, MVCC, deadlocks, N+1, CTE', icon: 'HardDrive' },
  { id: 'domain-15-redis', number: 15, title: 'Redis & In-Memory', description: 'Cache-aside, stampede, avalanche, distributed locks (Redlock), pub/sub', icon: 'Flame' },
  { id: 'domain-16-queues-async', number: 16, title: 'Queues & Async Processing', description: 'Producer-consumer, DLQ, exponential backoff, at-least-once, outbox pattern', icon: 'Repeat' },
  { id: 'domain-17-websocket', number: 17, title: 'WebSocket & Realtime', description: 'Connection lifecycle, heartbeat, reconnect, Redis adapter clustering', icon: 'Radio' },
  { id: 'domain-18-file-upload', number: 18, title: 'File Upload & Storage', description: 'Presigned S3 URLs, multipart upload, MIME validation, resumable upload', icon: 'UploadCloud' },
  { id: 'domain-19-testing', number: 19, title: 'Testing & Quality Assurance', description: 'Test pyramid, Playwright E2E, mock vs stub, isolation, test flaky fix', icon: 'CheckCircle2' },
  { id: 'domain-20-docker-linux', number: 20, title: 'Docker & Linux Ops', description: 'Multi-stage build, layers caching, process signals, ports, netstat, top', icon: 'Terminal' },
  { id: 'domain-21-cicd', number: 21, title: 'CI/CD Pipelines', description: 'GitHub Actions, blue-green deployment, canary rollouts, migration rollback', icon: 'GitBranch' },
  { id: 'domain-22-aws-cloud', number: 22, title: 'AWS Cloud Architecture', description: 'VPC private/public, ALB, ECS Fargate, RDS Multi-AZ, S3, CloudFront, SQS', icon: 'Cloud' },
  { id: 'domain-23-system-design', number: 23, title: 'System Design (3 YoE)', description: 'E-commerce checkout, payment flow, URL shortener, chat, booking system', icon: 'LayoutGrid' },
  { id: 'domain-24-observability', number: 24, title: 'Observability & Monitoring', description: 'OpenTelemetry traces, correlation ID, metrics, P99 latency, alerts', icon: 'Eye' },
  { id: 'domain-25-debugging', number: 25, title: 'Systematic Debugging', description: 'Reproduce → Observe → Hypothesis → Test → Fix → Verify regression guard', icon: 'Bug' },
  { id: 'domain-26-rapid-fire', number: 26, title: 'Rapid Fire Reflex Bank', description: '10-20 second instant recall questions across all tech domains', icon: 'ZapFast' },
  { id: 'domain-27-scenario-questions', number: 27, title: 'Production Scenarios', description: 'What-if failure handling: payment paid but email lost, spike 502 error', icon: 'AlertTriangle' },
  { id: 'domain-28-mixed-mock', number: 28, title: 'Mixed Mock Interview', description: 'Unannounced multi-domain mock interview questions across all levels', icon: 'Users' },
  { id: 'domain-29-spaced-repetition', number: 29, title: '30-Day Spaced Repetition', description: 'Daily 4-step routine: 10m Rapid Recall, 20m Deep, 20m Scenario, 10m Speech', icon: 'Calendar' }
];

export const DOMAIN_DEFAULTS: Record<string, string[]> = {
  'domain-01-js-fundamentals': ['Event Loop & Microtask Queue', 'Closures & Lexical Environment', 'Promise.all vs Promise.allSettled Error Handling'],
  'domain-02-browser-platform': ['Critical Rendering Path & Reflow/Repaint', 'Event Delegation & Propagation', 'CORS Preflight & Cookies SameSite'],
  'domain-03-react-fundamentals': ['Fiber Architecture & Reconciliation', 'Controlled vs Uncontrolled Components', 'Key Identity & State Preservation'],
  'domain-04-react-hooks': ['useCallback vs useMemo Referential Equality', 'useEffect Lifecycle & Cleanup Race Conditions', 'useRef Mutable Container vs State'],
  'domain-05-react-advanced': ['React Suspense & Streaming SSR', 'React.memo & Memoization Optimization', 'Error Boundaries & Fallback UI'],
  'domain-06-nextjs': ['Server Components vs Client Components', 'SSR vs CSR vs SSG vs ISR Matrix', 'Server Actions & Form Mutations'],
  'domain-07-frontend-state': ['Client State vs Server State', 'TanStack Query Cache & Invalidation', 'Optimistic Updates & Rollback'],
  'domain-08-frontend-perf': ['Core Web Vitals (LCP, CLS, INP)', 'Virtualization for Large Data Sets', 'Code Splitting & Dynamic Imports'],
  'domain-09-typescript': ['type vs interface & Declaration Merging', 'Discriminated Unions & Type Guards', 'Generics & Conditional Types with infer'],
  'domain-10-nodejs': ['libuv & Node.js Event Loop 6 Phases', 'Streams & Backpressure Handling', 'Memory Leak Profiling in Node.js'],
  'domain-11-nestjs': ['Middleware vs Guard vs Interceptor vs Pipe vs Filter', 'Dependency Injection & Request Scopes', 'Custom Decorators & Metadata Reflection'],
  'domain-12-api-design': ['Idempotency Keys in REST APIs', 'Cursor Pagination vs Offset Pagination', 'Rate Limiting & Token Bucket Algorithm'],
  'domain-13-auth-security': ['JWT vs State-backed Sessions', 'Refresh Token Rotation & Revocation Family', 'CSRF & XSS Protection with HttpOnly Cookies'],
  'domain-14-postgresql': ['B-Tree Index Selectivity & EXPLAIN ANALYZE', 'ACID Transactions & MVCC Isolation Levels', 'Preventing N+1 Queries & CTE Usage'],
  'domain-15-redis': ['Cache-Aside Pattern & Cache Stampede Defense', 'Distributed Locks with Redlock & Lua Scripts', 'Redis Fallback & Graceful Degradation'],
  'domain-16-queues-async': ['Producer-Consumer & Dead Letter Queue (DLQ)', 'Exponential Backoff & Jitter', 'Idempotent Message Consumer Pattern'],
  'domain-17-websocket': ['WebSocket Handshake & Heartbeat Ping-Pong', 'Horizontal Scaling with Redis Pub/Sub Adapter', 'Handling Offline Clients & Message Reconnect'],
  'domain-18-file-upload': ['Direct-to-S3 Upload with Presigned URLs', 'Multipart Chunk Uploads for Large Files', 'MIME Sniffing Validation & Antivirus Pipeline'],
  'domain-19-testing': ['Testing Pyramid & Test Isolation', 'Playwright E2E UI Integration Testing', 'Mocking External APIs & Network Boundaries'],
  'domain-20-docker-linux': ['Multi-Stage Dockerfile for Next.js/NestJS', 'Docker Image Layer Caching Optimization', 'Linux Process Signals (SIGTERM vs SIGKILL)'],
  'domain-21-cicd': ['GitHub Actions CI/CD Pipeline Best Practices', 'Blue-Green vs Canary Deployments', 'Safe Database Migrations in CI/CD'],
  'domain-22-aws-cloud': ['VPC Architecture: Public vs Private Subnets & NAT', 'Application Load Balancer (ALB) & ECS Fargate', 'RDS Multi-AZ Failover & Read Replicas'],
  'domain-23-system-design': ['High-Concurrency Flash Sale / Inventory Reservation', 'URL Shortener with Distributed ID Generator', 'Realtime Chat System Architecture'],
  'domain-24-observability': ['OpenTelemetry Distributed Tracing & Correlation IDs', 'The 4 Golden Signals: Latency, Traffic, Errors, Saturation', 'P99 Latency Spike Root-Cause Investigation'],
  'domain-25-debugging': ['Debugging Flow: Reproduce → Observe → Hypothesis → Fix', 'Investigating Intermittent 502 Bad Gateway', 'Memory Leak Hunting with Heap Snapshots'],
  'domain-26-rapid-fire': ['Rapid Reflex: Closures in 15 Seconds', 'Rapid Reflex: What Causes React Re-render?', 'Rapid Reflex: Optimistic vs Pessimistic Locking'],
  'domain-27-scenario-questions': ['Production Scenario: Payment Succeeded but Email Failed', 'Production Scenario: Database Max Connection Exhaustion', 'Production Scenario: Cache Invalidation Storm'],
  'domain-28-mixed-mock': ['Mixed Interview: Event Loop + SQL Deadlock + Redis', 'Mixed Interview: JWT Security + Next.js Hydration', 'Mixed Interview: AWS VPC + Docker Container Crash'],
  'domain-29-spaced-repetition': ['Spaced Repetition: Day 1 Immediate Recall', 'Spaced Repetition: Day 7 Scenario Drill', 'Spaced Repetition: Day 30 Mixed System Challenge']
};
