/**
 * Critical CSS Generation Script
 *
 * Workflow:
 * 1. Start Vite preview server (serving dist/)
 * 2. Wait for server ready by parsing stdout
 * 3. Use 'critical' library with Puppeteer to extract critical CSS
 * 4. Inline critical CSS into HTML files
 * 5. Shutdown preview server
 *
 * CI/CD Compatible:
 * - Puppeteer configured with --no-sandbox for Docker/container environments
 * - Timeout handling to prevent hanging builds
 * - Proper error handling and cleanup
 */

import { spawn } from 'child_process';
import { generate } from 'critical';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PREVIEW_TIMEOUT = 30000; // 30s
const DIST_PATH = resolve(__dirname, '../dist');
let BASE_URL = ''; // Will be detected from preview server output

// Pages to process
const PAGES = [
  { uri: '', template: 'index' },
  { uri: 'youtube-downloader.html', template: 'youtube-downloader' },
  { uri: 'tiktok-downloader.html', template: 'tiktok-downloader' },
  { uri: 'facebook-downloader.html', template: 'facebook-downloader' },
  { uri: 'instagram-downloader.html', template: 'instagram-downloader' },
  { uri: 'x-downloader.html', template: 'x-downloader' },
  { uri: 'youtube-to-mp3.html', template: 'youtube-to-mp3' },
  { uri: 'youtube-to-mp4.html', template: 'youtube-to-mp4' },
  { uri: 'youtube-short-downloader.html', template: 'youtube-short-downloader' },
];

/**
 * Start Vite preview server and detect URL from output
 * Returns process immediately after detecting URL (doesn't wait for actual binding)
 */
function startPreviewServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting Vite preview server...');

    // Use npx vite preview directly for better process control
    const previewProcess = spawn('npx', ['vite', 'preview'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      // Removed shell: true for better process handling
    });

    let urlDetected = false;
    const timeout = setTimeout(() => {
      if (!urlDetected) {
        previewProcess.kill();
        reject(new Error('❌ Preview server startup timeout - URL not detected (30s)'));
      }
    }, PREVIEW_TIMEOUT);

    // Parse stdout to detect the URL (but don't trust it's ready yet!)
    previewProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);

      // Look for the local URL in output (Vite prints: "http://localhost:PORT/")
      if (!urlDetected) {
        const urlMatch = output.match(/http:\/\/(localhost|127\.0\.0\.1):(\d+)/);
        if (urlMatch) {
          const port = urlMatch[2];
          BASE_URL = `http://127.0.0.1:${port}`;

          clearTimeout(timeout);
          urlDetected = true;
          console.log(`📍 Preview server URL detected: ${BASE_URL}`);
          console.log(`   ⚠️  Note: Server may not be fully ready yet, will verify with health check...`);

          // Resolve with process, but server might not be ready yet!
          // Health check will verify actual readiness
          resolve(previewProcess);
        }
      }
    });

    previewProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    previewProcess.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    previewProcess.on('exit', (code) => {
      clearTimeout(timeout);
      if (!serverReady && code !== 0) {
        reject(new Error(`Preview server exited with code ${code}`));
      }
    });
  });
}

/**
 * Generate critical CSS for a single page
 */
async function generateCriticalForPage(page) {
  const url = `${BASE_URL}/${page.uri}`;
  const target = resolve(DIST_PATH, page.uri || 'index.html');

  console.log(`\n📄 Processing: ${page.template} (${url})`);

  try {
    await generate({
      // Source
      src: url,
      target: target,

      // Critical CSS options
      inline: true,        // Inline critical CSS into HTML
      extract: true,       // Also save to separate file for debugging

      // Mobile-first dimensions (critical for accurate extraction)
      dimensions: [
        { width: 375, height: 667 },   // Mobile - iPhone SE
        { width: 1920, height: 1080 }, // Desktop - Full HD
      ],

      // Penthouse (Puppeteer) configuration - CI/CD optimized
      penthouse: {
        timeout: 90000,              // 90s timeout for complex pages
        blockJSRequests: false,      // Allow JS (for dynamic content)
        renderWaitTime: 1000,        // Wait 1s for animations/lazy-load

        // Critical for CI/CD: Puppeteer launch args
        puppeteer: {
          args: [
            '--no-sandbox',                   // Required for Docker/container
            '--disable-setuid-sandbox',       // Required for Docker/container
            '--disable-gpu',                  // Not needed for server
            '--disable-dev-shm-usage',        // Prevent /dev/shm crashes in Docker
            '--disable-web-security',         // Allow cross-origin requests
            '--disable-features=VizDisplayCompositor',
            '--disable-extensions',
            '--disable-background-networking',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-breakpad',
            '--disable-client-side-phishing-detection',
            '--disable-component-extensions-with-background-pages',
            '--disable-default-apps',
            '--disable-hang-monitor',
            '--disable-ipc-flooding-protection',
            '--disable-popup-blocking',
            '--disable-prompt-on-repost',
            '--disable-renderer-backgrounding',
            '--disable-sync',
            '--disable-translate',
            '--metrics-recording-only',
            '--no-first-run',
            '--safebrowsing-disable-auto-update',
            '--enable-automation',
            '--password-store=basic',
            '--use-mock-keychain',
          ],
        },
      },

      // Ignore non-critical styles
      ignore: {
        atrule: ['@font-face'],  // Keep font-face (critical for typography)
        rule: [
          /\:hover/,            // Ignore hover states
          /\:focus/,            // Ignore focus states
          /\:active/,           // Ignore active states
        ],
        decl: (node) => {
          // Ignore animations and transitions (not critical for initial render)
          if (node.prop && node.prop.startsWith('animation')) return true;
          if (node.prop && node.prop.startsWith('transition')) return true;
          return false;
        },
      },
    });

    console.log(`✅ Critical CSS generated for ${page.template}`);
  } catch (err) {
    console.error(`❌ Failed to generate critical CSS for ${page.template}:`, err.message);
    throw err;
  }
}

/**
 * Wait for server to be fully ready by making test requests
 * Uses http.get instead of fetch for better Node.js compatibility
 */
async function waitForServerReady(maxAttempts = 20, delayMs = 1000) {
  console.log(`⏳ Waiting for server to actually bind and accept connections...`);
  console.log(`   Target: ${BASE_URL}`);

  // Initial delay to give server time to bind after logging "ready"
  console.log('   Initial wait: 3s for server to bind...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  const url = new URL(BASE_URL);

  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get({
          hostname: url.hostname,
          port: url.port,
          path: '/',
          timeout: 3000,
        }, (res) => {
          if (res.statusCode === 200) {
            console.log(`✅ Server is ready and responding! (status ${res.statusCode}, attempt ${i + 1})`);
            resolve(true);
          } else {
            reject(new Error(`Got status ${res.statusCode}`));
          }
        });

        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });

      // Server is ready! Wait a bit more to ensure full stability
      console.log('   Waiting extra 2s for server stability...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;

    } catch (err) {
      console.log(`  Attempt ${i + 1}/${maxAttempts} - ${err.message}, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(`Server failed to become ready after ${maxAttempts} attempts (${maxAttempts * delayMs / 1000}s)`);
}

/**
 * Main execution
 */
async function main() {
  let previewProcess = null;

  try {
    // Step 1: Start preview server
    previewProcess = await startPreviewServer();

    // Debug: Verify BASE_URL was set correctly
    if (!BASE_URL) {
      throw new Error('BASE_URL was not set by preview server!');
    }
    console.log(`🔍 BASE_URL detected: ${BASE_URL}`);

    // Step 2: Wait for server to fully ready (health check)
    await waitForServerReady();

    // Step 3: Generate critical CSS for all pages
    console.log('\n🎨 Generating critical CSS for all pages...\n');

    for (const page of PAGES) {
      await generateCriticalForPage(page);
    }

    console.log('\n✅ All critical CSS generated successfully!');

  } catch (err) {
    console.error('\n❌ Critical CSS generation failed:', err);
    process.exit(1);

  } finally {
    // Step 4: Cleanup - kill preview server
    if (previewProcess) {
      console.log('\n🛑 Shutting down preview server...');
      previewProcess.kill('SIGTERM');

      // Force kill if not terminated after 5s
      setTimeout(() => {
        if (previewProcess && !previewProcess.killed) {
          previewProcess.kill('SIGKILL');
        }
      }, 5000);
    }
  }
}

// Run
main();
