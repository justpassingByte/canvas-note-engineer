# Full-Stack Frontend & E2E Debugging Protocol

## Overview
Modern web bugs frequently span across the network boundary:
A frontend button clicks -> API call fails with 400/500 -> Frontend component crashes or shows cryptic "Something went wrong".

Using Playwright alongside Node inspect debugging creates a **closed-loop diagnostic system**.

---

## 5-Step Full-Stack Debugging Workflow

### Step 1: Start Backend & Frontend in Debug Mode
Use tool `debug_start_server` to launch both servers with Node inspect flags:
- Backend API (e.g. Express / NestJS on port 4201, inspect 9230)
- Frontend (e.g. Next.js / Vite on port 4200, inspect 9229)

### Step 2: Reproduce with Playwright Scenario Runner
Invoke tool `debug_browser_run`:
```json
{
  "url": "http://localhost:4200/checkout",
  "actions": [
    { "type": "fill", "selector": "input#promo", "value": "INVALID_CODE" },
    { "type": "click", "selector": "button#apply-promo" },
    { "type": "wait", "ms": 1500 }
  ],
  "headless": true
}
```
*(Tip: Set `"headless": false` during thesis defense/demo to show the browser UI in real-time).*

### Step 3: Analyze the Diagnostic Payload
The tool automatically returns:
1. `consoleErrors`:
   - React state errors, undefined property access, unhandled promise rejections.
2. `failedRequests`:
   - Failed endpoint URL (e.g. `POST /api/v1/vouchers/apply`).
   - HTTP status code (e.g. 500 Internal Server Error vs 422 Unprocessable Entity).
   - Response body payload (e.g. `{ "error": "voucher.service is null" }`).
3. `screenshotPath`:
   - Visual snapshot of the UI when the crash or error occurred.

### Step 4: Trace to Backend Root Cause
Armed with the exact failing request:
1. Jump directly to the backend endpoint controller.
2. Cross-reference with backend inspect logs.
3. Fix the contract or validation issue at the source.

### Step 5: Regression Verification
Re-run `debug_browser_run` with the same actions.
Verify:
- `consoleErrors` is empty `[]`.
- `failedRequests` is empty `[]`.
- Status is `COMPLETED`.
