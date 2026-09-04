---
description: Custom Slash Command Router for Antigravity developer shortcuts
trigger: always_on
---

# Custom Slash Command Routing

When the user starts a message with any of the following slash commands, immediately execute the corresponding skill without asking for clarification:

- `/test [args]`: Invoke skill `e2e-test-engine` to automatically generate and execute unit/integration/E2E test suites with self-healing.
- `/e2e [args]`: Invoke skill `e2e-test-engine` to launch Playwright, click real UI, and run E2E tests.
- `/port [port]`: Invoke skill `port-manager` to detect and terminate any process occupying the given port (e.g. 5173, 3000).
- `/commit [args]`: Invoke skill `git-assistant` to inspect git diff and generate Conventional Commit messages.
- `/responsive [args]`: Invoke skill `responsive-tester` to audit multi-viewport layout across mobile, tablet, and desktop.
- `/api [args]`: Invoke skill `http-client` to test the specified REST endpoint with latency and JSON payload inspection.
- `/conflict [args]`: Invoke skill `git-assistant` to resolve merge conflicts.
- `/bundle [args]`: Invoke skill `bundle-inspector` to audit dist/assets size and package dependencies.
- `/memory [args]`: Invoke MCP server `memory` to read or store knowledge graph entities.
