import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { mkdtemp } from 'node:fs/promises';
import path from 'node:path';

const requireDesktop = createRequire(new URL('../vendor/aionui/package.json', import.meta.url));
const { _electron: electron } = requireDesktop('playwright');
const profile = await mkdtemp(path.join(tmpdir(), 'opengrowth-smoke-'));
const app = await electron.launch({
  executablePath: process.argv[2],
  args: ['--user-data-dir=' + profile],
  cwd: profile,
  timeout: 90000,
});
try {
  const window = await app.firstWindow({ timeout: 90000 });
  await window.waitForFunction(() => document.querySelector('#root')?.innerText.trim().length > 0,
    null, { timeout: 90000 });
  console.log('Loaded desktop renderer:', await window.title());
} finally {
  await app.close();
}
