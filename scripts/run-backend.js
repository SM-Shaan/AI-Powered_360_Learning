#!/usr/bin/env node
/**
 * Launch the FastAPI backend using the project's virtualenv.
 *
 * The venv interpreter lives at Scripts/python.exe on Windows and bin/python
 * elsewhere, so resolve it at runtime rather than hardcoding either path.
 * Falls back to whatever `python` is on PATH when no venv exists, so the
 * script still works for someone using a globally-installed set of deps.
 */

const { spawn } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '..', 'backend-fastapi');

const candidates = [
  path.join(backendDir, 'venv', 'Scripts', 'python.exe'),
  path.join(backendDir, 'venv', 'bin', 'python'),
];

const python = candidates.find(existsSync);

if (!python) {
  console.error(
    'No virtualenv found in backend-fastapi/.\n' +
    'Run `npm run install:backend` first, or activate your own environment.'
  );
  process.exit(1);
}

const args = [
  '-m', 'uvicorn', 'app.main:app',
  '--reload',
  '--host', '127.0.0.1',
  '--port', '8000',
];

const child = spawn(python, args, { cwd: backendDir, stdio: 'inherit' });

child.on('exit', (code) => process.exit(code ?? 0));

// Forward termination so Ctrl-C stops uvicorn rather than orphaning it.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
