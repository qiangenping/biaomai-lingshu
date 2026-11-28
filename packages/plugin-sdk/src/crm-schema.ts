/**
 * @license
 * Copyright 2026 OpenGrowth Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

export const SmtpAccountSchema = z.object({
  id: z.string(),
  label: z.string(),
  host: z.string(),
  port: z.number().int().positive().default(465),
  user: z.string(),
  pass: z.string(),
  dailyLimit: z.number().int().positive().default(30),
  sentToday: z.number().int().nonnegative().default(0),
  lastSentDate: z.string().optional(),
});

export const OutreachSequenceStepSchema = z.object({
  dayOffset: z.number().int().nonnegative(),
  channel: z.enum(['email', 'whatsapp', 'linkedin']).default('email'),
  subject: z.string(),
  body: z.string(),
  status: z.enum(['pending', 'approved', 'sent', 'skipped']).default('pending'),
  sentAt: z.string().optional(),
});

export const ProspectRecordSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  industry: z.string(),
  country: z.string(),
  website: z.string().default(''),
  email: z.string().default(''),
  phone: z.string().default(''),
  whatsappUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  mxValid: z.boolean().optional(),
  mxHost: z.string().optional(),
  snippet: z.string().default(''),
  sourceUrl: z.string().default(''),
  replied: z.boolean().default(false),
  sequence: z.array(OutreachSequenceStepSchema).default([]),
});

export const UnifiedLeadRecordSchema = z.object({
  id: z.string(),
  platformId: z.string(),
  nickname: z.string(),
  sanitizedComment: z.string(),
  tier: z.enum(['S', 'A', 'B', 'C']),
  score: z.number().min(0).max(100),
  stage: z.enum(['new', 'engaged', 'qualified', 'opportunity', 'won']),
  dealValue: z.number().nonnegative().default(0),
  createdAt: z.string(),
});

export const CronJobConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['imap_reply_check', 'followup_reminder', 'intent_radar_digest']),
  intervalMinutes: z.number().int().positive().default(60),
  enabled: z.boolean().default(false),
  lastRunAt: z.string().optional(),
  lastSummary: z.string().optional(),
});

export const BiaoMaiDbSchema = z.object({
  accounts: z.array(z.record(z.unknown())).default([]),
  posts: z.array(z.record(z.unknown())).default([]),
  leads: z.array(UnifiedLeadRecordSchema).default([]),
  prospects: z.array(ProspectRecordSchema).default([]),
  smtpPool: z.array(SmtpAccountSchema).default([]),
  cronJobs: z.array(CronJobConfigSchema).default([]),
});

export type SmtpAccount = z.infer<typeof SmtpAccountSchema>;
export type OutreachSequenceStep = z.infer<typeof OutreachSequenceStepSchema>;
export type ProspectRecord = z.infer<typeof ProspectRecordSchema>;
export type UnifiedLeadRecord = z.infer<typeof UnifiedLeadRecordSchema>;
export type CronJobConfig = z.infer<typeof CronJobConfigSchema>;
export type BiaoMaiDb = z.infer<typeof BiaoMaiDbSchema>;
