import React, { useState } from 'react';
import type { Locale, RegionProfile } from '@biaomai/plugin-sdk';
import type { LeadRecord, LeadStage } from '../core/lead-crm-store.js';
import type { ChannelRoiSummary } from '../core/attribution-service.js';

export interface LeadCRMCanvasProps {
  locale: Locale;
  profile: RegionProfile;
  leads: LeadRecord[];
  roiSummaries: ChannelRoiSummary[];
  onAdvanceStage: (leadId: string, nextStage: LeadStage) => void;
  onExportCsv: () => void;
}

const STAGES: { id: LeadStage; label: Record<Locale, string> }[] = [
  { id: 'new', label: { 'zh-CN': '新意向', 'en-US': 'New' } },
  { id: 'engaged', label: { 'zh-CN': '已回复', 'en-US': 'Engaged' } },
  { id: 'qualified', label: { 'zh-CN': '已留资', 'en-US': 'Qualified' } },
  { id: 'opportunity', label: { 'zh-CN': '商机', 'en-US': 'Opportunity' } },
  { id: 'won', label: { 'zh-CN': '成交', 'en-US': 'Won' } },
];

export const LeadCRMCanvas: React.FC<LeadCRMCanvasProps> = ({
  locale,
  profile,
  leads,
  roiSummaries,
  onAdvanceStage,
  onExportCsv,
}) => {
  const [tab, setTab] = useState<'kanban' | 'roi'>('kanban');
  const isZh = locale === 'zh-CN';

  const totalClicks = roiSummaries.reduce((acc, r) => acc + r.clicks, 0);
  const highIntent = leads.filter((l) => l.intentTier === 'S' || l.intentTier === 'A').length;
  const wonCount = leads.filter((l) => l.stage === 'won').length;
  const totalRevenue = leads.reduce((acc, l) => acc + (l.stage === 'won' ? l.dealValue : 0), 0);

  return (
    <div className="bm-canvas-body">
      <div className="bm-kpi-grid">
        <div className="bm-kpi-card">
          <span className="bm-muted">{isZh ? '短链点击' : 'Link Clicks'}</span>
          <strong className="bm-mono">{totalClicks}</strong>
        </div>
        <div className="bm-kpi-card">
          <span className="bm-muted">{isZh ? 'S/A 高意向' : 'S/A Intent'}</span>
          <strong className="bm-mono">{highIntent}</strong>
        </div>
        <div className="bm-kpi-card">
          <span className="bm-muted">{isZh ? '有效线索' : 'CRM Leads'}</span>
          <strong className="bm-mono">{leads.length}</strong>
        </div>
        <div className="bm-kpi-card">
          <span className="bm-muted">{isZh ? '成交额' : 'Won Revenue'}</span>
          <strong className="bm-mono">
            {profile.currencySymbol}
            {totalRevenue} ({wonCount})
          </strong>
        </div>
      </div>

      <div className="bm-canvas-toolbar">
        <div className="bm-pill-group">
          <button
            type="button"
            className={`bm-chip ${tab === 'kanban' ? 'bm-chip-active' : ''}`}
            onClick={() => setTab('kanban')}
          >
            {isZh ? '5 阶段线索看板' : '5-Stage Pipeline'}
          </button>
          <button
            type="button"
            className={`bm-chip ${tab === 'roi' ? 'bm-chip-active' : ''}`}
            onClick={() => setTab('roi')}
          >
            {isZh ? '渠道 ROI 归因' : 'Channel ROI'}
          </button>
        </div>

        <button type="button" className="bm-btn-ghost" onClick={onExportCsv}>
          {isZh ? '导出 CSV' : 'Export CSV'}
        </button>
      </div>

      {tab === 'kanban' ? (
        <div className="bm-kanban-grid">
          {STAGES.map((stage, idx) => {
            const items = leads.filter((l) => l.stage === stage.id);
            const nextStage = STAGES[idx + 1]?.id;
            return (
              <div key={stage.id} className="bm-kanban-col">
                <div className="bm-kanban-header">
                  <span>{stage.label[locale]}</span>
                  <span className="bm-mono">{items.length}</span>
                </div>
                {items.map((lead) => (
                  <div key={lead.id} className="bm-card bm-lead-card">
                    <div className="bm-card-header">
                      <span className="bm-badge bm-badge-info">{lead.platform}</span>
                      <span className="bm-badge bm-badge-danger">{lead.intentTier}</span>
                    </div>
                    <div className="bm-card-title">{lead.nickname}</div>
                    <p className="bm-comment-text">{lead.sanitizedComment}</p>
                    {nextStage && (
                      <button
                        type="button"
                        className="bm-btn-ghost"
                        onClick={() => onAdvanceStage(lead.id, nextStage)}
                      >
                        {isZh ? `推进至 → ${STAGES[idx + 1].label[locale]}` : `Move → ${STAGES[idx + 1].label[locale]}`}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bm-roi-table">
          {roiSummaries.map((row) => (
            <div key={row.platform} className="bm-card bm-roi-row">
              <strong>{row.platform}</strong>
              <span className="bm-mono">{isZh ? '点击' : 'Clicks'}: {row.clicks}</span>
              <span className="bm-mono">{isZh ? '高意向' : 'S/A'}: {row.highIntentLeads}</span>
              <span className="bm-mono">{isZh ? '成交' : 'Won'}: {row.wonDeals}</span>
              <span className="bm-mono">
                {profile.currencySymbol}
                {row.revenue}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
