/**
 * @license
 * Copyright 2026 BiaoMai Lingshu Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

export interface BiaoMaiLocalDb {
  accounts: unknown[];
  posts: unknown[];
  leads: unknown[];
  prospects: unknown[];
  smtpPool: unknown[];
  cronJobs: unknown[];
}

const DEFAULT_DB: BiaoMaiLocalDb = {
  accounts: [],
  posts: [],
  leads: [],
  prospects: [],
  smtpPool: [],
  cronJobs: [],
};

function getDbPath(): string {
  const dir = app.getPath('userData');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'biaomai-studio-db.json');
}

export function readBiaoMaiDb(): BiaoMaiLocalDb {
  const filePath = getDbPath();
  if (!fs.existsSync(filePath)) {
    return { ...DEFAULT_DB };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Partial<BiaoMaiLocalDb>;
    return {
      accounts: Array.isArray(raw.accounts) ? raw.accounts : [],
      posts: Array.isArray(raw.posts) ? raw.posts : [],
      leads: Array.isArray(raw.leads) ? raw.leads : [],
      prospects: Array.isArray(raw.prospects) ? raw.prospects : [],
      smtpPool: Array.isArray(raw.smtpPool) ? raw.smtpPool : [],
      cronJobs: Array.isArray(raw.cronJobs) ? raw.cronJobs : [],
    };
  } catch {
    return { ...DEFAULT_DB };
  }
}

export function saveBiaoMaiCollection(collection: keyof BiaoMaiLocalDb, items: unknown[]): BiaoMaiLocalDb {
  const current = readBiaoMaiDb();
  const next: BiaoMaiLocalDb = {
    ...current,
    [collection]: items,
  };
  const filePath = getDbPath();
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(next, null, 2), 'utf8');
  fs.renameSync(tmpPath, filePath);
  return next;
}
