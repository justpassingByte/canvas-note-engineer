---
name: responsive-tester
description: Automated responsive viewport & visual UI inspection for web applications. Captures screenshots across Mobile (375px), Tablet (768px), and Desktop (1440px), detects overflow, and verifies touch targets.
---

# Responsive & Visual UI Tester

Use this skill to audit responsive layouts, detect horizontal scroll bugs, inspect floating toolbars, drawers, and verify UI integrity across devices.

## 1. Standard Viewport Matrix

| Device Type | Width x Height | Focus Areas |
| :--- | :--- | :--- |
| **📱 Mobile (Portrait)** | `375 x 812` | Drawer becomes full-width (100vw), toolbar fits without clipping, touch targets >= 40px |
| **📱 Tablet (Portrait)** | `768 x 1024` | Sidebar/Drawer takes ~50% width, canvas remains pannable |
| **💻 Desktop (Standard)** | `1440 x 900` | Drawer is fixed panel (420-480px), floating toolbar centered |
| **🖥️ Wide Desktop** | `1920 x 1080` | Canvas scaling, high-DPI crispness |

## 2. Automated Multi-Viewport Screenshot Workflow

Using Node and Playwright to generate side-by-side screenshots:

```javascript
import { chromium } from "playwright";

const viewports = [
  { name: "mobile_375", width: 375, height: 812 },
  { name: "tablet_768", width: 768, height: 1024 },
  { name: "desktop_1440", width: 1440, height: 900 },
];

(async () => {
  const browser = await chromium.launch();
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
    await page.screenshot({ path: `screenshots/${vp.name}.png`, fullPage: false });
    console.log(`Captured: screenshots/${vp.name}.png`);
    await context.close();
  }
  await browser.close();
})();
```

## 3. Responsive Checklist for Canvas & Graph Apps
- **Floating Toolbar**: On mobile (<= 640px), hide non-essential labels, show only compact icons.
- **Drawer**: On mobile, use `width: 100vw; max-width: 100vw;` with safe-area padding for bottom bar. On desktop, keep `width: 480px`.
- **Canvas Zoom/Pan**: Prevent default browser pinch-to-zoom on mobile (`touch-action: none;`) so graph panning takes precedence.
- **Text Readability**: Card titles should wrap or truncate gracefully without pushing anchor ports off-screen.
