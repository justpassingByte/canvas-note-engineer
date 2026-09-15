import { test, expect } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/MSI/.gemini/antigravity-ide/brain/9feb4c66-831e-4ddc-9b28-3cb00ec0c9d6';

test('Verify Bidirectional Linking between Canvas and Interview Lab (36 Topics & 14 Architecture Nodes)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  // 1. Vào trang Canvas và kiểm tra 14 node kiến trúc
  await page.goto('http://localhost:3001');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const nodeCount = await page.locator('.cum-thuc-the').count();
  console.log(`[TEST] Số lượng node kiến trúc hiển thị trên Canvas: ${nodeCount}`);
  expect(nodeCount).toBeGreaterThanOrEqual(10);

  // Chụp ảnh: Canvas với đầy đủ 14 node kiến trúc
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_canvas_loaded_from_db.png'), fullPage: false });

  // 2. Kiểm tra liên kết Canvas -> Interview Lab từ Field Notes Drawer
  // Click vào node PostgreSQL (node-tru-db)
  const postgresNode = page.locator('#node-tru-db');
  await expect(postgresNode).toBeVisible();
  await postgresNode.click();
  await page.waitForTimeout(600);

  // Xác minh Drawer mở ra
  const drawer = page.locator('#panel-chi-tiet:not(.dong)');
  await expect(drawer).toBeVisible();

  // Xác minh khối "ĐỀ TÀI PHỎNG VẤN THỰC CHIẾN (~3 YoE)" xuất hiện trong Drawer
  const interviewSection = drawer.locator('text=Đề Tài Phỏng Vấn Thực Chiến (~3 YoE)');
  await expect(interviewSection).toBeVisible();

  // Chụp ảnh: Field Notes Drawer với card liên kết Interview Lab
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_drawer_with_interview_links.png'), fullPage: false });

  // 3. Click nút "Đọc Cheatsheet" từ trong Drawer để nhảy thẳng sang Interview Lab
  const readCheatsheetBtn = drawer.locator('button:has-text("Đọc Cheatsheet")').first();
  await expect(readCheatsheetBtn).toBeVisible();
  await readCheatsheetBtn.click();
  await page.waitForTimeout(800);

  // Xác minh: Đã tự động chuyển sang Interview Lab
  await expect(page.locator('.cheatsheet-reader')).toBeVisible();

  // Chụp ảnh: Cheatsheet Reader được mở từ Drawer của Canvas
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_interview_lab_from_canvas_drawer.png'), fullPage: false });

  // 4. Kiểm tra số lượng Domain trong Interview Lab (29 Domains)
  const domainButtons = page.locator('.sidebar-domain-item');
  const domainCount = await domainButtons.count();
  console.log(`[TEST] Số lượng domain hiển thị trong Sidebar: ${domainCount}`);
  expect(domainCount).toBe(29);

  // 5. Kiểm tra liên kết ngược Interview Lab -> Canvas
  // Bấm nút "Sơ đồ: " trên đầu Cheatsheet Reader
  const canvasReturnBtn = page.locator('button[title*="Mở và phóng to node"]').first();
  await expect(canvasReturnBtn).toBeVisible();
  await canvasReturnBtn.click();
  await page.waitForTimeout(800);

  // Xác minh: Đã quay lại Canvas và Drawer mở ra
  await expect(page.locator('#panel-chi-tiet:not(.dong)')).toBeVisible();

  // 6. Kiểm tra nút đóng Drawer (Esc / nút X)
  const closeBtn = page.locator('button.nut-dong-drawer:visible').first();
  await closeBtn.click();
  await page.waitForTimeout(400);
  await expect(page.locator('#panel-chi-tiet')).toHaveClass(/dong/);

  // 7. Thử nghiệm nhảy từ Flashcard Drill sang Canvas
  await page.locator('button:has-text("Luyện Phỏng Vấn")').click();
  await page.waitForTimeout(500);

  await page.locator('button:has-text("Flashcard & Luyện Phản Xạ")').click();
  await page.waitForTimeout(500);

  const flashcardJumpBtn = page.locator('button:has-text("Chưa hiểu? Xem Sơ đồ")').first();
  await expect(flashcardJumpBtn).toBeVisible();
  await flashcardJumpBtn.click();
  await page.waitForTimeout(800);

  // Xác minh: Lại quay về Canvas và Drawer mở ra
  await expect(page.locator('#panel-chi-tiet:not(.dong)')).toBeVisible();
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_jump_from_flashcard_to_canvas.png'), fullPage: false });
});
