import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const cwd = fileURLToPath(new URL('../vendor/aionui/', import.meta.url));
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const binary = path.join(cwd, 'bin', process.platform === 'win32' ? 'aioncore.exe' : 'aioncore');
if (!env.AIONUI_BACKEND_BIN && existsSync(binary)) env.AIONUI_BACKEND_BIN = binary;
const child = spawn('bun', ['run', 'start'], { cwd, env, stdio: 'inherit' });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
