---
name: git-assistant
description: Git Power Assistant for Conventional Commits generation and intelligent Merge Conflict resolution. Analyzes git diffs, scopes changes, and resolves conflicting markers cleanly.
---

# Git Assistant (Semantic Commits & Conflict Helper)

## 1. Semantic Conventional Commits

When generating commit messages from unstaged/staged changes:
1. Inspect `git status -s` and `git diff --stat`.
2. Inspect `git diff` or `git diff --cached`.
3. Categorize changes using the standard **Conventional Commits** format:
   - `feat(<scope>)`: New user-facing feature or API capability.
   - `fix(<scope>)`: Bug fix or patch.
   - `refactor(<scope>)`: Code refactoring without behavioral changes.
   - `perf(<scope>)`: Performance optimization (memoization, query tuning).
   - `style(<scope>)`: CSS, layout styling, lint formatting.
   - `docs(<scope>)`: Documentation, comments, specs.
   - `test(<scope>)`: Unit tests, integration tests.
   - `chore(<scope>)`: Build scripts, dependencies, configuration.

### Commit Command Example
```powershell
git add <files>
git commit -m "feat(canvas): add zero-pixel auto-anchor bezier edge routing"
```

---

## 2. Merge Conflict Helper

When resolving merge conflicts:
1. Identify all conflicted files:
   ```powershell
   git status --short | Select-String "^(UU|AA|UD|DU)"
   ```
2. For each conflicted file, locate conflict blocks:
   ```text
   <<<<<<< HEAD (Current Branch changes)
   ... your code ...
   =======
   ... incoming branch changes ...
   >>>>>>> <incoming-branch>
   ```
3. Analyze the intent of BOTH sides:
   - Preserve both changes if they are complementary.
   - Discard the obsolete implementation if one supersedes the other.
   - Ensure imports, types, and variables are merged cleanly without duplication.
4. Verify by running the linter/compiler (`npm run build` or `npx tsc --noEmit`).
5. Stage the resolved files:
   ```powershell
   git add <resolved-file>
   ```
