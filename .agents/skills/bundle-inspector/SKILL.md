---
name: bundle-inspector
description: Bundle size analyzer and package dependency auditor. Inspects dist assets, identifies heavy chunks, finds outdated packages, and prevents bundle bloat in Vite/Webpack projects.
---

# Bundle & Dependency Inspector

Use this skill when auditing frontend production build size, finding large modules, or checking dependencies.

## 1. Inspect Production Bundle Outputs (`dist/assets`)

After running `npm run build`:
```powershell
Get-ChildItem -Path "dist/assets" -File |
    Select-Object Name, @{Name="Size (KB)"; Expression={[math]::Round($_.Length / 1KB, 2)}} |
    Sort-Object "Size (KB)" -Descending
```

- Flag any individual JS chunk over 500 KB.
- Check if vendor chunks are splitting properly.

## 2. Check for Duplicate or Heavy Dependencies

Check top largest directories in `node_modules`:
```powershell
Get-ChildItem -Path "node_modules" -Directory |
    Select-Object Name, @{
        Name="Size (MB)";
        Expression={[math]::Round((Get-ChildItem $_.FullName -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB, 2)}
    } |
    Sort-Object "Size (MB)" -Descending |
    Select-Object -First 10
```

## 3. Audit Outdated or Vulnerable Packages
```powershell
npm outdated
npm audit
```

## Optimization Checklist
- Ensure tree-shaking is working: use `import { sub } from 'package'` rather than `import * as pkg from 'package'`.
- Verify dynamic imports (`React.lazy()` or `import()`) for heavy modals, drawers, or charting engines.
