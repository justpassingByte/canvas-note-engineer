---
description: "Launch full-stack systematic debugging & incident investigation on reported issues."
argument-hint: "[error description, failing route, or test name]"
---

**Reported Issue**:
$ARGUMENTS

1. If the issue involves a web page or user interaction:
   - Use `debug_browser_run` to navigate to the route and capture console errors, network 4xx/5xx requests, and a failure screenshot.
2. If backend servers are involved:
   - Use `debug_status` to scan active dev and inspect ports.
   - If any port conflicts exist, call `debug_kill_ports`.
3. Activate the `debugger` subagent and `debug-rca` skill to trace the root cause across the stack.
4. Output a structured RCA report:
   - **Symptoms & Visual Evidence** (console errors, screenshots)
   - **Root Cause & Code Path** (frontend/API correlation)
   - **Proposed Fix** (at the root source)
   - **Verification Results** (clean Playwright run & test pass)
