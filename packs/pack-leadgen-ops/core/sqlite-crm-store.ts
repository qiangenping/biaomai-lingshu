import fs from 'node:fs';
import path from 'node:path';
import type { CreateLeadInput, LeadRecord, LeadStage } from './lead-crm-store.js';

export interface ScheduledPostRecord {
  id: string;
  title: string;
  platformId: string;
  scheduledAt: string;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'auth_expired';
  shortLinkId: string;
  createdAt: string;
}

interface PersistedWorkspaceSnapshot {
  leads: LeadRecord[];
  posts: ScheduledPostRecord[];
  settings: Record<string, string>;
}

/**
 * Durable Local-First Workspace Store (atomic file persistence via write-tmp + rename).
 * Works across all Node.js versions (18/20/22/23+) with zero native C++ compilation or experimental flags.
 * Survives app restarts cleanly; Team/Enterprise editions swap in cloud PostgreSQL/MongoDB adapters.
 */
export class SqliteWorkspaceStore {
  private readonly filePath: string;
  private state: PersistedWorkspaceSnapshot = { leads: [], posts: [], settings: {} };

  constructor(dbFilePath: string) {
    this.filePath = dbFilePath;
    if (this.filePath !== ':memory:' && fs.existsSync(this.filePath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8')) as Partial<PersistedWorkspaceSnapshot>;
        this.state = {
          leads: Array.isArray(parsed.leads) ? parsed.leads : [],
          posts: Array.isArray(parsed.posts) ? parsed.posts : [],
          settings: parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : {},
        };
      } catch {
        this.state = { leads: [], posts: [], settings: {} };
      }
    }
  }

  private flush(): void {
    if (this.filePath === ':memory:') return;
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.state, null, 2), 'utf8');
    fs.renameSync(tmp, this.filePath);
  }

  addLead(input: CreateLeadInput): LeadRecord {
    const existing = this.state.leads.find(
      (l) =>
        l.platform === input.platform &&
        l.sourcePostId === input.sourcePostId &&
        l.nickname === input.nickname &&
        l.sanitizedComment === input.sanitizedComment,
    );
    if (existing) return existing;

    const now = new Date().toISOString();
    const record: LeadRecord = {
      id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...input,
      stage: 'new',
      dealValue: 0,
      notes: [],
      createdAt: now,
      updatedAt: now,
    };
    this.state.leads.unshift(record);
    this.flush();
    return record;
  }

  getLead(id: string): LeadRecord | undefined {
    return this.state.leads.find((l) => l.id === id);
  }

  updateLeadStage(id: string, stage: LeadStage, dealValue?: number): LeadRecord {
    const record = this.getLead(id);
    if (!record) throw new Error(`Lead not found: ${id}`);
    record.stage = stage;
    if (typeof dealValue === 'number' && dealValue >= 0) {
      record.dealValue = dealValue;
    }
    record.updatedAt = new Date().toISOString();
    this.flush();
    return record;
  }

  listLeads(stage?: LeadStage): LeadRecord[] {
    return stage ? this.state.leads.filter((l) => l.stage === stage) : [...this.state.leads];
  }

  exportLeadsCsv(): string {
    const header = 'id,platform,sourcePostId,shortLinkId,nickname,intentTier,intentScore,stage,dealValue,createdAt';
    const rows = this.state.leads.map((l) =>
      [l.id, l.platform, l.sourcePostId, l.shortLinkId ?? '', l.nickname, l.intentTier, l.intentScore, l.stage, l.dealValue, l.createdAt]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    return [header, ...rows].join('\n');
  }

  addPost(post: Omit<ScheduledPostRecord, 'id' | 'createdAt'>): ScheduledPostRecord {
    const record: ScheduledPostRecord = {
      id: `pub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ...post,
      createdAt: new Date().toISOString(),
    };
    this.state.posts.unshift(record);
    this.flush();
    return record;
  }

  updatePostStatus(id: string, status: ScheduledPostRecord['status']): ScheduledPostRecord | undefined {
    const post = this.state.posts.find((p) => p.id === id);
    if (!post) return undefined;
    post.status = status;
    this.flush();
    return post;
  }

  listPosts(): ScheduledPostRecord[] {
    return [...this.state.posts];
  }

  setSetting(key: string, value: string): void {
    this.state.settings[key] = value;
    this.flush();
  }

  getSetting(key: string): string | undefined {
    return this.state.settings[key];
  }

  close(): void {
    this.flush();
  }
}
