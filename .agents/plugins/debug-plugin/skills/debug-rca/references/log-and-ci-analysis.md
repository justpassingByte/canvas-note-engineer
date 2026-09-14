# Log & CI/CD Analysis

## Structured Log Investigation
1. Look for request correlation IDs (`reqId`, `orderId`, `userId`).
2. Trace events chronologically around the timestamp of the failure.
3. Separate benign warning noise from fatal crash stacks.
4. Verify environmental flags: `NODE_ENV`, `DATABASE_URL`, `REDIS_URL`, CORS origins.
