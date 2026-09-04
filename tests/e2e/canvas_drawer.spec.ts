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
});
