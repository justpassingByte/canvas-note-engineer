import { test } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/MSI/.gemini/antigravity-ide/brain/9feb4c66-831e-4ddc-9b28-3cb00ec0c9d6';

test('capture interview lab screenshots', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3001');
  await page.waitForLoadState('networkidle');

  // 1. Switch to Interview Lab
  const labBtn = page.locator('button:has-text("Luyện Phỏng Vấn")');
  await labBtn.click();
  await page.waitForTimeout(500);

  // Capture Cheatsheet Reader
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'preview_cheatsheet_reader.png'), fullPage: false });

  // 2. Switch to Flashcard Drill
  await page.locator('button:has-text("Flashcard & Luyện Phản Xạ")').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'preview_flashcard_drill.png'), fullPage: false });

  // Flip card
  await page.locator('text=MẶT TRƯỚC: CÂU HỎI PHỎNG VẤN').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'preview_flashcard_flipped.png'), fullPage: false });

  // 3. Switch to Gap Map Dashboard
  await page.locator('button:has-text("Gap Map & 30-Day Routine")').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'preview_gap_map_dashboard.png'), fullPage: false });

  // 4. Switch back to Canvas and test Drawer Close button
  await page.locator('button:has-text("Sơ đồ Kiến trúc")').click();
  await page.waitForTimeout(500);

  // Click on a node or the open tab to ensure Drawer is open
  const openTab = page.locator('.the-mo-drawer-noi');
  if (await openTab.isVisible()) {
    await openTab.click();
    await page.waitForTimeout(300);
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'preview_drawer_with_close_button.png'), fullPage: false });

  // Click the prominent Close button in drawer
  const closeBtn = page.locator('button.nut-dong-drawer:visible').first();
  await closeBtn.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'preview_drawer_closed.png'), fullPage: false });
});
