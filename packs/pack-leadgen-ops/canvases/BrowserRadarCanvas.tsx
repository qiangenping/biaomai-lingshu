import React, { useState } from 'react';
import type { Locale, RegionProfile } from '@biaomai/plugin-sdk';
import {
  createCompliantPrefillCommand,
  type BrowserAiEngineMode,
  type IsolatedAccountSession,
  type ScoredCommentLead,
} from '@biaomai/ai-browser';

export interface BrowserRadarCanvasProps {
  locale: Locale;
  profile: RegionProfile;
  sessions: IsolatedAccountSession[];
  activePartition: string;
  onSelectPartition: (partition: string) => void;
  scoredLeads: ScoredCommentLead[];
  onAnalyzeCurrentPage: () => void;
  onAdoptReply: (commentId: string, replyText: string) => void;
  onAddLeadToCrm: (lead: ScoredCommentLead) => void;
}

export const BrowserRadarCanvas: React.FC<BrowserRadarCanvasProps> = ({
  locale,
  profile,
  sessions,
  activePartition,
  onSelectPartition,
  scoredLeads,
  onAnalyzeCurrentPage,
  onAdoptReply,
  onAddLeadToCrm,
}) => {
  const [aiMode, setAiMode] = useState<BrowserAiEngineMode>('agent-browser');
  const [prefillBanner, setPrefillBanner] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<'ALL' | 'S' | 'A'>('ALL');
  const isZh = locale === 'zh-CN';

  const activeSession = sessions.find((s) => s.partition === activePartition) ?? sessions[0];
  const filtered = scoredLeads.filter((item) =>
    tierFilter === 'ALL' ? item.tier === 'S' || item.tier === 'A' : item.tier === tierFilter,
  );

  const handleAdopt = (lead: ScoredCommentLead, text: string) => {
    const cmd = createCompliantPrefillCommand(lead.comment.commentId, text);
    onAdoptReply(cmd.commentId, cmd.replyText);
    setPrefillBanner(
      isZh
        ? `已通过 ${aiMode} 填入回复至评论 ${cmd.commentId}，并停在发送键前等待您人工确认。`
        : `Prefilled reply for ${cmd.commentId} via ${aiMode}. Stopped before Send for manual confirmation.`,
    );
  };

  return (
    <div className="bm-canvas-body">
      <div className="bm-browser-bar">
        <select
          className="bm-select"
          aria-label="Isolated Account Session"
          value={activeSession?.partition ?? ''}
          onChange={(e) => onSelectPartition(e.target.value)}
        >
          {sessions.map((s) => (
            <option key={s.partition} value={s.partition}>
              🟢 {s.displayLabel} ({s.partition})
            </option>
          ))}
        </select>

        <select
          className="bm-select"
          aria-label="AI Browser Engine Mode"
          value={aiMode}
          onChange={(e) => setAiMode(e.target.value as BrowserAiEngineMode)}
        >
          <option value="agent-browser">⚡ Agent-Browser (Apache-2.0)</option>
          <option value="stagehand">🧠 Stagehand (MIT)</option>
          <option value="midscene">👁️ Midscene Vision (MIT)</option>
        </select>

        <button type="button" className="bm-btn-primary" onClick={onAnalyzeCurrentPage}>
          {isZh ? '🎯 AI 意向雷达分析当前页' : '🎯 Analyze Visible Comments'}
        </button>
      </div>

      {prefillBanner && <div className="bm-banner bm-banner-success">{prefillBanner}</div>}

      <div className="bm-browser-split">
        <div className="bm-webview-surface">
          <div className="bm-webview-header">
            <span className="bm-mono">
              CDP 127.0.0.1:{activeSession?.cdpPort ?? 19220} · {profile.name[locale]}
            </span>
            <span className="bm-badge bm-badge-success">
              {isZh ? '物理隔离 Cookie · 零外部插件' : 'Isolated Session · Zero Extension'}
            </span>
          </div>
          <div className="bm-webview-mock">
            <p>
              {isZh
                ? 'Electron WebContentsView 实时前台网页容器：仅在您主动浏览并点击分析时读取当前可见 DOM，自动经 pii-sanitizer 脱敏。'
                : 'Live foreground Electron WebContentsView: reads visible DOM only on explicit click, automatically sanitized via pii-sanitizer.'}
            </p>
          </div>
        </div>

        <div className="bm-radar-drawer">
          <div className="bm-pill-group">
            {(['ALL', 'S', 'A'] as const).map((tier) => (
              <button
                key={tier}
                type="button"
                className={`bm-chip ${tierFilter === tier ? 'bm-chip-active' : ''}`}
                onClick={() => setTierFilter(tier)}
              >
                {tier === 'ALL' ? (isZh ? 'S/A 高意向' : 'S/A High Intent') : `${tier}-Tier`}
              </button>
            ))}
          </div>

          <div className="bm-radar-list">
            {filtered.map((lead) => (
              <div key={lead.comment.commentId} className="bm-card">
                <div className="bm-card-header">
                  <span className={`bm-badge ${lead.tier === 'S' ? 'bm-badge-danger' : 'bm-badge-warning'}`}>
                    {lead.tier} · {lead.intentScore}
                  </span>
                  <span className="bm-muted">{lead.comment.nickname}</span>
                </div>
                <p className="bm-comment-text">{lead.comment.content}</p>
                {lead.comment.redactedCount > 0 && (
                  <div className="bm-muted">
                    {isZh
                      ? `🛡️ 已自动脱敏 ${lead.comment.redactedCount} 处隐私信息`
                      : `🛡️ Redacted ${lead.comment.redactedCount} PII tokens automatically`}
                  </div>
                )}
                <div className="bm-draft-box">{lead.replyDrafts.consultant}</div>
                <div className="bm-card-actions">
                  <button
                    type="button"
                    className="bm-btn-primary"
                    onClick={() => handleAdopt(lead, lead.replyDrafts.consultant)}
                  >
                    {isZh ? '采纳并填入回复' : 'Adopt & Prefill'}
                  </button>
                  <button
                    type="button"
                    className="bm-btn-ghost"
                    onClick={() => onAddLeadToCrm(lead)}
                  >
                    {isZh ? '+ 加入线索 CRM' : '+ Add to CRM'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
