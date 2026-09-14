<#
.SYNOPSIS
  One-click browser installer for Debug Agent Pack.
  Installs Playwright and downloads Chromium (~150MB).
#>
Write-Host "==> Installing Playwright in debug-plugin/mcp..." -ForegroundColor Cyan
Set-Location $PSScriptRoot
npm install playwright --save

Write-Host "==> Downloading Chromium binary for automated debugging..." -ForegroundColor Cyan
npx playwright install chromium

Write-Host "==> Setup complete! Playwright browser automation is ready to use." -ForegroundColor Green
