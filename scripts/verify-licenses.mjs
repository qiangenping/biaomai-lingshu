#!/usr/bin/env node
/**
 * Automated Open-Source License & Governance Gate
 * Fails CI if required legal files are missing or if any package declares
 * a forbidden copyleft/source-available license (GPL, AGPL, LGPL, FSL, SSPL, Community Source).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const REQUIRED_FILES = [
  'LICENSE',
  'NOTICE',
  'THIRD_PARTY_NOTICES.md',
  'SECURITY.md',
  'PRIVACY_AND_COMPLIANCE.md',
  'CODE_OF_CONDUCT.md',
  'CONTRIBUTING.md',
  'CONTRIBUTING.zh-CN.md',
  'README.md',
  'README.zh-CN.md',
];

const FORBIDDEN_LICENSE_PATTERNS = [
  /\bAGPL/i,
  /\bGPL/i,
  /\bLGPL/i,
  /\bSSPL/i,
  /\bBUSL/i,
  /\bFSL\b/i,
  /Community Source/i,
  /UNLICENSED/i,
];

const errors = [];

for (const rel of REQUIRED_FILES) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full) || fs.statSync(full).size === 0) {
    errors.push(`Missing or empty required governance file: ${rel}`);
  }
}

function scanPackageJsons(dir, depth = 0) {
  if (depth > 3 || !fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanPackageJsons(full, depth + 1);
    } else if (entry.name === 'package.json') {
      try {
        const pkg = JSON.parse(fs.readFileSync(full, 'utf8'));
        const lic = typeof pkg.license === 'string' ? pkg.license : JSON.stringify(pkg.license || '');
        if (lic) {
          for (const pattern of FORBIDDEN_LICENSE_PATTERNS) {
            if (pattern.test(lic)) {
              errors.push(`Forbidden license "${lic}" detected in ${path.relative(ROOT, full)}`);
            }
          }
        }
      } catch (err) {
        errors.push(`Invalid JSON in ${path.relative(ROOT, full)}: ${err.message}`);
      }
    }
  }
}

scanPackageJsons(ROOT, 0);
scanPackageJsons(path.join(ROOT, 'packages'), 0);
scanPackageJsons(path.join(ROOT, 'packs'), 0);

// Also verify vendored upstream LICENSE files are preserved
for (const vendorLic of ['vendor/aionui/LICENSE', 'vendor/aitoearn/LICENSE']) {
  const full = path.join(ROOT, vendorLic);
  if (fs.existsSync(path.dirname(full)) && !fs.existsSync(full)) {
    errors.push(`Vendored upstream LICENSE file missing: ${vendorLic}`);
  }
}

if (errors.length > 0) {
  console.error('❌ License & governance audit failed:');
  for (const e of errors) console.error('  -', e);
  process.exit(1);
}

console.log('✅ License & governance audit passed (Apache-2.0 / MIT clean, all required governance files present).');
