#!/usr/bin/env node
/**
 * Verifies that every packs/<name>/aion-extension.json manifest references real files on disk.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PACKS_DIR = path.join(ROOT, 'packs');

const errors = [];
let verifiedFiles = 0;

function assertExists(packDir, relPath, label) {
  if (!relPath) return;
  const full = path.resolve(packDir, relPath);
  if (!fs.existsSync(full)) {
    errors.push(`${path.basename(packDir)} -> missing ${label}: ${relPath}`);
  } else {
    verifiedFiles += 1;
  }
}

for (const entry of fs.readdirSync(PACKS_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const packDir = path.join(PACKS_DIR, entry.name);
  const manifestPath = path.join(packDir, 'aion-extension.json');
  if (!fs.existsSync(manifestPath)) {
    errors.push(`${entry.name}: missing aion-extension.json`);
    continue;
  }
  const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const c = m.contributes || {};

  for (const skill of c.skills || []) {
    assertExists(packDir, skill.file, `skill(${skill.name}).file`);
    if (skill.localizedFiles) {
      assertExists(packDir, skill.localizedFiles['zh-CN'], `skill(${skill.name}).zh-CN`);
      assertExists(packDir, skill.localizedFiles['en-US'], `skill(${skill.name}).en-US`);
    }
  }
  for (const assistant of c.assistants || []) {
    assertExists(packDir, assistant.contextFile, `assistant(${assistant.id}).contextFile`);
    if (assistant.localizedContextFiles) {
      assertExists(packDir, assistant.localizedContextFiles['zh-CN'], `assistant(${assistant.id}).zh-CN`);
      assertExists(packDir, assistant.localizedContextFiles['en-US'], `assistant(${assistant.id}).en-US`);
    }
  }
  for (const theme of c.themes || []) {
    assertExists(packDir, theme.file, `theme(${theme.id}).file`);
  }
  for (const canvas of c.canvases || []) {
    assertExists(packDir, canvas.componentPath, `canvas(${canvas.id}).componentPath`);
  }
  if (c.settingsTabs) {
    assertExists(packDir, c.settingsTabs, 'settingsTabs');
  }
}

if (errors.length > 0) {
  console.error('❌ Pack manifest integrity check failed:');
  for (const e of errors) console.error('  -', e);
  process.exit(1);
}

console.log(`✅ Pack manifest integrity check passed (${verifiedFiles} referenced files verified on disk).`);
