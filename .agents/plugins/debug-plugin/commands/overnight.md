---
description: "Launch autonomous overnight multi-flow testing sweep with parallel workers and CDP in-memory inspection."
argument-hint: "[--workers 3] [--flows 'auth,cart,checkout,payout']"
---

**Autonomous Overnight Sweep Request**:
$ARGUMENTS

1. Activate the `orchestrator` subagent.
2. Clean up lingering port conflicts using `debug_status` and `debug_kill_ports`.
3. Launch the backend runtime in debug mode using `debug_start_server({ command: 'pnpm dev:api', inspectPort: 9229, app: 'api' })`.
4. Partition application flows across 3 parallel `flow-worker` subagents using isolated `contextId` values ('worker-1', 'worker-2', 'worker-3').
5. If any worker encounters an HTTP 500 or UI crash:
   - Dispatch the `cdp-investigator` subagent to attach to `ws://127.0.0.1:9229`.
   - Freeze the backend on RAM via `debug_inspect_cdp` and capture live heap variables.
   - Continue running other flows concurrently.
6. Synthesize all findings and call `debug_export_overnight_report` to generate `OVERNIGHT-SWEEP-<date>.canvas.json` and `.md`.