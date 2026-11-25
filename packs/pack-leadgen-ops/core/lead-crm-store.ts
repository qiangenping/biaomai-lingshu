export type LeadStage = 'new' | 'engaged' | 'qualified' | 'opportunity' | 'won';

export interface LeadRecord {
  id: string;
  platform: string;
  sourcePostId: string;
  shortLinkId?: string;
  nickname: string;
  sanitizedComment: string;
  intentTier: 'S' | 'A' | 'B' | 'C';
  intentScore: number;
  stage: LeadStage;
  dealValue: number;
  notes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadInput {
  platform: string;
  sourcePostId: string;
  shortLinkId?: string;
  nickname: string;
  sanitizedComment: string;
  intentTier: 'S' | 'A' | 'B' | 'C';
  intentScore: number;
}

/**
 * Local-First 5-Stage Lead CRM Store (Community Edition).
 * Team / Enterprise editions swap in cloud sync + WeCom SCRM / HubSpot connectors via plugin adapter.
 */
export class LeadCrmStore {
  private readonly leads = new Map<string, LeadRecord>();
  private seq = 1;

  addLead(input: CreateLeadInput): LeadRecord {
    // Deduplicate by (platform, sourcePostId, nickname, sanitizedComment)
    for (const existing of this.leads.values()) {
      if (
        existing.platform === input.platform &&
        existing.sourcePostId === input.sourcePostId &&
        existing.nickname === input.nickname &&
        existing.sanitizedComment === input.sanitizedComment
      ) {
        return existing;
      }
    }

    const now = new Date().toISOString();
    const record: LeadRecord = {
      id: `lead_${this.seq++}`,
      ...input,
      stage: 'new',
      dealValue: 0,
      notes: [],
      createdAt: now,
      updatedAt: now,
    };
    this.leads.set(record.id, record);
    return record;
  }

  updateStage(leadId: string, stage: LeadStage, dealValue?: number): LeadRecord {
    const record = this.leads.get(leadId);
    if (!record) throw new Error(`Lead not found: ${leadId}`);
    record.stage = stage;
    if (typeof dealValue === 'number' && dealValue >= 0) {
      record.dealValue = dealValue;
    }
    record.updatedAt = new Date().toISOString();
    return record;
  }

  listByStage(stage?: LeadStage): LeadRecord[] {
    const all = Array.from(this.leads.values());
    return stage ? all.filter((l) => l.stage === stage) : all;
  }

  exportCsv(): string {
    const header = 'id,platform,sourcePostId,shortLinkId,nickname,intentTier,intentScore,stage,dealValue,createdAt';
    const rows = Array.from(this.leads.values()).map((l) =>
      [l.id, l.platform, l.sourcePostId, l.shortLinkId ?? '', l.nickname, l.intentTier, l.intentScore, l.stage, l.dealValue, l.createdAt]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    return [header, ...rows].join('\n');
  }
}
