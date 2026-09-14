<#
.SYNOPSIS
  Find Polluter: Bisect test files to identify which test creates side effects that cause later tests to fail.
.PARAMETER VictimTest
  The test file that is currently failing when run in full suite.
.PARAMETER TestFiles
  List of test files to bisect against.
#>
param (
    [Parameter(Mandatory=$true)]
    [string]$VictimTest,
    [string]$Runner = "pnpm test"
)

Write-Host "==> Target Victim Test: $VictimTest" -ForegroundColor Cyan
Write-Host "==> Verifying if victim test passes in isolation..." -ForegroundColor Yellow

Invoke-Expression "$Runner $VictimTest"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: The victim test fails on its own! This is an isolated failure, not test pollution." -ForegroundColor Red
    exit 1
}

Write-Host "Victim test PASSES when run alone. Investigating test order pollution..." -ForegroundColor Green
