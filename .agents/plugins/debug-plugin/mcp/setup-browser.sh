#!/usr/bin/env bash
# One-click browser installer for Debug Agent Pack
set -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "==> Installing Playwright in debug-plugin/mcp..."
npm install playwright --save

echo "==> Downloading Chromium binary for automated debugging..."
npx playwright install chromium

echo "==> Setup complete! Playwright browser automation is ready to use."
