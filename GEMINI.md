---
description: Custom Slash Command Router for Antigravity developer shortcuts
trigger: always_on
---

# Custom Slash Command Routing

When the user starts a message with any of the following slash commands, immediately execute the corresponding skill without asking for clarification:

- `/test [args]`: Invoke skill `e2e-test-engine` to automatically generate and execute unit/integration/E2E test suites with self-healing.
- `/e2e [args]`: Invoke skill `e2e-test-engine` to launch Playwright, click real UI, and run E2E tests.
- `/port [port]`: Invoke skill `port-manager` to detect and terminate any process occupying the given port (e.g. 5173, 3000).
- `/commit [args]`: Invoke skill `git-assistant` to inspect git diff and generate Conventional Commit messages.
- `/responsive [args]`: Invoke skill `responsive-tester` to audit multi-viewport layout across mobile, tablet, and desktop.
- `/api [args]`: Invoke skill `http-client` to test the specified REST endpoint with latency and JSON payload inspection.
- `/conflict [args]`: Invoke skill `git-assistant` to resolve merge conflicts.
- `/bundle [args]`: Invoke skill `bundle-inspector` to audit dist/assets size and package dependencies.
- `/memory [args]`: Invoke MCP server `memory` to read or store knowledge graph entities.
- `/canvas [args]`: Invoke skill `canvas-engineer` to manage, open, query, expand, or export the Engineering Notebook architecture canvas.

# Architectural Knowledge Graph Generation Guidelines

When generating, expanding, or modifying architecture nodes and edges in this repository:
1. **Node Badge / Category (`nhan_buoc`)**:
   - MUST BE an Architectural Layer / Category uppercase (e.g. `GATEWAY / INGRESS`, `COMPUTE / CONCURRENCY`, `SECURITY / IDEMPOTENCY`, `STORAGE / ACID DB`, `ASYNC / QUEUE BUFFER`, `CACHE / DISTRIBUTED LOCK`, `EDGE / WAF RATE LIMIT`, `OBSERVABILITY / AUDIT LOG`, `DOMAIN / E-COMMERCE`).
   - **STRICT PROHIBITION**: NEVER use linear step numbers or prefixes such as "BƯỚC 1 //", "BƯỚC 2 //", "Step 1:", "1.", etc. The architecture graph is a Directed Acyclic Graph (DAG) with multiple branches and multiple parents, not a single sequential step list.
2. **Edge Label (`edges.nhan`)**:
   - MUST BE a Technical Protocol Flow (e.g. `Webhook Timeout Retry`, `Atomic Lock Check`, `ACID Write / Unique Index`, `Async Event Produce`, `Async Audit Stream`, `mTLS Delegation Token`).
   - **STRICT PROHIBITION**: NEVER use numeric ordering prefixes (e.g., "1. ", "2. ", "3.1. ") on connecting edges.
3. **No Duplicate Components (Zero-Duplicate Guard)**:
   - When introducing audit logging, caching, database persistence, queue buffering, or WAF, reuse existing infrastructure nodes (`node-tru-db`, `node-cache`, `node-queue`, `node-audit-log`, `node-ddos-waf`) by creating multi-parent edges rather than duplicating nodes.

