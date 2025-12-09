#!/usr/bin/env node
// Background version of Pokemon TCG API hashing script
// Runs in background and logs to file

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.resolve(__dirname, '..');
const logFile = path.join(logDir, 'pokemontcg-hashing.log');
const pidFile = path.join(logDir, 'pokemontcg-hashing.pid');

// Check if already running
if (fs.existsSync(pidFile)) {
  const pid = parseInt(fs.readFileSync(pidFile, 'utf8'));
  try {
    process.kill(pid, 0); // Check if process exists
    console.log(`⚠️  Process already running (PID: ${pid})`);
    console.log(`   Log file: ${logFile}`);
    console.log(`   To stop: kill ${pid}`);
    process.exit(1);
  } catch (e) {
    // Process doesn't exist, remove stale PID file
    fs.unlinkSync(pidFile);
  }
}

// Start the script in background
const scriptPath = path.join(__dirname, 'precompute-hashes-pokemontcg-fixed.js');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

console.log(`🚀 Starting Pokemon TCG API hashing in background...`);
console.log(`   Log file: ${logFile}`);
console.log(`   PID file: ${pidFile}`);
console.log(`   To monitor: tail -f ${logFile}`);
console.log(`   To stop: kill \`cat ${pidFile}\``);

const child = spawn('node', [scriptPath], {
  detached: true,
  stdio: ['ignore', 'pipe', 'pipe']
});

// Write PID
fs.writeFileSync(pidFile, child.pid.toString());

// Log output to file
child.stdout.pipe(logStream);
child.stderr.pipe(logStream);

// Also log to console
child.stdout.on('data', (data) => {
  process.stdout.write(data);
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
});

// Handle exit
child.on('exit', (code) => {
  fs.unlinkSync(pidFile);
  logStream.end();
  if (code === 0) {
    console.log(`\n✅ Hashing complete! Check ${logFile} for details.`);
  } else {
    console.log(`\n❌ Hashing failed with code ${code}. Check ${logFile} for details.`);
  }
});

// Detach from parent
child.unref();

console.log(`\n✅ Background process started (PID: ${child.pid})`);
console.log(`   Process will continue running even if you close this terminal.`);

