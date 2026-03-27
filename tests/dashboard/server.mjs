/**
 * Test Dashboard Server
 *
 * Node.js server that:
 * 1. Serves the dashboard HTML at http://localhost:3333
 * 2. Runs tests (vitest / playwright) as child processes
 * 3. Streams real-time output to dashboard via WebSocket
 *
 * Usage:
 *   npm run test:dashboard    → Opens http://localhost:3333
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';
import { WebSocketServer } from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3333;
const ROOT = path.resolve(__dirname, '../..');
const APPS_DIR = path.join(ROOT, 'apps');

/** Get all site directories that have vite.config.ts (buildable sites) */
function getAllSites() {
  try {
    return fs.readdirSync(APPS_DIR).filter(d => {
      try { return fs.statSync(path.join(APPS_DIR, d, 'vite.config.ts')).isFile(); }
      catch { return false; }
    }).sort();
  } catch { return []; }
}

// ==========================================
// HTTP Server (serves dashboard HTML)
// ==========================================
// Site preview processes: { siteName: { proc, port } }
const previewProcs = new Map();

/** Start vite preview for a site, return port */
function startPreview(site) {
  if (previewProcs.has(site)) return previewProcs.get(site).port;
  const sites = getAllSites();
  const idx = sites.indexOf(site);
  const port = 4001 + (idx >= 0 ? idx : previewProcs.size);
  const appDir = path.join(APPS_DIR, site);

  // Check if dist exists (site must be built first)
  const distDir = path.join(appDir, 'dist');
  if (!fs.existsSync(distDir)) {
    console.log(`[Preview] ${site}: no dist/ folder, skipping preview`);
    return null;
  }

  const proc = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
    cwd: appDir, shell: true, stdio: 'pipe',
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  proc.stdout.on('data', d => {
    const t = d.toString();
    if (t.includes('Local:')) console.log(`[Preview] ${site} → :${port}`);
  });
  proc.stderr.on('data', () => {});
  proc.on('close', () => { previewProcs.delete(site); });
  previewProcs.set(site, { proc, port });
  return port;
}

/** Start previews for all built sites */
function startAllPreviews() {
  const sites = getAllSites();
  const started = [];
  for (const site of sites) {
    const port = startPreview(site);
    if (port) started.push({ site, port });
  }
  return started;
}

/** Stop all preview servers */
function stopAllPreviews() {
  for (const [site, { proc }] of previewProcs) {
    try { killProcessTree(proc); } catch {}
  }
  previewProcs.clear();
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';

  // ---- Proxy: /site/{name}/path → localhost:{port}/path ----
  const proxyMatch = url.match(/^\/site\/([^/]+)(\/.*)?$/);
  if (proxyMatch) {
    const siteName = proxyMatch[1];
    const sitePath = proxyMatch[2] || '/';
    const entry = previewProcs.get(siteName);
    if (!entry) {
      res.writeHead(502);
      res.end(`Site "${siteName}" not previewing. Build first.`);
      return;
    }
    // Proxy to vite preview
    const proxyReq = http.request({
      hostname: 'localhost', port: entry.port, path: sitePath,
      method: req.method, headers: { ...req.headers, host: `localhost:${entry.port}` },
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', () => {
      res.writeHead(502);
      res.end(`Cannot connect to ${siteName} on port ${entry.port}`);
    });
    req.pipe(proxyReq);
    return;
  }

  // ---- API: /api/sites → list sites + ports ----
  if (url === '/api/sites') {
    const sites = getAllSites();
    const data = sites.map((s, i) => ({
      name: s, port: 4001 + i,
      previewing: previewProcs.has(s),
      built: fs.existsSync(path.join(APPS_DIR, s, 'dist')),
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  // ---- API: /api/start-previews → start all previews ----
  if (url === '/api/start-previews') {
    const started = startAllPreviews();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(started));
    return;
  }

  // ---- Static files ----
  let filePath;
  if (url === '/' || url === '/index.html') {
    filePath = path.join(__dirname, 'index.html');
  } else if (url.startsWith('/test-results/')) {
    filePath = path.join(ROOT, 'tests', url);
  } else {
    filePath = path.join(__dirname, url);
  }

  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
  };

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
    res.end(data);
  });
});

// ==========================================
// WebSocket Server (streams test output)
// ==========================================
let wss;
try {
  wss = new WebSocketServer({ server });
} catch (e) {
  // ws package not installed, fallback to polling mode
  console.log('[Dashboard] ws package not found. Install with: npm i -D ws');
  console.log('[Dashboard] Dashboard will work in polling mode (no live streaming)');
  wss = null;
}

function broadcast(data) {
  if (!wss) return;
  const msg = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === 1) { // OPEN
      client.send(msg);
    }
  }
}

// ==========================================
// Process Management - kill entire process tree
// ==========================================
let activeProcess = null;
let activeProcessPid = null;
let isStopping = false;

/**
 * Kill process + ALL child processes (vitest workers, playwright browsers, etc.)
 * On Windows: taskkill /T /F /PID kills entire tree
 * On Unix: kill negative PID kills process group
 */
function killProcessTree(proc) {
  if (!proc || !proc.pid) return;
  const pid = proc.pid;
  console.log(`[Dashboard] Killing process tree PID=${pid}...`);

  try {
    if (process.platform === 'win32') {
      // Windows: taskkill with /T (tree) and /F (force)
      // This kills the process AND all child processes (vitest workers, browsers, etc.)
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      // Unix: kill the process group (negative PID)
      process.kill(-pid, 'SIGKILL');
    }
  } catch (e) {
    // Process may already be dead, try regular kill
    try { proc.kill('SIGKILL'); } catch {}
  }
  console.log(`[Dashboard] Process tree PID=${pid} killed.`);
}

function runCommand(type, command, args, cwd = ROOT, extraEnv = {}) {
  // Kill previous process tree if still running
  if (activeProcess) {
    killProcessTree(activeProcess);
    activeProcess = null;
    activeProcessPid = null;
  }

  isStopping = false;
  broadcast({ type: 'start', testType: type, timestamp: Date.now() });

  const proc = spawn(command, args, {
    cwd,
    shell: true,
    // detached on Unix allows killing the entire process group
    detached: process.platform !== 'win32',
    env: { ...process.env, FORCE_COLOR: '0', ...extraEnv },
  });

  activeProcess = proc;
  activeProcessPid = proc.pid;
  console.log(`[Dashboard] Started "${type}" test (PID=${proc.pid})`);

  proc.stdout.on('data', (data) => {
    const text = data.toString();
    console.log(text);
    broadcast({ type: 'stdout', text, timestamp: Date.now() });
    parseTestOutput(text);
  });

  proc.stderr.on('data', (data) => {
    const text = data.toString();
    console.error(text);
    broadcast({ type: 'stderr', text, timestamp: Date.now() });
  });

  proc.on('close', (code, signal) => {
    const wasStopped = isStopping;
    activeProcess = null;
    activeProcessPid = null;
    isStopping = false;

    if (wasStopped) {
      console.log(`[Dashboard] Test stopped by user.`);
      broadcast({ type: 'stopped', timestamp: Date.now() });
    } else {
      console.log(`[Dashboard] Test finished (code=${code}, signal=${signal})`);
      broadcast({ type: 'done', code, testType: type, timestamp: Date.now() });

      // After vitest finishes, try to send JSON results
      if (type === 'unit' || type === 'stress' || type === 'all-unit' || type === 'full') {
        tryLoadVitestResults();
      }
      if (type === 'e2e' || type === 'full') {
        tryLoadPlaywrightResults();
      }
    }
  });

  proc.on('error', (err) => {
    console.error(`[Dashboard] Process error:`, err.message);
    broadcast({ type: 'stderr', text: `Process error: ${err.message}`, timestamp: Date.now() });
  });
}

/**
 * Stop all running tests - kills process tree including:
 * - vitest and its worker threads
 * - playwright and spawned browser processes (Chrome, etc.)
 * - Any child shell processes
 */
function stopAllTests() {
  isStopping = true;
  const procs = [...allActiveProcs];
  if (activeProcess) procs.push(activeProcess);
  const total = procs.length;
  console.log(`[Dashboard] Stopping ${total} processes...`);
  broadcast({ type: 'stopping', timestamp: Date.now() });

  // Kill everything immediately
  for (const proc of procs) {
    try { killProcessTree(proc); } catch {}
  }

  // Also try to kill by taskkill all node/npm child processes spawned by us
  if (process.platform === 'win32') {
    try {
      // Kill all npm.cmd and vite and playwright processes that are children
      for (const proc of procs) {
        if (proc.pid) {
          try { execSync(`taskkill /PID ${proc.pid} /T /F`, { stdio: 'ignore', timeout: 5000 }); } catch {}
        }
      }
    } catch {}
  }

  // Clear state immediately
  allActiveProcs.clear();
  activeProcess = null;
  activeProcessPid = null;

  // Send stopped RIGHT NOW — don't wait
  isStopping = false;
  broadcast({ type: 'stopped', timestamp: Date.now() });
  console.log(`[Dashboard] All processes killed. Stopped.`);
}

function parseTestOutput(text) {
  // Parse vitest output lines like "✓ tests/http/polling.test.ts (13 tests) 31ms"
  const vitestMatch = text.match(/[✓✗]\s+(.+?)\s+\((\d+)\s+tests?\)\s+(\d+)ms/);
  if (vitestMatch) {
    broadcast({
      type: 'suite-result',
      name: vitestMatch[1],
      tests: parseInt(vitestMatch[2]),
      duration: parseInt(vitestMatch[3]),
      passed: text.includes('✓'),
    });
  }

  // Parse vitest summary "Tests  653 passed (653)"
  const summaryMatch = text.match(/Tests\s+(\d+)\s+passed/);
  if (summaryMatch) {
    broadcast({ type: 'summary', passed: parseInt(summaryMatch[1]) });
  }

  // Parse failures
  const failMatch = text.match(/(\d+)\s+failed/);
  if (failMatch) {
    broadcast({ type: 'summary-fail', failed: parseInt(failMatch[1]) });
  }
}

function tryLoadVitestResults() {
  const jsonPath = path.join(ROOT, 'tests', 'test-results', 'vitest-results.json');
  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    broadcast({ type: 'vitest-json', data });
  } catch { /* not available */ }
}

function tryLoadPlaywrightResults() {
  const jsonPath = path.join(ROOT, 'tests', 'test-results', 'results.json');
  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    broadcast({ type: 'playwright-json', data });
  } catch { /* not available */ }
}

// Handle WebSocket messages (run commands from dashboard)
if (wss) {
  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        handleDashboardCommand(msg);
      } catch { /* ignore */ }
    });

    // Send current state + site list on connect
    const sites = getAllSites();
    ws.send(JSON.stringify({
      type: 'connected',
      running: !!activeProcess,
      sites,
      sitePorts: Object.fromEntries(sites.map((s, i) => [s, 4001 + i])),
    }));
  });
}

/**
 * Run a pipeline of steps. Steps can be:
 * - Sequential step: { label, cmd, args, cwd, env }
 * - Parallel group:  { parallel: true, label, tasks: [{ label, cmd, args, cwd }] }
 *
 * Parallel groups run ALL tasks simultaneously, wait for all to finish,
 * then continue to next step.
 */
const allActiveProcs = new Set();

function runSteps(type, steps) {
  if (activeProcess) { killProcessTree(activeProcess); activeProcess = null; activeProcessPid = null; }
  for (const p of allActiveProcs) { try { killProcessTree(p); } catch {} }
  allActiveProcs.clear();
  isStopping = false;
  broadcast({ type: 'start', testType: type, timestamp: Date.now() });

  let stepIndex = 0;

  function nextStep() {
    if (isStopping) { broadcast({ type: 'stopped', timestamp: Date.now() }); return; }
    if (stepIndex >= steps.length) {
      broadcast({ type: 'done', code: 0, testType: type, timestamp: Date.now() });
      if (type.includes('unit') || type === 'full') tryLoadVitestResults();
      if (type.includes('e2e') || type === 'full') tryLoadPlaywrightResults();
      return;
    }

    const step = steps[stepIndex++];

    // ---- Parallel group: run all tasks simultaneously ----
    if (step.parallel) {
      const tasks = step.tasks || [];
      const label = step.label || `Parallel: ${tasks.length} tasks`;
      console.log(`\n[Dashboard] ${label}`);
      broadcast({ type: 'stdout', text: `\n=== ${label} ===\n`, timestamp: Date.now() });

      let completed = 0;
      let hasError = false;

      tasks.forEach((task, i) => {
        const taskLabel = task.label || `Task ${i + 1}`;
        broadcast({ type: 'stdout', text: `  Starting: ${taskLabel}\n`, timestamp: Date.now() });

        const proc = spawn(task.cmd, task.args, {
          cwd: task.cwd || ROOT,
          shell: true,
          detached: process.platform !== 'win32',
          env: { ...process.env, FORCE_COLOR: '0', ...(task.env || {}) },
        });

        allActiveProcs.add(proc);

        proc.stdout.on('data', d => {
          const t = d.toString();
          broadcast({ type: 'task-stdout', task: taskLabel, text: t, timestamp: Date.now() });
          broadcast({ type: 'stdout', text: `[${taskLabel}] ${t}`, timestamp: Date.now() });
        });
        proc.stderr.on('data', d => {
          const t = d.toString();
          broadcast({ type: 'task-stderr', task: taskLabel, text: t, timestamp: Date.now() });
          broadcast({ type: 'stderr', text: `[${taskLabel}] ${t}`, timestamp: Date.now() });
        });
        proc.on('close', code => {
          allActiveProcs.delete(proc);
          completed++;
          const status = code === 0 ? 'OK' : `FAILED (${code})`;
          broadcast({ type: 'task-done', task: taskLabel, code, done: completed, total: tasks.length, timestamp: Date.now() });
          broadcast({ type: 'stdout', text: `  Done: ${taskLabel} → ${status} [${completed}/${tasks.length}]\n`, timestamp: Date.now() });
          console.log(`[Dashboard] ${taskLabel} → ${status} [${completed}/${tasks.length}]`);

          if (code !== 0) hasError = true;

          if (completed === tasks.length) {
            if (isStopping) { broadcast({ type: 'stopped', timestamp: Date.now() }); return; }
            if (hasError && !step.ignoreError) {
              broadcast({ type: 'stdout', text: `\n=== Some parallel tasks failed. Continuing anyway... ===\n`, timestamp: Date.now() });
            }
            nextStep();
          }
        });
        proc.on('error', err => {
          broadcast({ type: 'stderr', text: `[${taskLabel}] Error: ${err.message}`, timestamp: Date.now() });
        });
      });

      return; // Don't call nextStep() here — it's called when all parallel tasks finish
    }

    // ---- Sequential step ----
    const label = step.label || `Step ${stepIndex}`;
    console.log(`\n[Dashboard] ${label}`);
    broadcast({ type: 'stdout', text: `\n=== ${label} ===\n`, timestamp: Date.now() });

    const proc = spawn(step.cmd, step.args, {
      cwd: step.cwd || ROOT,
      shell: true,
      detached: process.platform !== 'win32',
      env: { ...process.env, FORCE_COLOR: '0', ...(step.env || {}) },
    });

    activeProcess = proc;
    activeProcessPid = proc.pid;
    allActiveProcs.add(proc);

    proc.stdout.on('data', d => {
      const t = d.toString(); console.log(t);
      broadcast({ type: 'stdout', text: t, timestamp: Date.now() });
      parseTestOutput(t);
    });
    proc.stderr.on('data', d => {
      const t = d.toString(); console.error(t);
      broadcast({ type: 'stderr', text: t, timestamp: Date.now() });
    });
    proc.on('close', code => {
      activeProcess = null; activeProcessPid = null;
      allActiveProcs.delete(proc);
      if (isStopping) { broadcast({ type: 'stopped', timestamp: Date.now() }); return; }
      if (code !== 0 && !step.ignoreError) {
        console.log(`[Dashboard] Step failed (code=${code}), stopping pipeline.`);
        broadcast({ type: 'stdout', text: `\n=== Step failed (exit ${code}). Pipeline stopped. ===\n`, timestamp: Date.now() });
        broadcast({ type: 'done', code, testType: type, timestamp: Date.now() });
        return;
      }
      nextStep();
    });
    proc.on('error', err => {
      broadcast({ type: 'stderr', text: `Process error: ${err.message}`, timestamp: Date.now() });
    });
  }

  nextStep();
}

function handleDashboardCommand(msg) {
  const CORE = path.join(ROOT, 'packages', 'core');
  const site = msg.site || 'onedownloader.net';
  const appDir = path.join(ROOT, 'apps', site);

  switch (msg.action) {
    // ---- Unit / Stress ----
    case 'run-unit':
      runCommand('unit', 'npx', ['vitest', 'run', '--exclude', '**/*.stress.test.ts'], CORE);
      break;
    case 'run-stress':
      runCommand('stress', 'npx', ['vitest', 'run', 'stress'], CORE);
      break;
    case 'run-all-unit':
      runCommand('all-unit', 'npx', ['vitest', 'run'], CORE);
      break;

    // ---- E2E (build → test) ----
    case 'run-e2e':
      runSteps('e2e', [
        { label: `Building ${site}...`, cmd: 'npm', args: ['run', 'build'], cwd: appDir },
        { label: 'Running E2E tests (opens browser)...', cmd: 'npx', args: ['playwright', 'test'] },
      ]);
      break;
    case 'run-e2e-all-sites':
      runSteps('e2e', [
        // Step 1: Build ALL sites in PARALLEL
        {
          parallel: true,
          label: `Building ALL ${getAllSites().length} sites in parallel...`,
          tasks: getAllSites().map(s => ({
            label: s, cmd: 'npm', args: ['run', 'build'], cwd: path.join(ROOT, 'apps', s),
          })),
          ignoreError: true, // Continue even if some builds fail
        },
        // Step 2: Run E2E on all sites (Playwright parallel workers = sites × 2)
        { label: `Running E2E on ALL ${getAllSites().length} sites (${getAllSites().length * 2} parallel workers)...`, cmd: 'npx', args: ['playwright', 'test'], env: { TEST_ALL_SITES: '1' } },
      ]);
      break;
    case 'run-e2e-smoke':
      runSteps('e2e', [
        { label: `Building ${site}...`, cmd: 'npm', args: ['run', 'build'], cwd: appDir },
        { label: 'Running smoke tests...', cmd: 'npx', args: ['playwright', 'test', 'tests/e2e/smoke'] },
      ]);
      break;
    case 'run-e2e-i18n':
      runSteps('e2e', [
        { label: `Building ${site}...`, cmd: 'npm', args: ['run', 'build'], cwd: appDir },
        { label: 'Running i18n tests...', cmd: 'npx', args: ['playwright', 'test', 'tests/e2e/i18n'] },
      ]);
      break;
    case 'run-e2e-download':
      runSteps('e2e', [
        { label: `Building ${site}...`, cmd: 'npm', args: ['run', 'build'], cwd: appDir },
        { label: 'Running download flow tests...', cmd: 'npx', args: ['playwright', 'test', 'tests/e2e/download-flow'] },
      ]);
      break;

    // ---- Build only ----
    case 'build-site':
      runCommand('build', 'npm', ['run', 'build'], appDir);
      break;
    case 'build-all-sites':
      runSteps('build', [{
        parallel: true,
        label: `Building ALL ${getAllSites().length} sites in parallel...`,
        tasks: getAllSites().map(s => ({
          label: s, cmd: 'npm', args: ['run', 'build'], cwd: path.join(ROOT, 'apps', s),
        })),
        ignoreError: true,
      }]);
      break;

    // ---- Full pipeline ----
    case 'run-full':
      runSteps('full', [
        { label: 'Step 1: Unit + Stress tests...', cmd: 'npx', args: ['vitest', 'run'], cwd: CORE },
        { label: `Step 2: Building ${site}...`, cmd: 'npm', args: ['run', 'build'], cwd: appDir },
        { label: 'Step 3: E2E tests (opens browser)...', cmd: 'npx', args: ['playwright', 'test'] },
      ]);
      break;
    case 'run-full-all':
      runSteps('full', [
        // Step 1: Unit + Stress (sequential, must pass first)
        { label: 'Step 1: Unit + Stress tests...', cmd: 'npx', args: ['vitest', 'run'], cwd: CORE },
        // Step 2: Build ALL sites in PARALLEL
        {
          parallel: true,
          label: `Step 2: Building ALL ${getAllSites().length} sites in parallel...`,
          tasks: getAllSites().map(s => ({
            label: s, cmd: 'npm', args: ['run', 'build'], cwd: path.join(ROOT, 'apps', s),
          })),
          ignoreError: true,
        },
        // Step 3: E2E all sites parallel
        { label: `Step 3: E2E ALL sites (${getAllSites().length * 2} workers)...`, cmd: 'npx', args: ['playwright', 'test'], env: { TEST_ALL_SITES: '1' } },
      ]);
      break;

    // ---- Stop ----
    case 'stop':
      stopAllTests();
      break;
  }
}

// ==========================================
// Graceful shutdown: kill child processes when server stops
// ==========================================
function cleanup() {
  console.log('\n[Dashboard] Shutting down...');
  stopAllPreviews();
  if (activeProcess) {
    console.log(`[Dashboard] Killing active test process (PID=${activeProcessPid})...`);
    killProcessTree(activeProcess);
  }
  for (const proc of allActiveProcs) {
    try { killProcessTree(proc); } catch {}
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);   // Ctrl+C
process.on('SIGTERM', cleanup);  // kill command
process.on('exit', () => {
  // Last resort: if process tree wasn't killed, try again
  if (activeProcess) {
    try { killProcessTree(activeProcess); } catch {}
  }
});

// ==========================================
// Start
// ==========================================
function startServer(port) {
  // Must attach error handler BEFORE listen() to catch EADDRINUSE
  server.removeAllListeners('error');
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[Dashboard] Port ${port} in use, trying ${port + 1}...`);
      server.close();
      startServer(port + 1);
    } else {
      console.error('[Dashboard] Server error:', err.message);
      process.exit(1);
    }
  });

  server.listen(port, () => {
    console.log('');
    console.log('  ┌─────────────────────────────────────────────────────────┐');
    console.log('  │                                                         │');
    console.log('  │   Downloader Monorepo — Test Dashboard                  │');
    console.log(`  │   http://localhost:${port}                                  │`);
    console.log('  │                                                         │');
    console.log('  │   Project: downloader-monorepo (19 sites)               │');
    console.log('  │   Packages: @downloader/core, ui-components, ui-shared  │');
    console.log('  │                                                         │');
    console.log('  │   Tests: Unit (vitest) + Stress + E2E (playwright)      │');
    console.log('  │   Stop All: kills browsers, workers, child processes    │');
    console.log('  │                                                         │');
    console.log('  └─────────────────────────────────────────────────────────┘');
    console.log('');

    const open = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    spawn(open, [`http://localhost:${port}`], { shell: true, stdio: 'ignore' });
  });
}

startServer(PORT);
