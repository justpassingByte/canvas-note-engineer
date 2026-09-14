import { test, expect } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/MSI/.gemini/antigravity-ide/brain/9feb4c66-831e-4ddc-9b28-3cb00ec0c9d6';

test('Audit Canvas & Interview Lab across Mobile, Tablet, and Desktop', async ({ browser }) => {
  test.setTimeout(90000);
  const viewports = [
    { name: 'mobile_375', width: 375, height: 812 },
    { name: 'tablet_768', width: 768, height: 1024 },
    { name: 'desktop_1440', width: 1440, height: 900 }
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height }
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);

    // 1. Canvas view screenshot
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `audit_${vp.name}_canvas.png`) });

    // 2. Test drawer: if closed, open it; take screenshot; if mobile, close it
    const openTab = page.locator('.the-mo-drawer-noi');
    if (await openTab.isVisible()) {
      await openTab.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, `audit_${vp.name}_drawer.png`) });

      // Close drawer on mobile so we can see canvas & navigate
      const closeDrawerBtn = page.locator('.nut-dong-drawer').first();
      await expect(closeDrawerBtn).toBeVisible();
      await closeDrawerBtn.click();
      await page.waitForTimeout(300);
    } else {
      // On desktop, drawer is open by default
      await page.screenshot({ path: path.join(ARTIFACT_DIR, `audit_${vp.name}_drawer.png`) });
    }

    // 3. Switch to Interview Lab
    const labBtn = page.locator('button:has-text("Luyện Phỏng Vấn")');
    await expect(labBtn).toBeVisible();
    await labBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `audit_${vp.name}_interview_reader.png`) });

    // If on mobile, test opening and closing Domain sidebar
    if (vp.width <= 768) {
      const openSidebarBtn = page.locator('.nut-mo-sidebar-mobile').first();
      if (await openSidebarBtn.isVisible()) {
        await openSidebarBtn.click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, `audit_${vp.name}_mobile_sidebar.png`) });

        const closeSidebarBtn = page.locator('.nut-dong-sidebar-mobile').first();
        if (await closeSidebarBtn.isVisible()) {
          await closeSidebarBtn.click();
          await page.waitForTimeout(300);
        }
      }
    }

    // 4. Flashcard tab
    const flashcardTab = page.locator('button:has-text("Flashcard")');
    await expect(flashcardTab).toBeVisible();
    await flashcardTab.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `audit_${vp.name}_interview_drill.png`) });

    // 5. Gap map tab
    const gapMapTab = page.locator('button:has-text("Gap Map")');
    await expect(gapMapTab).toBeVisible();
    await gapMapTab.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `audit_${vp.name}_interview_gapmap.png`) });

    await context.close();
  }
});
