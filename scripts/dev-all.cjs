#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const sites = [
  { name: '4k-downloader', port: 3001 },
  { name: '4k-downloader-pink', port: 3002 },
  { name: 'clone_ytmp3_6', port: 3003 },
  { name: 'clone-7', port: 3004 },
  { name: 'yt-downloader', port: 3005 },
];

const appsDir = path.join(__dirname, '..', 'apps');

console.log('\n🚀 Starting all dev servers...\n');

const processes = [];

sites.forEach(({ name, port }) => {
  const appPath = path.join(appsDir, name);

  const server = spawn('npx', ['vite', '--host'], {
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
