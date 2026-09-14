---
name: debug-rca
description: "Root Cause Analysis (RCA) & Full-Stack E2E Debugging Framework. Combines backend Node inspect debugging with Playwright browser automation to systematically isolate, reproduce, and verify frontend & API bugs."
user-invocable: true
keywords: [debug, root-cause, investigation, troubleshooting, sre, playwright, e2e, browser]
---

# Systematic Debugging & Full-Stack Root Cause Analysis (RCA)

A disciplined engineering framework to systematically investigate, reproduce, and verify bugs from the browser UI down to the backend database.

## Core Mandate: NO FIXES WITHOUT ROOT CAUSE PROOF

Do not jump straight into modifying code based on assumptions. Premature fixes introduce subtle regressions and fail edge cases. Every bug fix must follow the 4-phase RCA cycle.

```
+---------------------+     +----------------------+     +-----------------------+     +--------------------+
|  Phase 1: Symptom   | --> |  Phase 2: Evidence   | --> | Phase 3: Hypothesis   | --> |  Phase 4: Root Fix |
|   & Blast Radius    |     | Playwright + Inspect |     |  Isolate & Reproduce  |     |   & Verification   |
+---------------------+     +----------------------+     +-----------------------+     +--------------------+
```

---

## 4-Phase Full-Stack RCA Framework

### Phase 1: Symptom & Blast Radius
1. Identify the symptom: User reported UI freeze, button unresponsive, 500 API error, or failed Playwright test.
2. Determine blast radius: Which routes, components, or API endpoints are broken?

### Phase 2: Evidence Collection (Browser + Backend Correlation)
1. **Launch Services**:
   Call `debug_start_server` to spin up the API (e.g. port 4201, inspect 9230) and Frontend (e.g. port 4200, inspect 9229).
2. **Reproduce via Playwright**:
   Call `debug_browser_run` with the target URL and simulated actions (click, fill form).
   - Set `"headless": false` if performing a live demonstration.
   - Automatically capture:
     - `consoleErrors`: JavaScript runtime errors, React lifecycle crashes.
     - `failedRequests`: HTTP 4xx/5xx status codes, request URLs, and response bodies.
     - `screenshotPath`: Visual evidence saved to `screenshots/`.
3. **Cross-reference with Backend**:
   Compare the failing HTTP request timestamp with backend logs.

### Phase 3: Hypothesis Formation & Isolation
1. Form 2-3 competing hypotheses (e.g. Frontend missing required payload field vs Backend validation schema rejected enum vs DB constraint violated).
2. Verify:
   - For backend test isolation: Run `debug_run_test`.
   - For test pollution: Run `skills/debug-rca/scripts/find-polluter.ps1` (or `.sh`).

### Phase 4: Root Fix & Verification
1. Fix the bug at the root source (e.g. fix the API schema, correct the HTTP payload, or add missing error boundaries).
2. Re-run `debug_browser_run` with the exact same user actions.
3. Confirm that `consoleErrors` is empty, `failedRequests` is empty, and status is `COMPLETED`.

---

## Toolset Overview

The plugin exposes the `debug-controller` MCP server:
- `debug_browser_run`: Full-stack browser scenario runner (Playwright) capturing console, network, and screenshots.
- `debug_status`: Check active dev & inspect ports (`3000, 4200, 4201, 9229, 9230`).
- `debug_kill_ports`: Automatically resolve `EADDRINUSE` port collisions.
- `debug_start_server`: Launch application with `--inspect` enabled.
- `debug_stop_server`: Safely stop spawned debug server processes.
- `debug_run_test`: Run isolated unit/integration tests with clean stack trace capture.

---

## Reference Guides
Read detailed guides in `references/`:
- `references/frontend-e2e-debugging.md`: Full-stack browser & API correlation techniques.
- `references/systematic-debugging.md`: Detailed breakdown of hypothesis testing.
- `references/root-cause-tracing.md`: Backward call stack tracing technique.
- `references/log-and-ci-analysis.md`: Techniques for parsing server & CI logs.
- `references/verification.md`: Iron law of verification evidence.
