#!/usr/bin/env node
/**
 * Installs BiaoMai industry packs & foreign OSS plugins (packs/*) into
 * vendor/aionui/.aionui/extensions and ~/.aionui-dev/extensions so AionUi
 * New Chat & Assistants natively load all packs/skills/assistants.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PACKS_DIR = path.join(ROOT, 'packs');
const TARGETS = [
  path.join(ROOT, 'vendor', 'aionui', '.aionui', 'extensions'),
  path.join(os.homedir(), '.aionui-dev', 'extensions'),
];

function normalizeManifestForAionCore(manifest) {
  const copy = { ...manifest };
  if (copy.displayName && typeof copy.displayName === 'object') {
    copy.displayName = copy.displayName['zh-CN'] || copy.displayName['en-US'] || copy.name;
  }
  if (copy.description && typeof copy.description === 'object') {
    copy.description = copy.description['zh-CN'] || copy.description['en-US'] || '';
  }
  if (copy.contributes && Array.isArray(copy.contributes.assistants)) {
    copy.contributes = {
      ...copy.contributes,
      assistants: copy.contributes.assistants.map((a) => ({
        ...a,
        name: typeof a.name === 'object' ? a.name['zh-CN'] || a.name['en-US'] || a.id : a.name,
        description: typeof a.description === 'object' ? a.description['zh-CN'] || a.description['en-US'] || '' : a.description,
      })),
    };
  }
  return copy;
}

for (const targetDir of TARGETS) {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(PACKS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const src = path.join(PACKS_DIR, entry.name);
    const dest = path.join(targetDir, entry.name);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(src, dest, { recursive: true });

    const manifestPath = path.join(dest, 'aion-extension.json');
    if (fs.existsSync(manifestPath)) {
      const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      fs.writeFileSync(manifestPath, JSON.stringify(normalizeManifestForAionCore(raw), null, 2), 'utf8');
    }
  }
  console.log(`✅ Installed all packs -> ${targetDir}`);
}
