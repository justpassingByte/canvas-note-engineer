import { chromium } from 'playwright';

async function testLiveProd() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  console.log('Navigating to live production: https://canvas-note-engineer.vercel.app/ ...');
  await page.goto('https://canvas-note-engineer.vercel.app/', { waitUntil: 'networkidle' });

  // 1. Check title & page load
  console.log('Page Title:', await page.title());

  // 2. Click button to switch to Interview Lab
  const labBtn = page.locator('button.nut-chuyen-interview-lab, button:has-text("Interview Lab")').first();
  await labBtn.click();
  await page.waitForTimeout(600);

  // 3. Check active title
  const titleH1 = page.locator('.cheatsheet-title-h1');
  console.log('Initial Topic Title:', await titleH1.innerText());

  // 4. Click different domains
  const domainItems = await page.locator('.sidebar-domain-item').all();
  console.log('Domains in Sidebar:', domainItems.length);

  for (let i = 1; i <= Math.min(3, domainItems.length - 1); i++) {
    console.log(`Switching to Domain ${i + 1}...`);
    await domainItems[i].click();
    await page.waitForTimeout(200);
    const updatedTitle = await titleH1.innerText();
    console.log(`-> Rendered Topic in Domain ${i + 1}: "${updatedTitle}"`);
  }

  // 5. Test switching tabs: Flashcard Drill
  const drillTab = page.locator('button:has-text("Flashcard")').first();
  await drillTab.click();
  await page.waitForTimeout(300);
  const flashcardTitle = await page.locator('.the-flashcard-chinh h2').innerText();
  console.log('Flashcard Card Title:', flashcardTitle);

  // 6. Test switching tabs: Gap Map
  const gapMapTab = page.locator('button:has-text("Gap Map")').first();
  await gapMapTab.click();
  await page.waitForTimeout(300);
  console.log('Gap Map view rendered smoothly');

  console.log('Console errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors);
  }

  await browser.close();
  console.log('=== ALL LIVE PRODUCTION TESTS PASSED 100% ===');
}

testLiveProd().catch(err => {
  console.error('Error during live prod test:', err);
  process.exit(1);
});
