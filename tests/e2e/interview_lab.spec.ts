import { test, expect } from '@playwright/test';

test.describe('Dedicated Interview Lab E2E Journey', () => {
  test('should switch into Interview Lab, browse domains, drill cards, and check Gap Map', async ({ page }) => {
    // 1. Visit the app
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');

    // 2. Locate and click the Interview Lab switch button in header/top-right
    const labSwitchBtn = page.locator('.nut-toolbar-interview, button:has-text("Luyện Phỏng Vấn"), button:has-text("Interview Lab")').first();
    await expect(labSwitchBtn).toBeVisible();
    await labSwitchBtn.click();

    // 3. Verify Interview Lab is mounted
    const labHeader = page.locator('.interview-lab-view header');
    await expect(labHeader).toBeVisible();
    await expect(page.locator('text=CHỦ ĐỀ PHỎNG VẤN')).toBeVisible();

    // 4. Verify Cheatsheet Reader tab (default)
    const topicHeading = page.locator('.cheatsheet-reader h1');
    await expect(topicHeading).toBeVisible();
    await expect(page.locator('text=CHUỖI TỪ KHÓA BẬT PHẢN XẠ')).toBeVisible();
    await expect(page.locator('text=5-SECOND RECALL')).toBeVisible();
    await expect(page.locator('text=CÂU TRẢ LỜI MẪU NÓI TRỰC TIẾP')).toBeVisible();

    // Test Layer Switcher: click L1 and L2
    await page.locator('button:has-text("L1 — Junior Recall")').click();
    await expect(page.locator('text=Tầng Junior:')).toBeVisible();

    await page.locator('button:has-text("L3 — Production & Trade-offs")').click();
    await expect(page.locator('text=Tầng Production & Trade-offs:')).toBeVisible();

    // Verify Role Filter Tabs in sidebar
    const cloudTab = page.locator('.domain-sidebar button:has-text("AWS & DevOps")');
    if (await cloudTab.isVisible()) {
      await cloudTab.click();
      await expect(page.locator('text=AWS Cloud & Serverless Ecosystem')).toBeVisible();
      // Switch back to all
      await page.locator('.domain-sidebar button:has-text("Tất Cả")').click();
    }

    // 5. Switch to Flashcard Drill tab
    const drillTabBtn = page.locator('button:has-text("Flashcard & Luyện Phản Xạ")');
    await drillTabBtn.click();

    // Verify Flashcard is visible
    const flashcard = page.locator('.flashcard-drill');
    await expect(flashcard).toBeVisible();
    await expect(page.locator('text=MẶT TRƯỚC: CÂU HỎI PHỎNG VẤN')).toBeVisible();

    // Flip card by clicking on card body
    await page.locator('text=MẶT TRƯỚC: CÂU HỎI PHỎNG VẤN').click();
    await expect(page.locator('text=MẶT SAU: PHẢN XẠ & MENTAL MODEL')).toBeVisible();

    // Rate as Ready (4. Sẵn sàng)
    const readyBtn = page.locator('button:has-text("4. Sẵn sàng")');
    await expect(readyBtn).toBeVisible();
    await readyBtn.click();

    // 6. Switch to Gap Map Dashboard tab
    const gapMapTabBtn = page.locator('button:has-text("Gap Map & 30-Day Routine")');
    await gapMapTabBtn.click();

    // Verify Dashboard metrics & matrix
    await expect(page.locator('text=Personal Gap Map & 30-Day Active Recall Program')).toBeVisible();
    await expect(page.locator('text=INTERVIEW READINESS')).toBeVisible();
    await expect(page.locator('text=CÔNG THỨC 60 PHÚT PHẢN XẠ MỖI NGÀY')).toBeVisible();
    await expect(page.locator('text=MA TRẬN NĂNG LỰC KỸ SƯ THEO DOMAIN')).toBeVisible();

    // 7. Back to System Canvas
    const backBtn = page.locator('.nut-quay-lai-canvas, button[title*="Quay lại Sơ đồ"], button:has-text("Canvas")').first();
    await backBtn.click();

    // Verify we are back on Canvas
    await expect(page.locator('#mat-giay')).toBeVisible();
  });
});
