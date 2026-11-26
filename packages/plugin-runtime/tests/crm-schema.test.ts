import { describe, expect, it } from 'vitest';
import { BiaoMaiDbSchema, ProspectRecordSchema, SmtpAccountSchema } from '../../plugin-sdk/src/crm-schema.js';

describe('Unified Global Lead-Gen & Outbound CRM Schema', () => {
  it('validates BiaoMaiDb defaults cleanly', () => {
    const db = BiaoMaiDbSchema.parse({});
    expect(db.accounts).toEqual([]);
    expect(db.leads).toEqual([]);
    expect(db.prospects).toEqual([]);
    expect(db.smtpPool).toEqual([]);
    expect(db.cronJobs).toEqual([]);
  });

  it('validates multi-step outreach sequence and SMTP pool account', () => {
    const smtp = SmtpAccountSchema.parse({
      id: 'smtp_1',
      label: 'Primary Gmail',
      host: 'smtp.gmail.com',
      user: 'sales@example.com',
      pass: 'app-pass',
    });
    expect(smtp.port).toBe(465);
    expect(smtp.dailyLimit).toBe(30);

    const prospect = ProspectRecordSchema.parse({
      id: 'p_1',
      companyName: 'Acme GmbH',
      industry: 'CNC Machining',
      country: 'Germany',
      email: 'info@acme.de',
      mxValid: true,
      sequence: [
        { dayOffset: 1, channel: 'email', subject: 'Hello', body: 'Icebreaker', status: 'pending' },
        { dayOffset: 4, channel: 'email', subject: 'Re: Hello', body: 'Case study', status: 'pending' },
        { dayOffset: 9, channel: 'whatsapp', subject: 'Quick check-in', body: 'Hi!', status: 'pending' },
      ],
    });
    expect(prospect.sequence).toHaveLength(3);
    expect(prospect.replied).toBe(false);
  });
});
