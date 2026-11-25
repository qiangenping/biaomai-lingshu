#!/usr/bin/env node
/**
 * Automated Bilingual (zh-CN / en-US) Key Symmetry Verifier
 * Scans all packs/ and packages/ i18n directories and asserts 100% key parity.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, next));
    } else {
      keys.push(next);
    }
  }
  return keys.sort();
}

function findI18nDirs(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'vendor' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'i18n') {
        acc.push(full);
      } else {
        findI18nDirs(full, acc);
      }
    }
  }
  return acc;
}

const i18nDirs = [
  ...findI18nDirs(path.join(ROOT, 'packages')),
  ...findI18nDirs(path.join(ROOT, 'packs')),
];

if (i18nDirs.length === 0) {
  console.error('❌ No i18n directories found under packages/ or packs/.');
  process.exit(1);
}

const errors = [];
let checkedCount = 0;

for (const dir of i18nDirs) {
  const zhPath = path.join(dir, 'zh-CN.json');
  const enPath = path.join(dir, 'en-US.json');
  const rel = path.relative(ROOT, dir);

  if (!fs.existsSync(zhPath) || !fs.existsSync(enPath)) {
    errors.push(`${rel}: must contain both zh-CN.json and en-US.json`);
    continue;
  }

  const zhKeys = flattenKeys(JSON.parse(fs.readFileSync(zhPath, 'utf8')));
  const enKeys = flattenKeys(JSON.parse(fs.readFileSync(enPath, 'utf8')));

  const zhSet = new Set(zhKeys);
  const enSet = new Set(enKeys);

  for (const k of zhKeys) {
    if (!enSet.has(k)) errors.push(`${rel}: missing key in en-US.json -> ${k}`);
  }
  for (const k of enKeys) {
    if (!zhSet.has(k)) errors.push(`${rel}: missing key in zh-CN.json -> ${k}`);
  }
  checkedCount += zhKeys.length;
}

if (errors.length > 0) {
  console.error('❌ i18n key parity check failed:');
  for (const e of errors) console.error('  -', e);
  process.exit(1);
}

console.log(`✅ i18n parity check passed across ${i18nDirs.length} directories (${checkedCount} symmetric keys).`);
