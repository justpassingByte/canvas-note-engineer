---
name: e2e-test-engine
description: End-to-End (E2E) and Real-Database Integration Test Engine. Automatically generates, executes, and self-heals Playwright UI tests, live backend API tests, and real database concurrency/persistence tests without manual prompting.
---

# Fullstack E2E & Real-Database Test Engine

This skill eliminates manual test prompting. When asked to "test this feature", "run integration test with real DB", or "E2E test the canvas", execute the full automated testing pipeline.

---

## 1. Zero-Prompt Playwright E2E Testing (Frontend & Canvas)

### Architecture
- Runs against live development server (`http://localhost:5173`).
- Handles complex Canvas interactions: Zooming, Panning, Node clicks, SVG Bezier path inspection, Drawer transitions.

### Example Autonomous E2E Test Suite (`tests/e2e/canvas_drawer.spec.ts`)
```typescript
import { test, expect } from '@playwright/test';

test.describe('Interactive Knowledge Graph E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('.mat-giay-caro');
  });

  test('should render initial seed nodes and SVG bezier connections', async ({ page }) => {
    // 1. Verify canvas SVG layers
    const svgLayer = page.locator('svg.lop-duong-noi');
    await expect(svgLayer).toBeVisible();

    // 2. Verify initial nodes rendered
    const nodes = page.locator('.the-khai-niem');
    await expect(nodes).toHaveCount(5);

    // 3. Verify at least one connection edge exists
    const paths = page.locator('svg.lop-duong-noi path');
    expect(await paths.count()).toBeGreaterThan(0);
  });

  test('should slide open Drawer when a node is clicked', async ({ page }) => {
    // Click on node-khien-khoa or first node
    const firstNode = page.locator('.the-khai-niem').first();
    await firstNode.click();

    // Verify Drawer slides out and is visible
    const drawer = page.locator('aside.trang-so-ghi-chep');
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('.dau-trang-chi-tiet')).toBeVisible();
  });

  test('should zoom in/out when toolbar buttons are clicked', async ({ page }) => {
    const zoomInBtn = page.locator('.nut-zoom-nho[title*="Phóng to"]');
    const zoomBadge = page.locator('.nhan-phan-tram-zoom');

    await expect(zoomBadge).toContainText('100%');
    await zoomInBtn.click();
    await expect(zoomBadge).toContainText('115%');
  });
});
```

---

## 2. Real-Database Integration Testing (Zero Mocking)

Never mock databases when verifying critical production guarantees (Idempotency, Race Conditions, Unique Constraints). Use real SQLite or PostgreSQL instances.

### Workflow with Real SQLite Test DB:
1. **Isolated Test Fixture**: Create `backend/data/test_knowledge.db` fresh per test run.
2. **Apply Migrations**: Execute schema DDL to create tables and indexes.
3. **Execute Real Concurrency Test**:
   - Fire 2 concurrent withdrawal/expansion requests with identical keys.
   - Verify that exactly 1 succeeds and 1 gets locked/rejected (0 double-writes).
4. **Assert Disk State**: Query DB directly via SQLite to verify exact row counts and values.
5. **Clean Teardown**: Remove temporary test database file.

### Example Real-DB Concurrency Test (`backend/tests/integration/concurrency.test.ts`)
```typescript
import Database from 'better-sqlite3';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';

const TEST_DB_PATH = './backend/data/test_concurrency.db';

describe('Real SQLite Concurrency & Idempotency', () => {
  let db: Database.Database;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    db = new Database(TEST_DB_PATH);
    db.exec(`
      CREATE TABLE IF NOT EXISTS idempotency_keys (
        key TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  });

  it('should enforce unique constraint under duplicate inserts', () => {
    const insert = db.prepare('INSERT INTO idempotency_keys (key, status) VALUES (?, ?)');
    
    // First request succeeds
    expect(() => insert.run('req-12345', 'SUCCESS')).not.toThrow();

    // Duplicate request must fail with SQLITE_CONSTRAINT_PRIMARYKEY
    expect(() => insert.run('req-12345', 'SUCCESS')).toThrow(/UNIQUE constraint failed/);

    // Verify row count is strictly 1
    const count = db.prepare('SELECT count(*) as total FROM idempotency_keys WHERE key = ?').get('req-12345');
    expect(count.total).toBe(1);
  });
});
```

---

## 3. Autonomous Execution & Self-Healing Loop

When triggered:
1. **Detect Test Type**: E2E (Playwright) vs Backend API & Real DB (Vitest/Supertest).
2. **Setup Dependencies**: Verify dev server (`http://localhost:5173` or `3000`) is running. If not, start it in background.
3. **Execute Suite**: Run `npx playwright test` or `npx vitest run`.
4. **If Test Fails**:
   - Read failure log and Playwright trace/screenshot.
   - Identify the root cause (selector changed, DB constraint failure, race condition).
   - Automatically modify the code or test to fix the bug.
   - Re-run tests until 100% green.
