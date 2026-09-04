import { test, expect } from '@playwright/test';

test.describe('Interactive Canvas & Field Notes Drawer E2E Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Reset backend graph state first
    await page.request.post('http://localhost:3001/api/graph/reset');

    await page.goto('http://localhost:5173');
    await page.waitForSelector('#mat-giay');
  });

  test('should render initial seed nodes, SVG bezier connections, and topic clusters', async ({ page }) => {
    // 1. Verify canvas container
    const canvas = page.locator('#mat-giay');
    await expect(canvas).toBeVisible();

    // 2. Verify initial 5 concept nodes rendered
    const nodes = page.locator('.cum-thuc-the');
    await expect(nodes).toHaveCount(5);

    // 3. Verify SVG bezier connections exist
    const svgLayer = page.locator('svg.lop-duong-noi');
    await expect(svgLayer).toBeVisible();
    const paths = page.locator('svg.lop-duong-noi path.duong-noi-day');
    expect(await paths.count()).toBeGreaterThan(0);

    // 4. Verify Topic Clusters are rendered
    const clusters = page.locator('.khung-cum-chu-de');
    expect(await clusters.count()).toBeGreaterThanOrEqual(1);
  });

  test('should open Drawer and display details when a node is clicked', async ({ page }) => {
    // Click on the first node
    const firstNode = page.locator('.cum-thuc-the').first();
    await firstNode.click();

    // Verify Drawer is visible
    const drawer = page.locator('aside.trang-so-ghi-chep');
    await expect(drawer).toBeVisible();

    // Verify header in drawer is visible
    const drawerHeader = drawer.locator('.dau-trang-chi-tiet');
    await expect(drawerHeader).toBeVisible();
  });

  test('should zoom in when toolbar zoom button is clicked', async ({ page }) => {
    const zoomBadge = page.locator('.nhan-phan-tram-zoom');
    await expect(zoomBadge).toContainText('100%');

    const zoomInBtn = page.locator('.nut-zoom-nho[title*="Phóng to"]');
    await zoomInBtn.click();

    await expect(zoomBadge).toContainText('115%');
  });

  test('should toggle Active Recall Mode and mask node titles', async ({ page }) => {
    const recallBtn = page.locator('.nut-thao-tac-noi:has-text("Ôn tập")');
    await recallBtn.click();

    // Verify button indicates ON
    await expect(recallBtn).toContainText('Ôn tập: BẬT');

    // Verify at least one node is masked with [ ? ]
    const maskedText = page.locator('.nhan-tieu-de-khoi:has-text("[ ? ]")');
    expect(await maskedText.count()).toBeGreaterThan(0);

    // Turn off Recall Mode
    await recallBtn.click();
    await expect(recallBtn).not.toContainText('BẬT');
  });

  test('should expand Queue & Cache nodes via toolbar button', async ({ page }) => {
    const nodes = page.locator('.cum-thuc-the');
    await expect(nodes).toHaveCount(5);

    const expandBtn = page.locator('.nut-sinh-node');
    await expandBtn.click();

    // After expansion, node count increases to 7
    await expect(nodes).toHaveCount(7);
  });

  test('should spawn a new concept topic via right-click context menu and open details in Drawer', async ({ page }) => {
    // 1. Initially 5 nodes
    const nodes = page.locator('.cum-thuc-the');
    await expect(nodes).toHaveCount(5);

    // 2. Right click on empty canvas area to open context menu
    const canvas = page.locator('#mat-giay');
    await canvas.dispatchEvent('contextmenu', { clientX: 150, clientY: 450 });

    // 3. Verify context menu appears
    const contextMenu = page.locator('.canvas-context-menu');
    await expect(contextMenu).toBeVisible();

    // 4. Click to spawn Audit Log topic
    const spawnAuditBtn = contextMenu.locator('.nut-spawn-audit');
    await expect(spawnAuditBtn).toBeVisible();
    await spawnAuditBtn.click();

    // 5. Verify node count increased from 5 to 7 (2-node Topic Cluster)
    await expect(nodes).toHaveCount(7);

    // 6. Verify the new node has appeared on canvas
    const auditNode = page.locator('.cum-thuc-the:has-text("Nhật ký Kiểm toán")');
    await expect(auditNode).toBeVisible();

    // 7. Verify the Field Notes Drawer automatically slides open with details of the new topic
    const drawer = page.locator('aside.trang-so-ghi-chep');
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('.tieu-de-chi-tiet')).toContainText('Nhật ký Kiểm toán');
    await expect(drawer.locator('.the-phan-loai-dau')).toContainText('KIỂM TOÁN & TUÂN THỦ');
  });

  test('should cleanly collapse and uncollapse child nodes via Collapse Pill with 1-click', async ({ page }) => {
    // 1. Expand Queue & Cache first
    const expandBtn = page.locator('.nut-sinh-node');
    await expandBtn.click();
    const nodes = page.locator('.cum-thuc-the');
    await expect(nodes).toHaveCount(7);

    // 2. Locate the parent node (Khóa Idempotency Key) Collapse Pill
    const khienNode = page.locator('.cum-thuc-the:has-text("Cơ chế Khóa Idempotency Key")');
    const collapsePill = khienNode.locator('.nut-thu-gon-pill');
    await expect(collapsePill).toBeVisible();
    await expect(collapsePill).toContainText('Thu gọn (3)');

    // 3. Click to collapse child nodes
    await collapsePill.dispatchEvent('click');

    // 4. Verify all 3 descendants are hidden (7 -> 4 nodes)
    await expect(nodes).toHaveCount(4);
    await expect(collapsePill).toContainText('Mở 3 node con');

    // 5. Click again to uncollapse
    await collapsePill.dispatchEvent('click');

    // 6. Verify child nodes are immediately restored (4 -> 7 nodes)
    await expect(nodes).toHaveCount(7);
    await expect(collapsePill).toContainText('Thu gọn (3)');
  });

  test('should support DAG Multi-Parent liveness and prevent duplicate ACID database nodes', async ({ page }) => {
    // 1. Right click on empty canvas area to open context menu
    const canvas = page.locator('#mat-giay');
    await canvas.dispatchEvent('contextmenu', { clientX: 250, clientY: 250 });

    // 2. Spawn Audit Log topic
    const spawnAuditBtn = page.locator('.canvas-context-menu .nut-spawn-audit');
    await spawnAuditBtn.click();

    // 3. Verify exactly 1 ACID database pillar exists (no duplicate DB nodes created)
    const dbNodes = page.locator('.cum-thuc-the:has-text("Bảo chứng ACID & Khóa dòng")');
    await expect(dbNodes).toHaveCount(1);

    // 4. Verify Audit Log is linked to Trụ ACID Database
    const auditNode = page.locator('.cum-thuc-the:has-text("Nhật ký Kiểm toán")');
    await expect(auditNode).toBeVisible();

    // 5. Verify Drawer shows the animated schematic
    await auditNode.dispatchEvent('click');
    const dynamicSchematic = page.locator('aside.trang-so-ghi-chep svg');
    await expect(dynamicSchematic.first()).toBeVisible();
  });

  test('should spawn a complete multi-node cluster via Context Menu alongside single nodes', async ({ page }) => {
    // 1. Right click on empty canvas area
    const canvas = page.locator('#mat-giay');
    await canvas.dispatchEvent('contextmenu', { clientX: 220, clientY: 220 });

    // 2. Click "Sinh Cụm Phân Hệ" -> WAF & Rate Limiting
    const spawnClusterBtn = page.locator('.canvas-context-menu .nut-spawn-cluster-waf');
    await expect(spawnClusterBtn).toBeVisible();
    await spawnClusterBtn.click();

    // 3. Verify both cluster nodes are spawned and visible
    const wafNode = page.locator('.cum-thuc-the:has-text("Lá chắn WAF")');
    const rateLimitNode = page.locator('.cum-thuc-the:has-text("Bộ lọc Rate Limiting")');
    await expect(wafNode).toBeVisible();
    await expect(rateLimitNode).toBeVisible();

    // 4. Verify cluster bounding box is rendered
    const clusterBox = page.locator('.khung-cum-chu-de:has-text("PHÂN HỆ WAF & RATE LIMITING")');
    await expect(clusterBox).toBeVisible();
  });

  test('should automatically enrich technical keywords with underline and tooltips in Drawer (0-token hybrid)', async ({ page }) => {
    // 1. Open Drawer by clicking the Idempotency Key node
    const khienNode = page.locator('.cum-thuc-the:has-text("Cơ chế Khóa Idempotency Key")');
    await khienNode.dispatchEvent('click');

    // 2. Verify drawer is open
    const drawer = page.locator('aside.trang-so-ghi-chep');
    await expect(drawer).toBeVisible();

    // 3. Verify that technical keywords (u[data-tooltip]) exist in drawer
    const tooltipKeywords = drawer.locator('u[data-tooltip]');
    await expect(tooltipKeywords.first()).toBeVisible();

    // 4. Verify that data-tooltip contains a technical definition
    const tooltipText = await tooltipKeywords.first().getAttribute('data-tooltip');
    expect(tooltipText).toBeTruthy();
    expect(tooltipText!.length).toBeGreaterThan(10);
  });

  test('should display architectural layer badges and protocol flows without step numbers or plus button', async ({ page }) => {
    // 1. Verify no node badge contains "BƯỚC" or step numbers
    const stepBadges = page.locator('.nhan-buoc');
    const badgeCount = await stepBadges.count();
    expect(badgeCount).toBeGreaterThanOrEqual(5);

    for (let i = 0; i < badgeCount; i++) {
      const text = await stepBadges.nth(i).innerText();
      expect(text).not.toMatch(/BƯỚC/i);
      expect(text).not.toMatch(/^[\d\.]+\s*(\/\/|:|-)/);
    }

    // 2. Verify specific architectural layer badge exists
    await expect(page.locator('.nhan-buoc:has-text("GATEWAY / INGRESS")')).toBeVisible();
    await expect(page.locator('.nhan-buoc:has-text("SECURITY / IDEMPOTENCY")')).toBeVisible();

    // 3. Verify .nut-mo-rong-pod (+ / ✓) is completely removed to prevent confusion
    const podPlusButtons = page.locator('.nut-mo-rong-pod');
    await expect(podPlusButtons).toHaveCount(0);
  });
});
