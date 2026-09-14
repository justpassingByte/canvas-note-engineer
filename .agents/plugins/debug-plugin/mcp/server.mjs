#!/usr/bin/env node
import { createInterface } from 'node:readline';
import { exec, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import process from 'node:process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { exportRagReport, exportOvernightSweepReport } from './rag-exporter.mjs';
import { runCdpInspection } from './cdp-client.mjs';

const execAsync = promisify(exec);
const isWindows = os.platform() === 'win32';
/**
 * Safely truncate large command outputs to prevent LLM context-window exhaustion and token burning
 */
function truncateOutput(str, maxChars = 4000) {
  if (!str) return '';
  const trimmed = str.trim();
  if (trimmed.length <= maxChars) return trimmed;
  const half = Math.floor(maxChars / 2);
  return `${trimmed.slice(0, half)}\n... [truncated ${trimmed.length - maxChars} characters to protect LLM context window] ...\n${trimmed.slice(-half)}`;
}


// Running background processes spawned by this controller
const activeServers = new Map();

// Reusable browser instance & isolated worker contexts for parallel flow execution
let cachedBrowser = null;
const activeContexts = new Map();

async function getSharedBrowser(chromium, headless = true) {
  if (!cachedBrowser || !cachedBrowser.isConnected()) {
    cachedBrowser = await chromium.launch({
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return cachedBrowser;
}

// Path to screenshots directory
const screenshotsDir = path.resolve(import.meta.dirname, '..', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

/**
 * Lazy-load Playwright
 */
async function getPlaywrightChromium() {
  try {
    const pw = await import('playwright');
    return pw.chromium;
  } catch (err) {
    // Try local node_modules relative to server.mjs
    const localPwPath = path.resolve(import.meta.dirname, 'node_modules', 'playwright', 'index.mjs');
    if (fs.existsSync(localPwPath)) {
      const pw = await import(localPwPath);
      return pw.chromium;
    }
    throw new Error(`Playwright is not installed in mcp/node_modules. Please run 'setup-browser.ps1' or 'npm install playwright' first.`);
  }
}

/**
 * Find processes listening on given ports
 */
async function findProcessOnPort(port) {
  try {
    if (isWindows) {
      const { stdout } = await execAsync(`netstat -ano -p tcp | findstr :${port}`);
      const lines = stdout.trim().split('\r\n');
      const pids = new Set();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5 && parts[1].endsWith(`:${port}`) && parts[3] === 'LISTENING') {
          const pid = parseInt(parts[4], 10);
          if (!isNaN(pid) && pid > 0) pids.add(pid);
        }
      }
      return Array.from(pids);
    } else {
      const { stdout } = await execAsync(`lsof -ti :${port}`);
      const pids = stdout.trim().split('\n').map(p => parseInt(p, 10)).filter(p => !isNaN(p) && p > 0);
      return Array.from(new Set(pids));
    }
  } catch {
    return [];
  }
}

/**
 * Kill process by PID
 */
async function killPid(pid) {
  try {
    if (isWindows) {
      await execAsync(`taskkill /F /T /PID ${pid}`);
    } else {
      await execAsync(`kill -9 ${pid}`);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Tool definitions
 */
const TOOLS = [
  {
    "name": "debug_inspect_cdp",
    "description": "Autonomous Chrome DevTools Protocol (CDP) Client. Connects directly to a running Node.js --inspect session, catches uncaught exceptions, captures live callstack frames, and evaluates heap memory variables in RAM without human F5 intervention.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "inspectPort": { "type": "number", "description": "Node inspect port (default: 9229)" },
        "timeoutMs": { "type": "number", "description": "Inspection timeout in ms (default: 15000)" },
        "pauseOnExceptions": { "type": "string", "enum": ["uncaught", "all", "none"], "description": "Pause mode (default: 'uncaught')" },
        "expressions": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Variables/expressions to evaluate live in RAM on the paused frame (e.g. ['sellerRank', 'order.isNegotiated'])"
        },
        "breakpoints": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "file": { "type": "string" },
              "line": { "type": "number" }
            }
          }
        }
      }
    }
  },
  {
    "name": "debug_export_overnight_report",
    "description": "Export Consolidated Overnight Autonomous SRE Sweep Report across multiple flows into Dual-Mode format: (1) Consolidated Markdown RAG Report (.md) with in-memory RAM heap dump and (2) Multi-Cluster Canvas JSON (.canvas.json) for Canvas Note Engineer.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "sweepId": { "type": "string", "description": "Custom Sweep ID (e.g. SWEEP-20260909)" },
        "date": { "type": "string", "description": "Sweep date (YYYY-MM-DD)" },
        "flows": {
          "type": "array",
          "description": "Array of evaluated flows with test results, CDP in-memory heap evaluations, and defect locations."
        }
      }
    }
  },
  {
    "name": "debug_export_rag_report",
    "description": "Export verified bug findings into Dual-Mode format: (1) Human Markdown Report (.md) and (2) Canvas JSON Payload (.canvas.json) fully compliant with Canvas Note Engineer.",
    "inputSchema": {
      "type": "object",
      "required": [
        "bugId",
        "title",
        "route",
        "rootCause"
      ],
      "properties": {
        "bugId": {
          "type": "string",
          "description": "Unique bug identifier"
        },
        "title": {
          "type": "string",
          "description": "Title of the issue"
        },
        "route": {
          "type": "string",
          "description": "Target URL route"
        },
        "severity": {
          "type": "string",
          "enum": [
            "LOW",
            "MEDIUM",
            "HIGH",
            "CRITICAL"
          ]
        },
        "symptoms": {
          "type": "object",
          "properties": {
            "consoleError": {
              "type": "string"
            },
            "failedRequest": {
              "type": "string"
            },
            "screenshotPath": {
              "type": "string"
            }
          }
        },
        "sourceLocation": {
          "type": "object",
          "properties": {
            "file": {
              "type": "string"
            },
            "function": {
              "type": "string"
            },
            "line": {
              "type": "number"
            }
          }
        },
        "rootCause": {
          "type": "string"
        },
        "regressionTestFile": {
          "type": "string"
        },
        "syncToCanvasDir": {
          "type": "boolean"
        }
      }
    }
  },
  {
    name: 'debug_status',
    description: 'Scan active application and inspect ports, returning status and process IDs (PID).',
    inputSchema: {
      type: 'object',
      properties: {
        ports: {
          type: 'array',
          items: { type: 'number' },
          description: 'Optional list of ports to scan. Default scans: [3000, 4200, 4201, 4203, 5173, 8080, 9229, 9230, 9231]'
        }
      }
    }
  },
  {
    name: 'debug_kill_ports',
    description: 'Force kill processes occupying specified debug/dev ports to resolve EADDRINUSE.',
    inputSchema: {
      type: 'object',
      properties: {
        ports: {
          type: 'array',
          items: { type: 'number' },
          description: 'List of ports to clear. If omitted, clears default inspect ports [9229, 9230, 9231].'
        }
      }
    }
  },
  {
    name: 'debug_start_server',
    description: 'Start a development server with Node inspect mode (--inspect) in background, freeing target inspect port first.',
    inputSchema: {
      type: 'object',
      required: ['command', 'inspectPort'],
      properties: {
        app: { type: 'string', description: 'Identifier name for the app (e.g. "api", "customer", "admin")' },
        command: { type: 'string', description: 'Start command (e.g. "pnpm dev", "npm run dev")' },
        inspectPort: { type: 'number', description: 'Inspect port (e.g. 9229, 9230, 9231)' },
        cwd: { type: 'string', description: 'Working directory path. Defaults to current directory.' }
      }
    }
  },
  {
    name: 'debug_stop_server',
    description: 'Stop a running debug server previously started by debug_start_server or kill by PID.',
    inputSchema: {
      type: 'object',
      properties: {
        app: { type: 'string', description: 'App identifier to stop' },
        pid: { type: 'number', description: 'Process PID to stop' }
      }
    }
  },
  {
    name: 'debug_run_test',
    description: 'Execute a test file or command and capture detailed output, stack traces, and exit code for root cause diagnosis.',
    inputSchema: {
      type: 'object',
      required: ['command'],
      properties: {
        command: { type: 'string', description: 'Test command (e.g. "pnpm test src/user.spec.ts")' },
        cwd: { type: 'string', description: 'Directory to run the command in' },
        timeoutMs: { type: 'number', description: 'Timeout in ms (default: 45000)' }
      }
    }
  },
  {
    name: 'debug_browser_run',
    description: 'Execute an end-to-end browser scenario via Playwright to reproduce bugs, capture console errors, detect failed API network requests (4xx/5xx), and take failure screenshots. Supports Headless (fast) or Headed (visual demonstration).',
    inputSchema: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string', description: 'Target URL to open (e.g. "http://localhost:4200/sign-in")' },
        actions: {
          type: 'array',
          description: 'Sequence of actions to execute in the page.',
          items: {
            type: 'object',
            required: ['type'],
            properties: {
              type: { type: 'string', enum: ['click', 'fill', 'wait', 'press', 'screenshot'] },
              selector: { type: 'string', description: 'CSS/XPath selector for click/fill/wait' },
              value: { type: 'string', description: 'Input text value for fill' },
              key: { type: 'string', description: 'Keyboard key to press (e.g. "Enter")' },
              ms: { type: 'number', description: 'Milliseconds to wait' }
            }
          }
        },
        headless: { type: 'boolean', description: 'Run headless (default: true). Set to false to show the Chromium window during live demos.' },
        timeoutMs: { type: 'number', description: 'Timeout in ms (default: 30000)' }
      }
    }
  }
];

/**
 * Tool execution dispatcher
 */
async function handleToolCall(name, args) {
  switch (name) {
    case 'debug_inspect_cdp': return runCdpInspection(args);
    case 'debug_export_overnight_report': return exportOvernightSweepReport(args, import.meta.dirname);
    case 'debug_export_rag_report': return exportRagReport(args, import.meta.dirname);
    case 'debug_status': {
      const portsToScan = args.ports?.length ? args.ports : [3000, 4200, 4201, 4203, 5173, 8080, 9229, 9230, 9231];
      const results = [];
      for (const p of portsToScan) {
        const pids = await findProcessOnPort(p);
        results.push({
          port: p,
          type: p >= 9220 && p <= 9240 ? 'inspect-port' : 'app-port',
          status: pids.length > 0 ? 'OCCUPIED' : 'FREE',
          pids
        });
      }
      return {
        summary: `Scanned ${results.length} ports. ${results.filter(r => r.status === 'OCCUPIED').length} ports occupied.`,
        ports: results,
        activeTrackedServers: Array.from(activeServers.entries()).map(([k, v]) => ({
          app: k,
          pid: v.pid,
          inspectPort: v.inspectPort
        }))
      };
    }

    case 'debug_kill_ports': {
      const ports = args.ports?.length ? args.ports : [9229, 9230, 9231];
      const killed = [];
      for (const p of ports) {
        const pids = await findProcessOnPort(p);
        for (const pid of pids) {
          const success = await killPid(pid);
          killed.push({ port: p, pid, killed: success });
        }
      }
      return {
        message: killed.length > 0 ? `Killed ${killed.length} process(es).` : 'No processes found on specified ports.',
        actions: killed
      };
    }

    case 'debug_start_server': {
      const app = args.app || `app_${args.inspectPort}`;
      const cwd = args.cwd || process.cwd();
      const inspectPort = args.inspectPort;

      // 1. Free inspect port first
      const existing = await findProcessOnPort(inspectPort);
      for (const pid of existing) {
        await killPid(pid);
      }

      // 2. Set environment with inspect flag
      const env = {
        ...process.env,
        NODE_OPTIONS: `--inspect=0.0.0.0:${inspectPort} ${process.env.NODE_OPTIONS || ''}`.trim()
      };

      // 3. Spawn process
      const child = spawn(args.command, {
        cwd,
        env,
        shell: true,
        detached: !isWindows,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      const logs = [];
      child.stdout?.on('data', (d) => {
        logs.push(d.toString());
        if (logs.length > 30) logs.shift();
      });
      child.stderr?.on('data', (d) => {
        logs.push(d.toString());
        if (logs.length > 30) logs.shift();
      });

      child.on('exit', (code) => {
        activeServers.delete(app);
      });

      activeServers.set(app, {
        pid: child.pid,
        inspectPort,
        command: args.command,
        cwd,
        process: child,
        getRecentLogs: () => logs.join('')
      });

      await new Promise(res => setTimeout(res, 1200));

      return {
        status: 'STARTED',
        app,
        pid: child.pid,
        inspectPort,
        connectUrl: `ws://127.0.0.1:${inspectPort}`,
        vsCodeAttachConfig: {
          name: `Attach to ${app}`,
          type: 'node',
          request: 'attach',
          port: inspectPort,
          restart: true
        },
        message: `Debug server '${app}' launched on PID ${child.pid} with inspect port ${inspectPort}. Open VS Code and press F5 to attach debugger.`
      };
    }

    case 'debug_stop_server': {
      let stopped = false;
      if (args.app && activeServers.has(args.app)) {
        const item = activeServers.get(args.app);
        await killPid(item.pid);
        activeServers.delete(args.app);
        stopped = true;
      }
      if (args.pid) {
        stopped = await killPid(args.pid);
      }
      return {
        success: stopped,
        message: stopped ? 'Process successfully stopped.' : 'No active server found matching criteria.'
      };
    }

    case 'debug_run_test': {
      const timeout = args.timeoutMs || 45000;
      const cwd = args.cwd || process.cwd();
      try {
        const { stdout, stderr } = await execAsync(args.command, {
          cwd,
          timeout,
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer prevents ERR_CHILD_PROCESS_STDIO_MAXBUFFER
        });
        return {
          exitCode: 0,
          status: 'PASSED',
          stdout: truncateOutput(stdout),
          stderr: truncateOutput(stderr)
        };
      } catch (err) {
        return {
          exitCode: err.code || 1,
          status: 'FAILED',
          errorMessage: err.message,
          stdout: truncateOutput(err.stdout),
          stderr: truncateOutput(err.stderr),
          stack: truncateOutput(err.stack, 2000)
        };
      }
    }

    case 'debug_browser_run': {
      const chromium = await getPlaywrightChromium();
      const headless = args.headless !== false; // default true
      const timeout = args.timeoutMs || 30000;
      const actions = args.actions || [];
      const contextId = args.contextId || null;

      const consoleErrors = [];
      const pageErrors = [];
      const failedRequests = [];
      let screenshotPath = null;
      let finalUrl = args.url;
      let actionCount = 0;

      const browser = await getSharedBrowser(chromium, headless);
      let context;
      let shouldCloseContext = false;

      if (contextId && activeContexts.has(contextId)) {
        context = activeContexts.get(contextId);
      } else {
        context = await browser.newContext({
          viewport: { width: 1280, height: 800 }
        });
        if (contextId) {
          activeContexts.set(contextId, context);
        } else {
          shouldCloseContext = true;
        }
      }

      try {
        const page = await context.newPage();

        // Listen for console logs
        page.on('console', (msg) => {
          if (msg.type() === 'error' || msg.type() === 'warning') {
            consoleErrors.push({
              type: msg.type(),
              text: msg.text(),
              location: msg.location()
            });
          }
        });

        // Listen for uncaught JavaScript exceptions
        page.on('pageerror', (err) => {
          pageErrors.push({
            message: err.message,
            stack: err.stack
          });
        });

        // Listen for HTTP failures
        page.on('response', (resp) => {
          const status = resp.status();
          if (status >= 400) {
            failedRequests.push({
              url: resp.url(),
              status,
              statusText: resp.statusText(),
              method: resp.request().method()
            });
          }
        });

        page.on('requestfailed', (req) => {
          failedRequests.push({
            url: req.url(),
            method: req.method(),
            failureText: req.failure()?.errorText || 'Connection failed'
          });
        });

        // 1. Navigate to target URL
        await page.goto(args.url, { waitUntil: 'domcontentloaded', timeout });
        finalUrl = page.url();

        // 2. Run simulation actions
        for (const act of actions) {
          actionCount++;
          if (act.type === 'click' && act.selector) {
            await page.click(act.selector, { timeout: 8000 });
          } else if (act.type === 'fill' && act.selector) {
            await page.fill(act.selector, act.value || '', { timeout: 8000 });
          } else if (act.type === 'wait') {
            if (act.ms) {
              await page.waitForTimeout(act.ms);
            } else if (act.selector) {
              await page.waitForSelector(act.selector, { timeout: 8000 });
            }
          } else if (act.type === 'press' && act.key) {
            await page.keyboard.press(act.key);
          } else if (act.type === 'screenshot') {
            const timestamp = Date.now();
            screenshotPath = path.join(screenshotsDir, `debug_manual_${timestamp}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: false });
          }
        }

        finalUrl = page.url();

        // If there were errors or if explicitly requested, capture error screenshot
        if ((consoleErrors.length > 0 || pageErrors.length > 0 || failedRequests.length > 0) && !screenshotPath) {
          const timestamp = Date.now();
          screenshotPath = path.join(screenshotsDir, `debug_error_${timestamp}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: false });
        }

        const isFailure = consoleErrors.length > 0 || pageErrors.length > 0 || failedRequests.length > 0;

        return {
          status: isFailure ? 'FAILED' : 'COMPLETED',
          targetUrl: args.url,
          finalUrl,
          actionsExecuted: actionCount,
          consoleErrors,
          pageErrors,
          failedRequests,
          screenshotPath: screenshotPath ? path.relative(process.cwd(), screenshotPath) : null,
          summary: isFailure
            ? `Browser scenario encountered: ${consoleErrors.length} console warning/error(s), ${pageErrors.length} page exception(s), ${failedRequests.length} failed HTTP request(s).`
            : `Browser scenario completed successfully across ${actionCount} action(s). 0 console errors, 0 failed HTTP requests.`
        };
      } catch (runErr) {
        // Capture screenshot on crash
        try {
          const timestamp = Date.now();
          screenshotPath = path.join(screenshotsDir, `debug_crash_${timestamp}.png`);
          const pages = browser.contexts()[0]?.pages();
          if (pages && pages.length > 0) {
            await pages[0].screenshot({ path: screenshotPath });
          }
        } catch {
          // ignore screenshot failure during crash
        }

        return {
          status: 'CRASHED',
          targetUrl: args.url,
          finalUrl,
          actionsExecuted: actionCount,
          crashError: runErr.message,
          consoleErrors,
          pageErrors,
          failedRequests,
          screenshotPath: screenshotPath ? path.relative(process.cwd(), screenshotPath) : null,
          summary: `Browser execution crashed: ${runErr.message}`
        };
      } finally {
        if (page && !page.isClosed()) {
          try { await page.close(); } catch {}
        }
        if (shouldCloseContext && context) {
          try { await context.close(); } catch {}
        }
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * JSON-RPC stdio message processor
 */
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function sendResponse(response) {
  process.stdout.write(JSON.stringify(response) + '\n');
}

rl.on('line', async (line) => {
  if (!line.trim()) return;
  try {
    const msg = JSON.parse(line);

    // 1. Initialize
    if (msg.method === 'initialize') {
      sendResponse({
        jsonrpc: '2.0',
        id: msg.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'debug-controller',
            version: '1.1.0'
          }
        }
      });
      return;
    }

    // 2. Initialized notification
    if (msg.method === 'notifications/initialized') {
      return;
    }

    // 3. Ping
    if (msg.method === 'ping') {
      sendResponse({ jsonrpc: '2.0', id: msg.id, result: {} });
      return;
    }

    // 4. Tools list
    if (msg.method === 'tools/list') {
      sendResponse({
        jsonrpc: '2.0',
        id: msg.id,
        result: { tools: TOOLS }
      });
      return;
    }

    // 5. Tools call
    if (msg.method === 'tools/call') {
      try {
        const output = await handleToolCall(msg.params.name, msg.params.arguments || {});
        sendResponse({
          jsonrpc: '2.0',
          id: msg.id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(output, null, 2)
              }
            ],
            isError: false
          }
        });
      } catch (err) {
        sendResponse({
          jsonrpc: '2.0',
          id: msg.id,
          result: {
            content: [
              {
                type: 'text',
                text: `Error executing tool '${msg.params.name}': ${err.message}`
              }
            ],
            isError: true
          }
        });
      }
      return;
    }

    // Unknown method
    if (msg.id !== undefined) {
      sendResponse({
        jsonrpc: '2.0',
        id: msg.id,
        error: { code: -32601, message: `Method '${msg.method}' not implemented` }
      });
    }
  } catch (err) {
    // Malformed JSON
    sendResponse({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: `Parse error: ${err.message}` }
    });
  }
});
