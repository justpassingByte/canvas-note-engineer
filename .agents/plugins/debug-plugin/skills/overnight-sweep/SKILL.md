---
name: overnight-sweep
description: "Autonomous Overnight Multi-Flow SRE Sweep with Parallel Workers, In-Memory CDP RAM Inspection, and Canvas Synthesis."
user-invocable: true
keywords: [overnight, sweep, parallel, testops, cdp, memory, canvas, batch]
---

# Autonomous Overnight Multi-Flow SRE Sweep

A high-speed, parallelized overnight test orchestration protocol for web applications.

## Execution Phases

### Phase 1: Environment Sanity (Zero Zombie Ports)
1. Query active listening ports: `debug_status({ ports: [3000, 4200, 4201, 8080, 9229, 9230] })`.
2. Terminate any orphaned or zombie processes: `debug_kill_ports({ ports: [9229, 9230] })`.
3. Launch the backend runtime with inspect enabled: `debug_start_server({ command: 'pnpm dev:api', inspectPort: 9229, app: 'api' })`.

### Phase 2: Parallel Partitioning (Fan-Out)
Partition the test matrix into 3 concurrent worker pipelines:
- **Worker 1 (User & Catalog)**: `/login`, `/register`, `/products`, category taxonomy tree.
- **Worker 2 (Cart & Checkout)**: `/cart`, quantity mutations, delivery address, voucher calculations.
- **Worker 3 (Financials & Escrow)**: `/payouts/estimate`, BigInt PPM taxes, `/disputes`.

Dispatch each worker with an isolated `contextId` parameter in `debug_browser_run`:
- `contextId: 'worker-1'`
- `contextId: 'worker-2'`
- `contextId: 'worker-3'`

### Phase 3: In-Memory Exception Interception
When any worker detects an HTTP 500:
1. Trigger `debug_inspect_cdp({ inspectPort: 9229, pauseOnExceptions: 'uncaught', expressions: ['sellerRank', 'order.isNegotiated'] })`.
2. Extract the exact callframe (`file:line`) and in-memory variable values directly from the heap.
3. Keep other workers running in parallel without stopping the suite.

### Phase 4: Synthesis & Reporting (Fan-In)
Call `debug_export_overnight_report` to generate:
- `knowledge/OVERNIGHT-SWEEP-<date>.md`
- `knowledge/OVERNIGHT-SWEEP-<date>.canvas.json` (7 Sub-Clusters)
Sync to `plugin-canvas-engineer/rag/` for immediate visualization in the morning.