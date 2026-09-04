---
name: http-client
description: Fast HTTP & REST API tester for local/remote endpoints without needing Postman. Supports GET, POST, PUT, DELETE, PATCH, payload inspection, response latency, and headers.
---

# HTTP REST API Client

Use this skill when testing local dev servers (`localhost:3000`, `localhost:5173`) or verifying backend REST endpoints.

## Methods for Testing Endpoints

### 1. PowerShell `Invoke-RestMethod` (Best for JSON APIs)

#### GET Request
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/graph/state" -Method GET
```

#### POST Request with JSON Body
```powershell
$body = @{
    topic = "Reliable Payout System"
    root_problem = "Race Condition in Double Withdrawal"
} | ConvertTo-Json -Depth 5

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/graph/init" `
    -Method POST `
    -Body $body `
    -ContentType "application/json; charset=utf-8"

$response | ConvertTo-Json -Depth 5
```

### 2. `curl.exe` with Detailed Headers & Latency
```powershell
curl.exe -i -s -w "\nHTTP_CODE: %{http_code}\nTIME_TOTAL: %{time_total}s\n" `
    -X POST "http://localhost:3000/api/nodes/expand" `
    -H "Content-Type: application/json" `
    -d '{"target_slug":"node-khien-khoa"}'
```

## Best Practices
- Always check status code (200, 201 vs 400, 404, 500).
- If server returns 500, check the server console or error payload for stacktrace.
- Measure latency (`time_total`) to spot slow queries or unindexed database lookups.
