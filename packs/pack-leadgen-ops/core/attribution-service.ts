import type { LeadRecord } from './lead-crm-store.js';

export interface ShortLinkMetric {
  shortLinkId: string;
  platform: string;
  postTitle: string;
  clicks: number;
}

export interface ChannelRoiSummary {
  platform: string;
  clicks: number;
  highIntentLeads: number;
  wonDeals: number;
  revenue: number;
  conversionRate: number;
}

/**
 * Attribution engine connecting AiToEarn short-link click stats with LeadCrmStore funnel outcomes.
 */
export function computeChannelRoi(
  links: ShortLinkMetric[],
  leads: LeadRecord[],
): ChannelRoiSummary[] {
  const byPlatform = new Map<string, ChannelRoiSummary>();

  const ensure = (platform: string): ChannelRoiSummary => {
    let row = byPlatform.get(platform);
    if (!row) {
      row = { platform, clicks: 0, highIntentLeads: 0, wonDeals: 0, revenue: 0, conversionRate: 0 };
      byPlatform.set(platform, row);
    }
    return row;
  };

  for (const link of links) {
    ensure(link.platform).clicks += link.clicks;
  }

  for (const lead of leads) {
    const row = ensure(lead.platform);
    if (lead.intentTier === 'S' || lead.intentTier === 'A') {
      row.highIntentLeads += 1;
    }
    if (lead.stage === 'won') {
      row.wonDeals += 1;
      row.revenue += lead.dealValue;
    }
  }

  for (const row of byPlatform.values()) {
    row.conversionRate = row.highIntentLeads > 0 ? Number((row.wonDeals / row.highIntentLeads).toFixed(4)) : 0;
  }

  return Array.from(byPlatform.values()).sort((a, b) => b.revenue - a.revenue || b.highIntentLeads - a.highIntentLeads);
}
