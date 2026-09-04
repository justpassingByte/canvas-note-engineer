---
name: ast-search
description: Structural code search and syntax-aware refactoring using ast-grep (sg). Finds AST patterns in TypeScript, JavaScript, CSS, and HTML without regex false positives.
---

# AST-Grep Structural Code Search

`ast-grep` parses source code into an Abstract Syntax Tree (AST), matching patterns by grammar and structure instead of plain characters.

## Command Syntax

Run via `npx`:
```powershell
npx -y --package=@ast-grep/cli ast-grep run --pattern '<PATTERN>' --lang <LANG> [PATH]
```

### Common Metavariables
- `$VAR`: Matches a single AST node (e.g., variable, expression, identifier).
- `$$$`: Matches zero or more nodes (arguments, statements, parameters).

## Practical Use Cases

### 1. Find all calls to a specific React Hook / Function
Find all components invoking `useGraphStore`:
```powershell
npx -y --package=@ast-grep/cli ast-grep run --pattern 'useGraphStore($$$)' --lang tsx src/
```

### 2. Find function declarations with specific signatures
Find functions taking `node` as first argument:
```powershell
npx -y --package=@ast-grep/cli ast-grep run --pattern 'function $NAME($NODE, $$$) { $$$ }' --lang ts src/
```

### 3. Find specific JSX/TSX components and props
Find all `ConceptNode` elements with `isSelected`:
```powershell
npx -y --package=@ast-grep/cli ast-grep run --pattern '<ConceptNode isSelected={$$$} $$$ />' --lang tsx src/
```

### 4. Structural Code Replacement (Refactoring)
Replace old function call pattern with new pattern:
```powershell
npx -y --package=@ast-grep/cli ast-grep run --pattern 'calculatePortCoords($A, $B)' --rewrite 'computePortAnchors($A, $B)' --lang ts src/
```
