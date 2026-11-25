#!/usr/bin/env node
/**
 * Installs BiaoMai industry packs (packs/*) into vendor/aionui/.aionui/extensions
 * so AionUi desktop shell loads them natively without modifying upstream AionUi source.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PACKS_DIR = path.join(ROOT, 'packs');
const TARGET_DIR = path.join(ROOT, 'vendor', 'aionui', '.aionui', 'extensions');

fs.mkdirSync(TARGET_DIR, { recursive: true });

for (const entry of fs.readdirSync(PACKS_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const src = path.join(PACKS_DIR, entry.name);
  const dest = path.join(TARGET_DIR, entry.name);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log(`✅ Installed pack "${entry.name}" -> ${path.relative(ROOT, dest)}`);
}
