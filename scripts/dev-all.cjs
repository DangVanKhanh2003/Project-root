#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const appsDir = path.join(__dirname, '..', 'apps');
const BASE_PORT = 3001;

// Auto-detect all apps with vite.config.ts
const apps = fs.readdirSync(appsDir).filter(name => {
  const appPath = path.join(appsDir, name);
  const hasViteConfig = fs.existsSync(path.join(appPath, 'vite.config.ts')) ||
                        fs.existsSync(path.join(appPath, 'vite.config.js'));
  return fs.statSync(appPath).isDirectory() && hasViteConfig;
});

// Sort alphabetically for consistent port assignment
apps.sort();

const sites = apps.map((name, index) => ({
  name,
  port: BASE_PORT + index
}));

console.log('\n🚀 Starting all dev servers...\n');
console.log(`📦 Found ${sites.length} apps\n`);

const processes = [];

sites.forEach(({ name, port }) => {
  const appPath = path.join(appsDir, name);

  const server = spawn('npx', ['vite', '--host', '--port', port.toString()], {
    cwd: appPath,
    shell: true,
    stdio: 'pipe'
  });

  processes.push(server);

  server.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`[${name}] ${output}`);
    }
  });

  server.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output && !output.includes('warn')) {
      console.error(`[${name}] ${output}`);
    }
  });

  server.on('error', (err) => {
    console.error(`[${name}] Error: ${err.message}`);
  });

  console.log(`✅ ${name} → http://localhost:${port}`);
});

console.log('\n📋 All servers starting!\n');
console.log('Press Ctrl+C to stop all servers.\n');

process.on('SIGINT', () => {
  console.log('\n👋 Stopping all servers...');
  processes.forEach(p => p.kill());
  process.exit(0);
});
