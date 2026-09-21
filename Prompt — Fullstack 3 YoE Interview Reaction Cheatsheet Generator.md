# ROLE

Bạn là một **Senior Fullstack Engineer + Technical Interview Coach** chuyên đào tạo ứng viên từ Junior → Middle và chuẩn bị phỏng vấn cho các công ty product/global.

Nhiệm vụ của bạn là tạo một **bộ Fullstack Interview Reaction Cheatsheet** dành cho tôi.

## USER CONTEXT

Tôi đang hướng tới vị trí:

> **Fullstack Engineer Senior / Production**

Stack chính:

- TypeScript
- JavaScript
- React
- Next.js
- Node.js
- NestJS
- PostgreSQL
- Redis
- REST API
- WebSocket
- Docker
- CI/CD
- AWS

Tôi có khả năng build project và đã làm các hệ thống thực tế, nhưng có một vấn đề lớn:

> Tôi thường đọc tài liệu → cảm giác hiểu → vài ngày sau quên → khi interviewer hỏi thì không phản xạ được.

Tôi không muốn tiếp tục kiểu học:

> đọc → highlight → cảm giác hiểu → quên.

Tôi muốn chuyển sang:

> **keyword → trigger memory → recall → explain → example → trade-off → follow-up question**

Mục tiêu cuối cùng:

> Khi interviewer hỏi một câu bất kỳ liên quan đến Fullstack, tôi có thể **bật ra framework suy nghĩ trong 5–15 giây**, sau đó mở rộng câu trả lời một cách tự nhiên.

---

# CORE PRINCIPLE

Đừng tạo một documentation dài.

Hãy tạo **CHEATSHEET ĐỂ PHẢN XẠ PHỎNG VẤN**.

Mỗi topic phải trả lời được:

1. Interviewer đang thực sự kiểm tra điều gì?
2. Keyword nào phải trigger kiến thức?
3. Tôi nên nghĩ gì đầu tiên?
4. Câu trả lời ngắn 15–30 giây là gì?
5. Nếu interviewer đào sâu thì mở rộng thế nào?
6. Ví dụ thực tế là gì?
7. Trade-off là gì?
8. Những câu hỏi follow-up thường gặp?
9. Những lỗi trả lời khiến ứng viên mất điểm?
10. Một câu hỏi active recall để tự kiểm tra.

Không viết lan man.

---

# REQUIRED RESPONSE STRUCTURE

Mỗi topic phải có format:

## [TOPIC]

### 🎯 Interviewer đang test gì?

Một hoặc vài dòng.

### ⚡ Trigger Keywords

```text
keyword → keyword → keyword → mental model
```

Ví dụ:

```text
useCallback
→ function identity
→ referential equality
→ React.memo
→ unnecessary child render
```

### 🧠 5-Second Recall

Nếu tôi chỉ có 5 giây để nhớ topic này, phải nhớ gì?

Tối đa 3–5 dòng.

### 🗣️ Interview Answer

Viết một câu trả lời tôi có thể nói trực tiếp trong interview.

Khoảng 20–40 giây.

Không dùng textbook language quá mức.

### 🔍 Deep Dive

Các điểm interviewer có thể đào sâu.

### 💻 Practical Example

Ví dụ code hoặc architecture thực tế khi cần.

### ⚖️ Trade-offs

Phải có:

- Khi nào dùng
- Khi nào không dùng
- Ưu điểm
- Nhược điểm
- Alternative

### 🔥 Follow-up Questions

Liệt kê các câu interviewer có thể hỏi tiếp.

Với mỗi câu:

> `Question → Answer skeleton`

Không cần câu trả lời dài.

### ❌ Common Trap

Các câu trả lời sai / misconception phổ biến.

### 🧪 Active Recall

Đặt 1–3 câu hỏi để tôi tự trả lời mà **không nhìn đáp án**.

---

# IMPORTANT: ANSWER IN LAYERS

Không phải topic nào cũng cần trả lời cùng độ sâu.

Mỗi topic phải có 3 tầng:

### L1 — Junior Recall

Tôi phải biết nó là gì.

### L2 — Middle Explanation

Tôi phải giải thích tại sao nó hoạt động như vậy.

### L3 — Production & Trade-offs

Tôi phải biết:

- trade-off
- production implication
- failure case
- debugging
- scalability
- security
- performance

Ví dụ:

Không chỉ:

> "Redis là in-memory database."

Mà phải đạt:

```text
Redis
→ use case
→ cache vs source of truth
→ TTL
→ invalidation
→ cache stampede
→ consistency
→ failure behavior
→ when NOT to use Redis
```

---

# DOMAIN 1 — JAVASCRIPT FUNDAMENTALS

Cover comprehensively:

- primitive vs reference
- mutable vs immutable
- scope
- lexical environment
- closure
- hoisting
- `var` / `let` / `const`
- execution context
- `this`
- arrow function
- prototype
- prototype chain
- class
- inheritance
- destructuring
- spread/rest
- shallow copy
- deep copy
- equality
- `==` vs `===`
- type coercion
- optional chaining
- nullish coalescing
- function declaration/expression
- higher-order function
- callback
- event loop
- call stack
- Web API
- microtask
- macrotask
- Promise
- async/await
- Promise.all
- Promise.allSettled
- Promise.race
- Promise.any
- error propagation

Đặc biệt tạo các **execution prediction questions**:

```js
console.log(...)
Promise.resolve().then(...)
setTimeout(...)
queueMicrotask(...)
```

Tôi phải có khả năng đoán output + giải thích tại sao.

---

# DOMAIN 2 — BROWSER / WEB PLATFORM

Cover:

- browser lifecycle
- DOM
- rendering pipeline
- reflow
- repaint
- layout
- event propagation
- bubbling
- capturing
- event delegation
- cookies
- localStorage
- sessionStorage
- IndexedDB overview
- HTTP
- HTTPS
- DNS
- TCP
- TLS
- CORS
- CSP
- cache
- browser cache
- CDN
- HTTP headers
- status codes
- WebSocket
- SSE
- polling

Đặc biệt phải có mental model:

```text
Browser
→ DNS
→ TCP/TLS
→ HTTP
→ Server
→ Response
→ Browser
→ Parse
→ Render
```

---

# DOMAIN 3 — REACT FUNDAMENTALS

Cover deeply:

- component
- props
- state
- rendering
- re-render
- reconciliation
- Fiber conceptual overview
- key
- component identity
- controlled/uncontrolled
- lifting state
- composition
- conditional rendering
- list rendering
- event handling
- forms

---

# DOMAIN 4 — REACT HOOKS

Cover:

- useState
- useEffect
- useRef
- useContext
- useReducer
- useMemo
- useCallback
- custom hooks

For every hook answer:

```text
Why does it exist?
What problem does it solve?
When should I use it?
When should I NOT use it?
What happens during render?
What happens after render?
What causes re-render?
What is the common misconception?
```

---

# DOMAIN 5 — REACT ADVANCED

Must cover:

- referential equality
- stale closure
- dependency arrays
- React.memo
- useMemo
- useCallback
- memoization
- effect lifecycle
- cleanup
- race conditions
- AbortController
- Strict Mode
- Suspense
- React.lazy
- code splitting
- transitions
- concurrent rendering conceptual model
- error boundaries
- portals

For `useCallback`, explicitly connect:

```text
new function every render
→ reference changes
→ memoized child sees changed prop
→ child may re-render
→ useCallback can stabilize reference
```

For `useMemo`:

```text
expensive computation
→ dependency-based memoization
→ referential equality
→ optimization
```

For Suspense:

```text
async dependency
→ boundary
→ fallback
→ suspended rendering
→ resume
```

Do NOT oversimplify Suspense as merely "loading component".

---

# DOMAIN 6 — NEXT.JS

Cover:

- App Router
- Server Components
- Client Components
- SSR
- CSR
- SSG
- ISR
- streaming
- hydration
- layouts
- loading
- error
- not-found
- route handlers
- middleware
- Server Actions
- data fetching
- caching
- revalidation
- dynamic rendering
- static rendering
- authentication
- authorization
- cookies
- redirects
- metadata
- image optimization
- code splitting
- performance

Must repeatedly contrast:

```text
Server Component
vs
Client Component
```

and:

```text
SSR
vs
CSR
vs
SSG
vs
ISR
```

---

# DOMAIN 7 — FRONTEND STATE & DATA

Cover:

- local state
- lifted state
- Context
- global client state
- server state
- TanStack Query
- cache
- invalidation
- optimistic update
- pessimistic update
- stale data
- loading/error/empty states
- pagination
- infinite scroll
- debounce
- throttle

Must clearly distinguish:

```text
Client State
vs
Server State
```

---

# DOMAIN 8 — FRONTEND PERFORMANCE

Cover:

- unnecessary re-render
- React.memo
- useMemo
- useCallback
- virtualization
- lazy loading
- dynamic import
- bundle size
- code splitting
- image optimization
- network waterfall
- browser Performance tab
- Core Web Vitals
- LCP
- CLS
- INP

Include debugging scenarios:

> "The page is slow. How do you investigate?"

Do not answer with random optimizations.

Teach the debugging sequence:

```text
Reproduce
→ Measure
→ Identify bottleneck
→ Hypothesis
→ Optimize
→ Measure again
```

---

# DOMAIN 9 — TYPESCRIPT

Cover:

- type vs interface
- union
- intersection
- generics
- generic constraints
- keyof
- typeof
- indexed access
- conditional types
- mapped types
- utility types
- type narrowing
- discriminated union
- type guard
- unknown
- any
- never
- infer
- structural typing
- covariance/contravariance conceptual understanding
- runtime validation vs compile-time types

Especially:

```text
TypeScript type safety
≠
runtime validation
```

---

# DOMAIN 10 — NODE.JS

Cover:

- Node runtime
- event loop
- libuv conceptual model
- non-blocking I/O
- worker threads
- streams
- buffers
- backpressure
- process
- environment variables
- graceful shutdown
- clustering overview
- memory leaks
- CPU-bound tasks

---

# DOMAIN 11 — NESTJS

Cover:

- module
- controller
- provider
- dependency injection
- middleware
- guard
- interceptor
- pipe
- filter
- decorator
- lifecycle
- validation
- exception handling
- configuration
- testing
- custom providers
- request scope
- authentication
- authorization

Must explain:

```text
Middleware
vs
Guard
vs
Interceptor
vs
Pipe
vs
Exception Filter
```

---

# DOMAIN 12 — API DESIGN

Cover:

- REST
- resource modeling
- HTTP methods
- status codes
- pagination
- cursor pagination
- filtering
- sorting
- idempotency
- API versioning
- validation
- error format
- rate limiting
- retry
- timeout
- circuit breaker conceptual understanding
- optimistic concurrency
- ETags overview

Include practical questions:

> "Design an API for orders."

> "How would you make payment API idempotent?"

> "What happens if client retries POST?"

---

# DOMAIN 13 — AUTHENTICATION & SECURITY

This must be a major section.

Cover:

- session authentication
- JWT
- access token
- refresh token
- refresh token rotation
- token family
- cookie
- localStorage
- HttpOnly
- Secure
- SameSite
- CSRF
- XSS
- CORS
- OAuth2 conceptual model
- OpenID Connect overview
- RBAC
- permissions
- resource authorization
- password hashing
- Argon2
- bcrypt
- password reset
- session revocation
- logout
- account takeover
- brute force
- rate limiting
- secret management

Include scenario questions:

> "Where should you store JWT?"

> "Why HttpOnly?"

> "Why does XSS matter?"

> "How do you revoke refresh tokens?"

> "How would you secure an admin dashboard?"

---

# DOMAIN 14 — POSTGRESQL / SQL

This must be another major section.

Cover:

- relational model
- normalization
- denormalization
- PK
- FK
- unique constraint
- indexes
- composite indexes
- selectivity
- B-tree
- query planner
- EXPLAIN
- EXPLAIN ANALYZE
- JOIN
- INNER JOIN
- LEFT JOIN
- aggregation
- GROUP BY
- HAVING
- subquery
- CTE
- window functions
- transaction
- ACID
- isolation levels
- MVCC conceptual understanding
- deadlock
- locking
- optimistic locking
- pessimistic locking
- migration
- soft delete
- audit fields
- N+1
- pagination
- offset vs cursor pagination

Include practical debugging:

> "This query became slow after database reached 10 million rows. What do you do?"

---

# DOMAIN 15 — REDIS

Cover:

- caching
- TTL
- cache-aside
- write-through
- write-back overview
- invalidation
- cache stampede
- cache penetration
- cache avalanche
- distributed lock
- rate limiting
- session
- pub/sub
- Redis Streams overview
- Redis as source of truth vs cache
- failure behavior

Always ask:

> "What happens if Redis goes down?"

---

# DOMAIN 16 — QUEUES / ASYNC PROCESSING

Cover:

- queue
- producer
- consumer
- worker
- retry
- exponential backoff
- dead letter queue
- visibility timeout
- at-least-once delivery
- duplicate processing
- idempotency
- ordering
- eventual consistency

Scenario:

> "Payment succeeded but email failed. How do you design this?"

---

# DOMAIN 17 — WEBSOCKET / REALTIME

Cover:

- WebSocket
- connection lifecycle
- authentication
- reconnect
- heartbeat
- rooms
- broadcasting
- scaling
- Redis adapter
- message ordering
- duplicate events
- offline clients
- graceful disconnect

---

# DOMAIN 18 — FILE UPLOAD

Cover:

- multipart upload
- direct upload
- presigned URL
- S3
- upload validation
- MIME spoofing
- size limits
- virus scanning conceptual
- object naming
- metadata
- private/public bucket
- signed download URL
- CDN
- resumable upload overview

---

# DOMAIN 19 — TESTING

Cover:

- unit test
- integration test
- E2E
- test pyramid
- mocking
- fixture
- test isolation
- database testing
- API testing
- Playwright
- flaky tests
- contract testing overview

Scenario:

> "How would you test checkout?"

---

# DOMAIN 20 — DOCKER / LINUX

Cover:

- Docker image
- container
- Dockerfile
- layers
- multi-stage build
- volumes
- networks
- environment
- Docker Compose
- container healthcheck
- logs
- process
- ports
- Linux permissions
- processes
- signals
- grep
- curl
- ps
- top
- netstat/ss
- systemctl conceptual

---

# DOMAIN 21 — CI/CD

Cover:

- pipeline
- build
- test
- lint
- artifact
- deployment
- environment
- secrets
- rollback
- blue-green deployment
- canary deployment conceptual
- migration safety
- GitHub Actions

Scenario:

> "A deployment passed CI but production is broken. What do you do?"

---

# DOMAIN 22 — AWS

AWS MUST be included because I want to be employable as a real Fullstack Engineer.

Cover at minimum:

## IAM

- user
- role
- policy
- least privilege
- access keys
- temporary credentials

## EC2

- instance
- security group
- SSH
- AMI
- autoscaling conceptual

## S3

- bucket
- object
- bucket policy
- IAM
- presigned URL
- lifecycle
- versioning

## RDS

- managed database
- backups
- Multi-AZ
- read replica
- security group

## VPC

- VPC
- subnet
- public/private subnet
- route table
- internet gateway
- NAT Gateway
- security group
- NACL conceptual

## CloudFront

- CDN
- cache
- origin
- invalidation

## Route 53

- DNS
- record
- routing

## Load Balancer

- ALB
- target group
- health check

## ECS / Fargate

- container deployment
- task
- service
- cluster
- autoscaling conceptual

## Lambda

- serverless
- cold start
- event-driven

## SQS

- queue
- visibility timeout
- retry
- DLQ

## CloudWatch

- logs
- metrics
- alarms

## Secrets Manager / Parameter Store

- secret management

## ECR

- container registry

Also include architecture questions:

> "Deploy a Next.js + NestJS + PostgreSQL application on AWS."

> "How would you make it highly available?"

> "How does a private EC2/ECS service access the internet?"

> "Why should RDS not be publicly accessible?"

> "How does browser upload directly to S3?"

---

# DOMAIN 23 — SYSTEM DESIGN

Target:

> **Senior / Production Fullstack**

Do NOT train me like a Staff Engineer.

Cover:

- requirements
- functional requirements
- non-functional requirements
- traffic estimation
- API
- database
- caching
- queues
- consistency
- availability
- scalability
- failure modes
- observability
- security

Practice systems:

1. URL shortener
2. e-commerce order system
3. payment system
4. chat system
5. file upload service
6. notification system
7. marketplace
8. authentication/session system
9. leaderboard
10. booking system

For every design:

```text
Requirements
→ API
→ Data model
→ Main flow
→ Bottleneck
→ Failure
→ Scaling
→ Trade-off
```

---

# DOMAIN 24 — OBSERVABILITY / DEBUGGING

Cover:

- logs
- metrics
- traces
- correlation ID
- request ID
- latency
- throughput
- error rate
- saturation
- health check
- readiness
- liveness
- alerting

Scenario:

> "Users report checkout is slow. How do you investigate?"

Expected reasoning:

```text
Client
→ CDN
→ Load Balancer
→ API
→ DB
→ Redis
→ Queue
→ External service
```

Find the actual bottleneck instead of guessing.

---

# DOMAIN 25 — SYSTEMATIC DEBUGGING

Create a dedicated section called:

# "I DON'T KNOW — BUT I KNOW HOW TO DEBUG"

This is extremely important.

Teach me how to answer questions when I don't immediately know the answer.

Framework:

```text
Clarify
→ Reproduce
→ Observe
→ Narrow scope
→ Form hypothesis
→ Test hypothesis
→ Fix
→ Verify
→ Prevent regression
```

Include scenarios:

- API returns 500
- API randomly returns 502
- frontend stuck loading
- database query slow
- Redis timeout
- WebSocket disconnects
- memory leak
- CPU spike
- production deployment failed
- user logged out randomly
- duplicate payment
- duplicate queue processing

---

# INTERVIEW RESPONSE FRAMEWORK

Teach me reusable structures.

For technical "What is X?":

```text
Definition
→ Why it exists
→ Example
→ Trade-off
```

For "How would you design X?":

```text
Requirements
→ Architecture
→ Data
→ Flow
→ Failure
→ Scale
→ Trade-off
```

For debugging:

```text
Symptom
→ Reproduce
→ Observe
→ Hypothesis
→ Test
→ Fix
→ Verify
```

For comparison:

```text
A solves...
B solves...
Use A when...
Use B when...
Trade-off...
```

For "I don't know":

Teach me to say:

> "I haven't worked with X directly, but based on the underlying concept, I would approach it like..."

Then reason from fundamentals.

---

# ACTIVE RECALL SYSTEM

This is the most important requirement.

Do NOT make the cheatsheet purely passive.

For every major topic create:

### Recall Card

```text
FRONT:
Interviewer asks:
"Why would you use useCallback?"

BACK:
function identity
→ referential equality
→ memoized child
→ avoid unnecessary render
→ only when it provides value
```

Create cards like this throughout the document.

---

# TRIGGER CHAIN

For important concepts create chains.

Example:

```text
JWT
↓
Access token
↓
Short lifetime
↓
Refresh token
↓
Rotation
↓
Token family
↓
Revocation
↓
Reuse detection
```

Another:

```text
Slow SQL
↓
EXPLAIN
↓
Sequential Scan?
↓
Index?
↓
Selectivity?
↓
JOIN?
↓
N+1?
↓
Pagination?
```

Another:

```text
React slow
↓
Profiler
↓
Which component renders?
↓
Why?
↓
Props?
↓
State?
↓
Context?
↓
Reference identity?
↓
Memoization?
```

Another:

```text
AWS app
↓
Route 53
↓
CloudFront
↓
ALB
↓
ECS
↓
RDS
↓
Redis
↓
S3
```

---

# ANTI-FORGETTING DESIGN

Because I forget after reading, include **spaced repetition prompts**.

For every major domain:

### Day 0

Explain from memory.

### Day 1

Answer 3 questions.

### Day 3

Answer 3 scenario questions.

### Day 7

Explain architecture without notes.

### Day 14

Mock interview.

### Day 30

Mixed-domain interview.

Do NOT make this a generic schedule only.

Generate actual questions.

---

# MIXED INTERVIEW MODE

At the end create a large question bank.

Questions must NOT be grouped by topic.

Mix:

```text
React
SQL
AWS
Auth
Node
System Design
Docker
Redis
Testing
TypeScript
```

because real interviews do not announce:

> "Now I will ask you a Redis question."

Create:

### Easy

50 questions.

### Medium

100 questions.

### Production / Senior

100 questions.

### Scenario / Production

100 questions.

### System Design

50 questions.

### Debugging

50 questions.

---

# RAPID FIRE MODE

Create a section where each question should be answerable within 10–20 seconds.

Examples:

> What is a closure?

> Why useCallback?

> What causes a React re-render?

> What is N+1?

> What is an index?

> What is a transaction?

> What is idempotency?

> JWT vs session?

> Cookie vs localStorage?

> What is CORS?

> What is Redis actually good for?

> What happens if Redis goes down?

> What is a presigned URL?

> S3 vs EBS?

> Security Group vs NACL?

> Public vs private subnet?

> What is a dead letter queue?

> What is eventual consistency?

> What is optimistic locking?

> What is a race condition?

---

# "WHY?" LADDER

For important concepts, recursively ask "why?"

Example:

```text
Why useCallback?
→ stable function reference

Why does that matter?
→ referential equality

Why does referential equality matter?
→ React.memo compares props

Why use React.memo?
→ avoid unnecessary child render

Why might we NOT use it?
→ comparison + complexity may cost more than render
```

Generate these ladders for:

- useCallback
- useMemo
- useEffect
- Suspense
- Redis
- database index
- transaction
- refresh token
- presigned URL
- queue
- Docker
- ALB
- RDS
- S3
- CloudFront
- SQS

---

# CODE REACTION

Include small code snippets and ask:

> "What happens?"

> "What is wrong?"

> "How would you fix it?"

Examples should cover:

- JS event loop
- closure
- async
- React hooks
- stale closure
- dependency array
- TypeScript
- SQL
- NestJS
- authentication
- caching

Do not use huge code blocks.

The goal is **recognition and reaction**, not coding exercises.

---

# REAL PROJECT CONNECTION

When explaining concepts, prefer realistic production examples such as:

```text
Authentication
Order
Payment
Payout
Seller onboarding
File upload
Chat
Marketplace
Admin dashboard
Analytics
Notification
```

Avoid toy examples unless they are specifically useful for explaining fundamentals.

---

# DIFFICULTY CALIBRATION

The target is:

> **Fullstack Engineer with approximately 3 years of professional-equivalent experience.**

Do NOT make every question senior/staff level.

Expected:

### Strong

- JS/TS
- React
- Next.js
- Node/NestJS
- SQL/PostgreSQL
- API
- Auth

### Good

- Redis
- queues
- WebSocket
- testing
- Docker
- CI/CD
- AWS

### Working knowledge

- system design
- scalability
- observability
- distributed systems

### Nice-to-have

- Kubernetes
- Kafka
- Terraform
- advanced distributed systems

Do not let nice-to-have topics overwhelm fundamentals.

---

# OUTPUT FORMAT

Create the final result as a **well-structured Markdown cheatsheet**.

Structure:

```text
# Fullstack Senior Interview Reaction Cheatsheet

## 0. How to Use This
## 1. Interview Mental Models
## 2. JavaScript
## 3. Browser
## 4. React Fundamentals
## 5. React Advanced
## 6. Next.js
## 7. TypeScript
## 8. Frontend State & Data
## 9. Frontend Performance
## 10. Node.js
## 11. NestJS
## 12. API Design
## 13. Authentication & Security
## 14. PostgreSQL / SQL
## 15. Redis
## 16. Queue / Async
## 17. WebSocket
## 18. File Upload
## 19. Testing
## 20. Docker / Linux
## 21. CI/CD
## 22. AWS
## 23. System Design
## 24. Observability
## 25. Debugging
## 26. Rapid Fire
## 27. Scenario Questions
## 28. Mixed Mock Interview
## 29. Spaced Repetition
```

---

# CRITICAL WRITING RULES

1. **Do not write textbook chapters.**
2. Prefer diagrams, chains, tables and trigger keywords.
3. Keep individual explanations short.
4. Go deep only where interviewers commonly drill down.
5. Always explain WHY, not only WHAT.
6. Always include trade-offs.
7. Always include production implications.
8. Always include at least one active recall question.
9. Do not assume I remember fundamentals.
10. Explain missing prerequisites briefly when necessary.
11. Do not use unexplained jargon.
12. If jargon is necessary, define it once.
13. Avoid repeating the same explanation unnecessarily.
14. Cross-reference related topics.
15. Connect frontend ↔ backend ↔ database ↔ AWS.
16. Prefer realistic production scenarios.
17. Do not optimize for memorization of exact sentences.
18. Optimize for **mental models and retrieval cues**.
19. Answers should be short enough to recall but deep enough to expand.
20. Every major topic must have a **5-second mental model**.

---

# FINAL SECTION: PERSONAL GAP MAP

At the end create:

# My Fullstack Production Gap Map

Classify every topic:

```text
🔴 Must Learn
🟠 Weak / Need Practice
🟡 Know but Need Recall
🟢 Interview Ready
```

Do not pretend I know something just because it appears in the cheatsheet.

The objective is not to make me feel knowledgeable.

The objective is:

> **Make me capable of answering technical interview questions under pressure.**

Finally generate a **30-day active recall program** using the generated topics.

Each day:

```text
10 min — Rapid Recall
20 min — Deep Topic
20 min — Scenario Questions
10 min — Explain Out Loud
```

The questions should become progressively harder and should repeatedly revisit old topics using spaced repetition.

The final artifact must feel like a **personal interview operating system**, not a programming textbook.