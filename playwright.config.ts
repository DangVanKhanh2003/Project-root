import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Playwright E2E Config — Downloader Monorepo (19 sites)
 *
 * Usage:
 *   npm run test:e2e                → Build + test 1 site (onedownloader.net)
 *   npm run test:e2e:all-sites      → Build + test ALL 19 sites song song
 *   npm run test:e2e:debug          → Debug step-by-step
 *   npm run test:e2e:ui             → Interactive UI
 *   TEST_SITE=ssvid.cc npm run test:e2e  → Test specific site
 */

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isCI = !!process.env.CI;
const isHeadless = isCI || !!process.env.HEADLESS;
const SINGLE_SITE = process.env.TEST_SITE || 'onedownloader.net';
const TEST_ALL = !!process.env.TEST_ALL_SITES;

// All app directories with vite config
const APPS_DIR = path.resolve(__dirname, 'apps');
let ALL_SITES: string[] = [];
try {
  ALL_SITES = fs.readdirSync(APPS_DIR).filter(d => {
    try { return fs.statSync(path.join(APPS_DIR, d, 'vite.config.ts')).isFile(); }
    catch { return false; }
  }).sort();
} catch { /* apps dir may not exist in some envs */ }

// Port mapping: each site gets a unique port starting from 4001
const SITE_PORTS: Record<string, number> = {};
ALL_SITES.forEach((site, i) => { SITE_PORTS[site] = 4001 + i; });

// Which sites to test
const sitesToTest = TEST_ALL ? ALL_SITES : [SINGLE_SITE];

// Create a project per site × device (parallel testing)
const projects = sitesToTest.flatMap(site => {
  const port = SITE_PORTS[site] || 4001;
  const baseURL = process.env.TEST_BASE_URL || `http://localhost:${port}`;

  return [
    {
      name: `${site}:desktop`,
      use: {
        ...devices['Desktop Chrome'],
        baseURL,
      },
      metadata: { site, port },
    },
    {
      name: `${site}:mobile`,
      use: {
        ...devices['Pixel 7'],
        baseURL,
      },
      metadata: { site, port },
    },
  ];
});

// Preview servers: Playwright auto-starts vite preview for each site
const webServers = sitesToTest.map(site => {
  const port = SITE_PORTS[site] || 4001;
  const appDir = path.join(APPS_DIR, site);
  return {
    command: `npx vite preview --port ${port}`,
    cwd: appDir,
    port,
    reuseExistingServer: true,
    timeout: 30_000,
  };
});

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // All sites × devices run simultaneously
  // TEST_ALL_SITES: 19 sites × 2 devices = 38 projects, all parallel
  // Single site: 1 site × 2 devices = 2 projects
  workers: isCI ? 4 : (TEST_ALL ? sitesToTest.length * 2 : 4),
  timeout: 60_000,

  reporter: [
    ['html', { outputFolder: 'tests/test-results/html-report', open: 'never' }],
    ['json', { outputFile: 'tests/test-results/results.json' }],
    ['list'],
  ],

  outputDir: 'tests/test-results/artifacts',

  use: {
    headless: isHeadless,
    launchOptions: {
      slowMo: isHeadless ? 0 : 400,
    },
    video: 'on',
    screenshot: 'on',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects,

  // Auto-start preview servers (requires apps already built)
  webServer: process.env.TEST_BASE_URL ? undefined : webServers,
});
