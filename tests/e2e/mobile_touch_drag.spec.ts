import { test, expect } from '@playwright/test';

test.describe('Mobile Touch & Drag Engine', () => {
  test('Mobile canvas pan dragging via single touch', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true
    });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForSelector('#mat-giay', { timeout: 10000 });
    await page.waitForTimeout(600);

    // Lấy vị trí transform ban đầu của .the-gioi-do-thi
    const world = page.locator('.the-gioi-do-thi');
    const initialTransform = await world.getAttribute('style');

    // Chạm và vuốt trên khoảng trống canvas (tọa độ x: 200, y: 700)
    await page.touchscreen.tap(200, 700);
    
    // Thực hiện cử chỉ vuốt ngón tay (Touch Pan)
    const canvas = page.locator('#mat-giay');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      // Dispatch touchstart, touchmove, touchend
      await canvas.dispatchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 600 }]
      });
      await canvas.dispatchEvent('touchmove', {
        touches: [{ clientX: 200, clientY: 450 }]
      });
      await canvas.dispatchEvent('touchend', {
        touches: []
      });

      await page.waitForTimeout(300);
      const newTransform = await world.getAttribute('style');
      console.log('Initial transform:', initialTransform);
      console.log('New transform:', newTransform);
      expect(newTransform).not.toBe(initialTransform);
    }

    await context.close();
  });

  test('Mobile quick tap on node opens drawer without moving node', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true
    });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForSelector('.cum-thuc-the', { timeout: 10000 });
    await page.waitForTimeout(600);

    const firstNode = page.locator('.cum-thuc-the').first();
    const initialStyle = await firstNode.getAttribute('style');

    // Chạm nhanh (Tap < 280ms)
    await firstNode.dispatchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }]
    });
    await page.waitForTimeout(50);
    await firstNode.dispatchEvent('touchend', {
      touches: []
    });

    await page.waitForTimeout(400);

    // Vị trí node không được dịch chuyển
    const afterTapStyle = await firstNode.getAttribute('style');
    // Top và left phải giữ nguyên
    expect(afterTapStyle).toBe(initialStyle);

    // Drawer phải được mở ra
    const drawer = page.locator('.so-tay-drawer');
    await expect(drawer).toBeVisible();

    await context.close();
  });
});
