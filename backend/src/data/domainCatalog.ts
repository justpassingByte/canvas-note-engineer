import { RoleTrack } from '../types/interviewTypes.js';

export interface DomainMetaItem {
  id: string;
  number: number;
  title: string;
  description: string;
  icon: string;
  track: RoleTrack;
  prerequisites: string[];
  downstream: string[];
  related_domains: string[];
}

export const DOMAIN_CATALOG: DomainMetaItem[] = [
  // 1. FRONTEND SPECIALIST TRACK
  {
    id: 'domain-01-js-fundamentals',
    number: 1,
    title: 'JavaScript Fundamentals',
    description: 'Event loop, closures, execution context, prototypes, async/await, memory management',
    icon: 'Code',
    track: 'frontend',
    prerequisites: [],
    downstream: ['Browser Platform', 'React Fundamentals', 'TypeScript Deep Dive'],
    related_domains: ['domain-02-browser-platform', 'domain-03-react-fundamentals', 'domain-09-typescript']
  },
  {
    id: 'domain-02-browser-platform',
    number: 2,
    title: 'Browser & Web Platform',
    description: 'Rendering pipeline, reflow/repaint, event delegation, storage, CORS, WebSocket',
    icon: 'Globe',
    track: 'frontend',
    prerequisites: ['JavaScript Fundamentals'],
    downstream: ['React Fundamentals', 'Frontend Performance'],
    related_domains: ['domain-01-js-fundamentals', 'domain-08-frontend-perf', 'domain-17-websocket']
  },
  {
    id: 'domain-03-react-fundamentals',
    number: 3,
    title: 'React Fundamentals',
    description: 'Reconciliation, Fiber, component lifecycle, controlled inputs, key identity',
    icon: 'Layers',
    track: 'frontend',
    prerequisites: ['JavaScript Fundamentals', 'Browser & Web Platform'],
    downstream: ['React Hooks', 'React Advanced'],
    related_domains: ['domain-04-react-hooks', 'domain-05-react-advanced']
  },
  {
    id: 'domain-04-react-hooks',
    number: 4,
    title: 'React Hooks',
    description: 'useState, useEffect, useCallback, useMemo, custom hooks, stale closures',
    icon: 'Zap',
    track: 'frontend',
    prerequisites: ['React Fundamentals'],
    downstream: ['React Advanced', 'Frontend State & Data'],
    related_domains: ['domain-03-react-fundamentals', 'domain-05-react-advanced', 'domain-07-frontend-state']
  },
  {
    id: 'domain-05-react-advanced',
    number: 5,
    title: 'React Advanced',
    description: 'Suspense, concurrent mode, transitions, error boundaries, memoization',
    icon: 'Cpu',
    track: 'frontend',
    prerequisites: ['React Hooks'],
    downstream: ['Next.js App Router', 'Frontend Performance'],
    related_domains: ['domain-06-nextjs', 'domain-08-frontend-perf']
  },
  {
    id: 'domain-06-nextjs',
    number: 6,
    title: 'Next.js App Router',
    description: 'RSC vs Client Components, SSR/SSG/ISR, streaming hydration, Server Actions',
    icon: 'Compass',
    track: 'frontend',
    prerequisites: ['React Advanced', 'Browser & Web Platform'],
    downstream: ['Frontend Performance', 'AWS Cloud & Serverless Ecosystem'],
    related_domains: ['domain-05-react-advanced', 'domain-08-frontend-perf', 'domain-22-aws-cloud']
  },
  {
    id: 'domain-07-frontend-state',
    number: 7,
    title: 'Frontend State & Data',
    description: 'Server state vs Client state, TanStack Query, optimistic updates, cache invalidation',
    icon: 'Database',
    track: 'frontend',
    prerequisites: ['React Hooks'],
    downstream: ['Frontend Performance', 'API Design & Protocols'],
    related_domains: ['domain-04-react-hooks', 'domain-12-api-design']
  },
  {
    id: 'domain-08-frontend-perf',
    number: 8,
    title: 'Frontend Performance',
    description: 'Bundle splitting, virtualization, Core Web Vitals (LCP, CLS, INP), profiler',
    icon: 'Activity',
    track: 'frontend',
    prerequisites: ['Browser & Web Platform', 'Next.js App Router'],
    downstream: ['Observability & Monitoring'],
    related_domains: ['domain-02-browser-platform', 'domain-06-nextjs', 'domain-24-observability']
  },
  {
    id: 'domain-09-typescript',
    number: 9,
    title: 'TypeScript Deep Dive',
    description: 'Generics, conditional & mapped types, narrowing, structural typing, zod',
    icon: 'FileCode',
    track: 'frontend',
    prerequisites: ['JavaScript Fundamentals'],
    downstream: ['NestJS Architecture', 'API Design & Protocols'],
    related_domains: ['domain-01-js-fundamentals', 'domain-11-nestjs', 'domain-12-api-design']
  },

  // 2. BACKEND SPECIALIST TRACK
  {
    id: 'domain-10-nodejs',
    number: 10,
    title: 'Node.js Internals',
    description: 'libuv event loop, streams, backpressure, clustering, graceful shutdown',
    icon: 'Server',
    track: 'backend',
    prerequisites: ['JavaScript Fundamentals'],
    downstream: ['NestJS Architecture', 'Queues & Async Processing'],
    related_domains: ['domain-01-js-fundamentals', 'domain-11-nestjs', 'domain-16-queues-async']
  },
  {
    id: 'domain-11-nestjs',
    number: 11,
    title: 'NestJS Architecture',
    description: 'Dependency injection, guards, interceptors, pipes, filters, lifecycle',
    icon: 'Box',
    track: 'backend',
    prerequisites: ['Node.js Internals', 'TypeScript Deep Dive'],
    downstream: ['API Design & Protocols', 'Auth & Security'],
    related_domains: ['domain-09-typescript', 'domain-10-nodejs', 'domain-12-api-design']
  },
  {
    id: 'domain-12-api-design',
    number: 12,
    title: 'API Design & Protocols',
    description: 'REST, GraphQL, idempotency keys, cursor pagination, circuit breaker, rate limiting',
    icon: 'Share2',
    track: 'backend',
    prerequisites: ['Node.js Internals'],
    downstream: ['System & Software Architecture', 'Auth & Security'],
    related_domains: ['domain-13-auth-security', 'domain-23-system-design']
  },
  {
    id: 'domain-13-auth-security',
    number: 13,
    title: 'Authentication & Security',
    description: 'JWT vs Session, RTR, HttpOnly cookie, CSRF, XSS, OAuth2, RBAC, Argon2',
    icon: 'Shield',
    track: 'backend',
    prerequisites: ['API Design & Protocols'],
    downstream: ['System & Software Architecture'],
    related_domains: ['domain-12-api-design', 'domain-23-system-design']
  },
  {
    id: 'domain-14-postgresql',
    number: 14,
    title: 'PostgreSQL & Relational SQL',
    description: 'B-Tree indexes, EXPLAIN ANALYZE, ACID, MVCC, deadlocks, N+1, CTE',
    icon: 'HardDrive',
    track: 'backend',
    prerequisites: ['Node.js Internals'],
    downstream: ['Redis & In-Memory Caching', 'System & Software Architecture'],
    related_domains: ['domain-15-redis', 'domain-23-system-design']
  },
  {
    id: 'domain-15-redis',
    number: 15,
    title: 'Redis & In-Memory Caching',
    description: 'Cache-aside, stampede, avalanche, distributed locks (Redlock), pub/sub',
    icon: 'Flame',
    track: 'backend',
    prerequisites: ['PostgreSQL & Relational SQL'],
    downstream: ['Queues & Async Processing', 'System & Software Architecture'],
    related_domains: ['domain-14-postgresql', 'domain-16-queues-async', 'domain-23-system-design']
  },
  {
    id: 'domain-16-queues-async',
    number: 16,
    title: 'Queues & Async Processing',
    description: 'Producer-consumer, DLQ, exponential backoff, at-least-once, outbox pattern',
    icon: 'Repeat',
    track: 'backend',
    prerequisites: ['Node.js Internals', 'Redis & In-Memory Caching'],
    downstream: ['System & Software Architecture', 'AWS Cloud & Serverless Ecosystem'],
    related_domains: ['domain-15-redis', 'domain-22-aws-cloud', 'domain-23-system-design']
  },
  {
    id: 'domain-17-websocket',
    number: 17,
    title: 'WebSocket & Realtime Communication',
    description: 'Connection lifecycle, heartbeat, reconnect, Redis adapter clustering',
    icon: 'Radio',
    track: 'backend',
    prerequisites: ['Browser & Web Platform', 'Node.js Internals'],
    downstream: ['System & Software Architecture'],
    related_domains: ['domain-02-browser-platform', 'domain-15-redis', 'domain-23-system-design']
  },
  {
    id: 'domain-18-file-upload',
    number: 18,
    title: 'File Upload & Storage Pipelines',
    description: 'Presigned S3 URLs, multipart upload, MIME validation, resumable upload',
    icon: 'UploadCloud',
    track: 'backend',
    prerequisites: ['Node.js Internals'],
    downstream: ['AWS Cloud & Serverless Ecosystem'],
    related_domains: ['domain-10-nodejs', 'domain-22-aws-cloud']
  },

  // 3. CLOUD & DEVOPS TRACK
  {
    id: 'domain-19-testing',
    number: 19,
    title: 'Testing & Quality Assurance',
    description: 'Test pyramid, Playwright E2E, mock vs stub, isolation, test flaky fix',
    icon: 'CheckCircle2',
    track: 'devops_cloud',
    prerequisites: ['React Fundamentals', 'NestJS Architecture'],
    downstream: ['CI/CD Pipelines & Automation'],
    related_domains: ['domain-03-react-fundamentals', 'domain-21-cicd']
  },
  {
    id: 'domain-20-docker-linux',
    number: 20,
    title: 'Docker & Containerization',
    description: 'Multi-stage build, layers caching, process signals, ports, netstat, top, container security',
    icon: 'Terminal',
    track: 'devops_cloud',
    prerequisites: ['Node.js Internals'],
    downstream: ['CI/CD Pipelines & Automation', 'AWS Cloud & Serverless Ecosystem', 'System & Software Architecture'],
    related_domains: ['domain-21-cicd', 'domain-22-aws-cloud', 'domain-23-system-design']
  },
  {
    id: 'domain-21-cicd',
    number: 21,
    title: 'CI/CD Pipelines & Automation',
    description: 'GitHub Actions, blue-green deployment, canary rollouts, migration rollback, zero-downtime',
    icon: 'GitBranch',
    track: 'devops_cloud',
    prerequisites: ['Docker & Containerization', 'Testing & Quality Assurance'],
    downstream: ['AWS Cloud & Serverless Ecosystem', 'System & Software Architecture'],
    related_domains: ['domain-19-testing', 'domain-20-docker-linux', 'domain-22-aws-cloud']
  },
  {
    id: 'domain-22-aws-cloud',
    number: 22,
    title: 'AWS Cloud & Serverless Ecosystem',
    description: 'ECS Fargate, Lambda, S3, DynamoDB, API Gateway, AppSync, CloudWatch, VPC, ALB',
    icon: 'Cloud',
    track: 'devops_cloud',
    prerequisites: ['Docker & Containerization', 'CI/CD Pipelines & Automation', 'Queues & Async Processing'],
    downstream: ['System & Software Architecture', 'Observability & Monitoring'],
    related_domains: ['domain-20-docker-linux', 'domain-21-cicd', 'domain-23-system-design', 'domain-24-observability']
  },

  // 4. SYSTEM ARCHITECT TRACK
  {
    id: 'domain-23-system-design',
    number: 23,
    title: 'System & Software Architecture',
    description: 'REST vs GraphQL, Microservices Saga, Circuit Breakers, Docker/K8s Orchestration, Flash sale concurrency',
    icon: 'LayoutGrid',
    track: 'architecture',
    prerequisites: ['PostgreSQL & Relational SQL', 'Redis & In-Memory Caching', 'Queues & Async Processing', 'AWS Cloud & Serverless Ecosystem'],
    downstream: ['Observability & Monitoring', 'Systematic Debugging & Production Incidents'],
    related_domains: ['domain-14-postgresql', 'domain-15-redis', 'domain-16-queues-async', 'domain-22-aws-cloud']
  },
  {
    id: 'domain-24-observability',
    number: 24,
    title: 'Observability & Monitoring',
    description: 'OpenTelemetry traces, correlation ID, metrics, P99 latency, alerts, CloudWatch Container Insights',
    icon: 'Eye',
    track: 'architecture',
    prerequisites: ['AWS Cloud & Serverless Ecosystem', 'System & Software Architecture'],
    downstream: ['Systematic Debugging & Production Incidents'],
    related_domains: ['domain-22-aws-cloud', 'domain-23-system-design', 'domain-25-debugging']
  },
  {
    id: 'domain-25-debugging',
    number: 25,
    title: 'Systematic Debugging & Production Incidents',
    description: 'Reproduce → Observe → Hypothesis → Test → Fix → Verify regression guard, heap snapshots, 502 troubleshooting',
    icon: 'Bug',
    track: 'architecture',
    prerequisites: ['Observability & Monitoring', 'Node.js Internals'],
    downstream: ['Production Scenario Challenges'],
    related_domains: ['domain-10-nodejs', 'domain-24-observability', 'domain-27-scenario-questions']
  },

  // 5. ALL-ROUND DRILLS & REFLEX TRACK
  {
    id: 'domain-26-rapid-fire',
    number: 26,
    title: 'Rapid Fire Reflex Bank',
    description: '10-20 second instant recall questions across all tech domains',
    icon: 'ZapFast',
    track: 'drills',
    prerequisites: ['JavaScript Fundamentals', 'React Fundamentals', 'Node.js Internals'],
    downstream: ['Mixed Mock Interview Simulation'],
    related_domains: ['domain-01-js-fundamentals', 'domain-28-mixed-mock']
  },
  {
    id: 'domain-27-scenario-questions',
    number: 27,
    title: 'Production Scenario Challenges',
    description: 'What-if failure handling: payment paid but email lost, spike 502 error, database lock storm',
    icon: 'AlertTriangle',
    track: 'drills',
    prerequisites: ['System & Software Architecture', 'Systematic Debugging & Production Incidents'],
    downstream: ['Mixed Mock Interview Simulation'],
    related_domains: ['domain-23-system-design', 'domain-25-debugging', 'domain-28-mixed-mock']
  },
  {
    id: 'domain-28-mixed-mock',
    number: 28,
    title: 'Mixed Mock Interview Simulation',
    description: 'Unannounced multi-domain mock interview questions across all levels and roles',
    icon: 'Users',
    track: 'drills',
    prerequisites: ['Rapid Fire Reflex Bank', 'Production Scenario Challenges'],
    downstream: ['30-Day Spaced Repetition Mastery'],
    related_domains: ['domain-26-rapid-fire', 'domain-27-scenario-questions', 'domain-29-spaced-repetition']
  },
  {
    id: 'domain-29-spaced-repetition',
    number: 29,
    title: '30-Day Spaced Repetition Mastery',
    description: 'Daily 4-step routine: 10m Rapid Recall, 20m Deep, 20m Scenario, 10m Speech',
    icon: 'Calendar',
    track: 'drills',
    prerequisites: ['Mixed Mock Interview Simulation'],
    downstream: [],
    related_domains: ['domain-28-mixed-mock']
  }
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
  'domain-22-aws-cloud': [
    'AWS ECS Fargate vs EC2 Container Orchestration',
    'Serverless Event-Driven Compute with AWS Lambda & Cold-Start Optimization',
    'High-Throughput Object Storage with AWS S3 Presigned URLs, Multipart & Lifecycle',
    'Amazon DynamoDB Single-Table Design & High-Concurrency Partitioning',
    'AWS API Gateway Architecture, Lambda Authorizers & Throttling Defense',
    'Realtime GraphQL with AWS AppSync, WebSocket Subscriptions & Resolvers',
    'AWS CloudWatch Observability, Container Insights & Distributed Tracing'
  ],
  'domain-23-system-design': [
    'REST vs GraphQL API Architecture & High-Scale Data Fetching Trade-offs',
    'Microservices Decomposition, Distributed Transactions (Saga) & Circuit Breakers',
    'Enterprise CI/CD Pipelines: Blue-Green, Canary & Zero-Downtime Database Migrations',
    'Container Orchestration with Docker & Kubernetes (K8s) Production Hardening',
    'High-Concurrency Flash Sale & Inventory Reservation'
  ],
  'domain-24-observability': ['OpenTelemetry Distributed Tracing & Correlation IDs', 'The 4 Golden Signals: Latency, Traffic, Errors, Saturation', 'P99 Latency Spike Root-Cause Investigation'],
  'domain-25-debugging': ['Debugging Flow: Reproduce → Observe → Hypothesis → Fix', 'Investigating Intermittent 502 Bad Gateway', 'Memory Leak Hunting with Heap Snapshots'],
  'domain-26-rapid-fire': ['Rapid Reflex: Closures in 15 Seconds', 'Rapid Reflex: What Causes React Re-render?', 'Rapid Reflex: Optimistic vs Pessimistic Locking'],
  'domain-27-scenario-questions': ['Production Scenario: Payment Succeeded but Email Failed', 'Production Scenario: Database Max Connection Exhaustion', 'Production Scenario: Cache Invalidation Storm'],
  'domain-28-mixed-mock': ['Mixed Interview: Event Loop + SQL Deadlock + Redis', 'Mixed Interview: JWT Security + Next.js Hydration', 'Mixed Interview: AWS VPC + Docker Container Crash'],
  'domain-29-spaced-repetition': ['Spaced Repetition: Day 1 Immediate Recall', 'Spaced Repetition: Day 7 Scenario Drill', 'Spaced Repetition: Day 30 Mixed System Challenge']
};
