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
  onCreateAccount: (platform: string, accountId: string, displayLabel: string) => Promise<void>;
  scoredLeads: ScoredCommentLead[];
  onAnalyzeCurrentPage: (pastedCommentsText?: string) => Promise<void>;
  onAdoptReply: (commentId: string, replyText: string) => void;
  onAddLeadToCrm: (lead: ScoredCommentLead) => void;
}

export const BrowserRadarCanvas: React.FC<BrowserRadarCanvasProps> = ({
  locale,
  profile,
  sessions,
  activePartition,
  onSelectPartition,
  onCreateAccount,
  scoredLeads,
  onAnalyzeCurrentPage,
  onAdoptReply,
  onAddLeadToCrm,
}) => {
  const [aiMode, setAiMode] = useState<BrowserAiEngineMode>('agent-browser');
  const [prefillBanner, setPrefillBanner] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<'ALL' | 'S' | 'A'>('ALL');
  const [newPlatform, setNewPlatform] = useState(profile.platforms[0]?.id ?? 'tiktok');
  const [newAccountId, setNewAccountId] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [pastedComments, setPastedComments] = useState('');
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
        ? `已通过 ${aiMode} 准备回复（评论 ${cmd.commentId}），停在发送键前等待您人工确认。`
        : `Reply ready for ${cmd.commentId} via ${aiMode}. Stopped before Send for manual confirmation.`,
    );
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountId.trim()) return;
    await onCreateAccount(newPlatform, newAccountId.trim(), newLabel.trim() || `${newPlatform}-${newAccountId.trim()}`);
    setNewAccountId('');
    setNewLabel('');
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
          {sessions.length === 0 ? (
            <option value="">{isZh ? '暂无隔离账号（请下方新建）' : 'No isolated account yet'}</option>
          ) : (
            sessions.map((s) => (
              <option key={s.partition} value={s.partition}>
                🟢 {s.displayLabel} ({s.partition})
              </option>
            ))
          )}
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

        <button
          type="button"
          className="bm-btn-primary"
          onClick={() => onAnalyzeCurrentPage(pastedComments)}
        >
          {isZh ? '🎯 AI 意向雷达分析' : '🎯 Run Intent Radar'}
        </button>
      </div>

      <form className="bm-card" onSubmit={handleAddAccount}>
        <div className="bm-field-label">{isZh ? '新建多账号隔离容器（持久化至本地）' : 'Create Isolated Account Partition (Persisted)'}</div>
        <div className="bm-composer-row">
          <select className="bm-select" value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)}>
            {(profile.platforms.length > 0
              ? profile.platforms
              : [{ id: 'tiktok', name: { 'zh-CN': 'TikTok', 'en-US': 'TikTok' } }]
            ).map((p) => (
              <option key={p.id} value={p.id}>{p.name[locale]}</option>
            ))}
          </select>
          <input
            className="bm-input"
            placeholder={isZh ? '账号标识 (如 main01)' : 'Account ID (e.g. main01)'}
            value={newAccountId}
            onChange={(e) => setNewAccountId(e.target.value)}
          />
          <input
            className="bm-input"
            placeholder={isZh ? '备注名' : 'Label'}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <button type="submit" className="bm-btn-ghost">{isZh ? '+ 添加' : '+ Add'}</button>
        </div>
      </form>

      {prefillBanner && <div className="bm-banner bm-banner-success">{prefillBanner}</div>}

      <div className="bm-card">
        <div className="bm-webview-header">
          <span className="bm-mono">
            CDP 127.0.0.1:{activeSession?.cdpPort ?? 19220} · {profile.name[locale]}
          </span>
          <span className="bm-badge bm-badge-success">
            {isZh ? '零模拟数据 · 自动 PII 脱敏' : 'Zero Mock Data · Auto PII Redaction'}
          </span>
        </div>
        <textarea
          className="bm-textarea"
          rows={3}
          placeholder={
            isZh
              ? 'Electron 桌面模式下点击上方按钮直接读取当前内置浏览器网页评论；WebUI 模式下可在此粘贴真实评论（每行一条）后点击「AI 意向雷达分析」...'
              : 'In Electron Desktop mode click Run Intent Radar to read live visible comments; in WebUI mode paste real comments (one per line) and analyze...'
          }
          value={pastedComments}
          onChange={(e) => setPastedComments(e.target.value)}
        />
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
              {tier === 'ALL' ? (isZh ? `S/A 高意向 (${filtered.length})` : `S/A Intent (${filtered.length})`) : `${tier}-Tier`}
            </button>
          ))}
        </div>

        <div className="bm-radar-list">
          {filtered.length === 0 ? (
            <div className="bm-card bm-muted">
              {isZh ? '暂无分析结果。请粘贴真实评论或使用桌面端内置浏览器分析当前页。' : 'No analyzed comments yet. Paste real comments or analyze a live page in Electron Desktop.'}
            </div>
          ) : (
            filtered.map((lead) => (
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};
