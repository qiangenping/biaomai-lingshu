import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const cwd = fileURLToPath(new URL('../vendor/aionui/', import.meta.url));
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
if (!env.AIONUI_BACKEND_BIN) {
  const name = process.platform === 'win32' ? 'aioncore.exe' : 'aioncore';
  const local = path.join(cwd, 'bin', name);
  const bundled = path.join(cwd, 'resources', 'bundled-aioncore', process.platform + '-' + process.arch, name);
  if (!existsSync(local) && !existsSync(bundled)) {
    execFileSync(process.execPath, ['scripts/prepareAioncore.js'], { cwd, env, stdio: 'inherit' });
  }
  env.AIONUI_BACKEND_BIN = existsSync(local) ? local : bundled;
}
const child = spawn('bun', ['run', 'start'], { cwd, env, stdio: 'inherit' });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
