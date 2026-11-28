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
  const deadline = Date.now() + 120000;
  let heading = '';
  while (!heading && Date.now() < deadline) {
    for (const page of app.windows()) {
      heading = await page.locator('.biaomai-workbench-root h1').innerText({ timeout: 1500 }).catch(() => '');
      if (heading) break;
    }
    if (!heading) await new Promise(resolve => setTimeout(resolve, 1000));
  }
  if (!heading) {
    for (const page of app.windows()) {
      console.error(await page.title(), (await page.locator('body').innerText().catch(() => '')).slice(0, 1200));
    }
    throw new Error('The installed app did not display the OpenGrowth workbench');
  }
  console.log('OpenGrowth workbench loaded:', heading);
} finally {
  await app.close();
}
