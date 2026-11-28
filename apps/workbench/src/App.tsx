import React, { useEffect, useMemo, useState } from 'react';
import {
  CanvasRegistry,
  type Locale,
  type RegionId,
  type RegionProfile,
} from '@biaomai/plugin-sdk';
import {
  type IsolatedAccountSession,
  type ScoredCommentLead,
} from '@biaomai/ai-browser';

import chinaProfileJson from '../../../config/china.profile.json';
import globalProfileJson from '../../../config/global.profile.json';
import selfHostedProfileJson from '../../../config/self-hosted.profile.json';
import leadgenManifest from '../../../packs/pack-leadgen-ops/aion-extension.json';
import templateManifest from '../../../packs/pack-template/aion-extension.json';
import cronTemplates from '../../../packs/pack-leadgen-ops/contributes/cron-templates.json';

import { PreviewCanvas, type DraftPreviewData } from '../../../packs/pack-leadgen-ops/canvases/PreviewCanvas';
import { CalendarCanvas, type ScheduledPostItem } from '../../../packs/pack-leadgen-ops/canvases/CalendarCanvas';
import { BrowserRadarCanvas } from '../../../packs/pack-leadgen-ops/canvases/BrowserRadarCanvas';
import { LeadCRMCanvas } from '../../../packs/pack-leadgen-ops/canvases/LeadCRMCanvas';
import { SampleCanvas } from '../../../packs/pack-template/canvases/SampleCanvas';
import type { LeadRecord, LeadStage } from '../../../packs/pack-leadgen-ops/core/lead-crm-store';
import type { ChannelRoiSummary } from '../../../packs/pack-leadgen-ops/core/attribution-service';

declare global {
  interface Window {
    biaomaiElectron?: {
      isElectron: boolean;
      mountBrowser: (payload: {
        partition: string;
        url: string;
        bounds: { x: number; y: number; width: number; height: number };
      }) => Promise<{ ok: boolean; url?: string; cdpPort?: number }>;
      hideBrowser: () => Promise<{ ok: boolean }>;
      analyzeVisibleComments: () => Promise<{ ok: boolean; scored: ScoredCommentLead[]; error?: string }>;
      prefillReply: (replyText: string) => Promise<{ ok: boolean; stopBeforeSubmit?: boolean }>;
      encryptSecret: (plain: string) => Promise<string>;
    };
  }
}

const PROFILES: Record<RegionId, RegionProfile> = {
  'cn-official': chinaProfileJson as unknown as RegionProfile,
  'global-official': globalProfileJson as unknown as RegionProfile,
  'self-hosted': selfHostedProfileJson as unknown as RegionProfile,
};

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant' | 'mcp';
  text: string;
  toolName?: string;
  latencyMs?: number;
}

export const App: React.FC = () => {
  const [regionId, setRegionId] = useState<RegionId>('global-official');
  const [locale, setLocale] = useState<Locale>('zh-CN');
  const [theme, setTheme] = useState<'lingshu-dark' | 'lingshu-light'>('lingshu-dark');
  const [engine, setEngine] = useState<'opencode' | 'codex' | 'builtin'>('opencode');
  const [activePack, setActivePack] = useState<'pack-leadgen-ops' | 'pack-template'>('pack-leadgen-ops');
  const [activeAssistantId, setActiveAssistantId] = useState<string>('growth-leadgen-director');
  const [activeCanvasId, setActiveCanvasId] = useState<string>('browser-radar-canvas');
  const [centerMode, setCenterMode] = useState<'chat' | 'marketplace' | 'settings'>('chat');

  const [promptInput, setPromptInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<ScheduledPostItem | null>(null);
  const [mcpStatus, setMcpStatus] = useState<string>('Idle');
  const [mismatchBanner, setMismatchBanner] = useState<{ message: string; suggestedRegion?: RegionId } | null>(null);

  // Settings form state
  const [regionApiKeyInput, setRegionApiKeyInput] = useState('');
  const [llmBaseUrl, setLlmBaseUrl] = useState('https://api.deepseek.com/v1');
  const [llmModel, setLlmModel] = useState('deepseek-chat');
  const [llmApiKeyInput, setLlmApiKeyInput] = useState('');
  const [settingsFeedback, setSettingsFeedback] = useState('');

  // Persisted data from real local API server (zero hardcoded mock data)
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [roiSummaries, setRoiSummaries] = useState<ChannelRoiSummary[]>([]);
  const [posts, setPosts] = useState<ScheduledPostItem[]>([]);
  const [sessions, setSessions] = useState<IsolatedAccountSession[]>([]);
  const [activePartition, setActivePartition] = useState('');
  const [packCount, setPackCount] = useState(0);

  const profile = PROFILES[regionId];
  const isZh = locale === 'zh-CN';

  const canvasRegistry = useMemo(() => {
    const reg = new CanvasRegistry();
    for (const c of leadgenManifest.contributes.canvases) reg.register(leadgenManifest.name, c);
    for (const c of templateManifest.contributes.canvases) reg.register(templateManifest.name, c);
    return reg;
  }, []);

  const [draft, setDraft] = useState<DraftPreviewData>({
    id: 'draft-new',
    platformId: 'tiktok',
    title: '',
    body: '',
    hashtags: [],
    ctaHook: '',
    shortLinkUrl: '',
    aspect: '9:16',
  });

  const [scoredLeads, setScoredLeads] = useState<ScoredCommentLead[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);

  const refreshData = async () => {
    try {
      const [settingsRes, leadsRes, postsRes, packsRes, accountsRes] = await Promise.all([
        fetch('/api/settings').then((r) => r.json()),
        fetch('/api/leads').then((r) => r.json()),
        fetch('/api/posts').then((r) => r.json()),
        fetch('/api/packs').then((r) => r.json()),
        fetch('/api/accounts').then((r) => r.json()),
      ]);
      if (settingsRes.activeRegion) setRegionId(settingsRes.activeRegion);
      if (settingsRes.llm?.baseUrl) setLlmBaseUrl(settingsRes.llm.baseUrl);
      if (settingsRes.llm?.model) setLlmModel(settingsRes.llm.model);
      if (Array.isArray(leadsRes.leads)) setLeads(leadsRes.leads);
      if (Array.isArray(leadsRes.roi)) setRoiSummaries(leadsRes.roi);
      if (Array.isArray(postsRes.posts)) setPosts(postsRes.posts);
      if (Array.isArray(packsRes.packs)) setPackCount(packsRes.packs.length);
      if (Array.isArray(accountsRes.accounts)) {
        setSessions(accountsRes.accounts);
        if (!activePartition && accountsRes.accounts.length > 0) {
          setActivePartition(accountsRes.accounts[0].partition);
        }
      }
    } catch {
      // Backend may be starting up
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleRegionChange = async (nextRegion: RegionId) => {
    setRegionId(nextRegion);
    setMismatchBanner(null);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeRegion: nextRegion }),
    }).catch(() => {});
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activeRegion: regionId,
        regionForKey: regionId,
        regionApiKey: regionApiKeyInput || undefined,
        llmBaseUrl,
        llmModel,
        llmApiKey: llmApiKeyInput || undefined,
      }),
    });
    if (res.ok) {
      setRegionApiKeyInput('');
      setLlmApiKeyInput('');
      setSettingsFeedback(isZh ? '✅ 已加密/持久化保存至本地 SQLite' : '✅ Saved to local SQLite store');
    }
  };

  const handleTestMcp = async () => {
    setMcpStatus('Testing...');
    const res = await fetch('/api/mcp/test', { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      setMcpStatus(`MCP Ready (${data.latencyMs}ms · ${data.data?.tools?.length ?? 0} tools)`);
      setMismatchBanner(null);
    } else {
      setMcpStatus(`MCP Error (${data.httpStatus || 'net'})`);
      if (data.regionMismatch?.isMismatch) {
        setMismatchBanner({
          message: data.regionMismatch.message[locale],
          suggestedRegion: data.regionMismatch.suggestedRegion,
        });
      }
      setSettingsFeedback(`❌ ${data.error}`);
    }
  };

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || sending) return;
    const text = promptInput.trim();
    setPromptInput('');
    setSending(true);
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, assistantId: activeAssistantId, locale }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          latencyMs: data.latencyMs,
          text: data.ok ? data.content : data.content || data.error || 'Request failed',
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: 'assistant', text: String(err) },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleAddToCalendar = async (item: DraftPreviewData) => {
    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: item.title,
        platformId: item.platformId,
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
        status: 'scheduled',
        shortLinkId: `sl-${Date.now().toString(36)}`,
      }),
    });
    await refreshData();
    setActiveCanvasId('calendar-canvas');
  };

  const handleConfirmPublish = async () => {
    if (!pendingApproval) return;
    await fetch(`/api/posts/${pendingApproval.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    });
    setPendingApproval(null);
    await refreshData();
  };

  const handleCreateAccount = async (platform: string, accountId: string, displayLabel: string) => {
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, accountId, displayLabel }),
    });
    if (res.ok) {
      const data = await res.json();
      await refreshData();
      if (data.account?.partition) setActivePartition(data.account.partition);
    }
  };

  const handleAnalyzeBrowser = async (pastedCommentsText?: string) => {
    if (window.biaomaiElectron?.isElectron) {
      const res = await window.biaomaiElectron.analyzeVisibleComments();
      if (res.ok) {
        setScoredLeads(res.scored);
        return;
      }
    }
    const lines = (pastedCommentsText || '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const res = await fetch('/api/browser/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comments: lines.map((content, idx) => ({
          commentId: `c-${Date.now()}-${idx}`,
          nickname: `Commenter_${idx + 1}`,
          content,
          likeCount: 0,
        })),
      }),
    });
    const data = await res.json();
    if (Array.isArray(data.scored)) {
      setScoredLeads(data.scored);
    }
  };

  const handleAdoptReply = async (_commentId: string, replyText: string) => {
    if (window.biaomaiElectron?.isElectron) {
      await window.biaomaiElectron.prefillReply(replyText);
    }
  };

  const handleAddLeadToCrm = async (lead: ScoredCommentLead) => {
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: profile.platforms[0]?.id ?? 'tiktok',
        sourcePostId: 'live-browser-post',
        shortLinkId: posts[0]?.shortLinkId ?? 'sl-tt-01',
        nickname: lead.comment.nickname,
        sanitizedComment: lead.comment.content,
        intentTier: lead.tier,
        intentScore: lead.intentScore,
      }),
    });
    await refreshData();
    setActiveCanvasId('lead-crm-canvas');
  };

  const handleAdvanceStage = async (leadId: string, nextStage: LeadStage) => {
    await fetch(`/api/leads/${leadId}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: nextStage, dealValue: nextStage === 'won' ? 2980 : undefined }),
    });
    await refreshData();
  };

  const toggleTheme = () => {
    const next = theme === 'lingshu-dark' ? 'lingshu-light' : 'lingshu-dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    document.body.className = next;
  };

  const visibleCanvases = canvasRegistry.listByPack(activePack);
  const currentAssistants =
    activePack === 'pack-leadgen-ops'
      ? leadgenManifest.contributes.assistants
      : templateManifest.contributes.assistants;

  return (
    <div className="bm-shell">
      <header className="bm-topbar">
        <div className="bm-topbar-left">
          <span className="bm-brand">{isZh ? '👁️ OpenGrowth AI 工作台' : '👁️ OpenGrowth Workbench'}</span>
          <select
            className="bm-select"
            aria-label="Active Pack"
            value={activePack}
            onChange={(e) => {
              const next = e.target.value as 'pack-leadgen-ops' | 'pack-template';
              setActivePack(next);
              setActiveCanvasId(next === 'pack-leadgen-ops' ? 'browser-radar-canvas' : 'sample-canvas');
            }}
          >
            <option value="pack-leadgen-ops">{isZh ? '📦 全球运营获客包 (V1.0)' : '📦 Global Lead-Gen Pack (V1.0)'}</option>
            <option value="pack-template">{isZh ? '📂 本地办公模板包 (.bmpack)' : '📂 Local Office Template (.bmpack)'}</option>
          </select>

          <select
            className="bm-select"
            aria-label="Region Profile"
            value={regionId}
            onChange={(e) => handleRegionChange(e.target.value as RegionId)}
          >
            <option value="cn-official">🇨🇳 国内版 CN (6 平台)</option>
            <option value="global-official">🌍 国际版 Global (8 平台)</option>
            <option value="self-hosted">🐳 本地 Docker 私有化</option>
          </select>

          <button type="button" className="bm-chip" onClick={() => setLocale(locale === 'zh-CN' ? 'en-US' : 'zh-CN')}>
            {locale === 'zh-CN' ? '中 / EN' : 'EN / 中'}
          </button>
        </div>

        <div className="bm-topbar-right">
          <button type="button" className="bm-badge bm-badge-success" onClick={handleTestMcp} style={{ border: 'none', cursor: 'pointer' }}>
            ● {mcpStatus}
          </button>
          <select className="bm-select" aria-label="Agent Engine" value={engine} onChange={(e) => setEngine(e.target.value as 'opencode' | 'codex' | 'builtin')}>
            <option value="opencode">OpenCode (MIT)</option>
            <option value="codex">Codex (Apache-2.0)</option>
            <option value="builtin">AionUi Built-in</option>
          </select>
          <button type="button" className="bm-chip" onClick={() => setCenterMode(centerMode === 'settings' ? 'chat' : 'settings')}>
            ⚙️ {isZh ? '设置' : 'Settings'}
          </button>
          <button type="button" className="bm-chip" onClick={toggleTheme}>
            {theme === 'lingshu-dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <div className="bm-workspace">
        <aside className="bm-sidebar">
          <button type="button" className="bm-btn-primary" onClick={() => setCenterMode('chat')}>
            {isZh ? '+ 新建获客任务' : '+ New Ops Task'}
          </button>

          <div className="bm-section-label">{isZh ? '当前包内置专家' : 'Pack Experts'}</div>
          {currentAssistants.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`bm-expert-btn ${activeAssistantId === a.id && centerMode === 'chat' ? 'bm-expert-active' : ''}`}
              onClick={() => {
                setCenterMode('chat');
                setActiveAssistantId(a.id);
                if (a.defaultCanvasId) setActiveCanvasId(a.defaultCanvasId);
              }}
            >
              <strong>{typeof a.name === 'string' ? a.name : a.name[locale]}</strong>
              <span className="bm-muted">{typeof a.description === 'string' ? a.description : a.description[locale]}</span>
            </button>
          ))}

          <div className="bm-section-label">{isZh ? '微内核平台能力' : 'Micro-Kernel'}</div>
          <button
            type="button"
            className={`bm-expert-btn ${centerMode === 'marketplace' ? 'bm-expert-active' : ''}`}
            onClick={() => setCenterMode(centerMode === 'marketplace' ? 'chat' : 'marketplace')}
          >
            <strong>🧩 {isZh ? `插件与技能市场 (${packCount})` : `Plugins & Skills (${packCount})`}</strong>
            <span className="bm-muted">{isZh ? '热插拔 .bmpack / 权限沙盒' : 'Hot-plug .bmpack / Sandbox'}</span>
          </button>
          <div className="bm-card">
            <div className="bm-section-label" style={{ marginTop: 0 }}>⏰ {isZh ? '24/7 Cron 模板' : '24/7 Cron Templates'}</div>
            {cronTemplates.templates.map((t) => (
              <div key={t.id} className="bm-muted">
                <span className="bm-mono">{t.cron}</span> · {t.name[locale]}
              </div>
            ))}
          </div>
        </aside>

        <main className="bm-chat-pane">
          {centerMode === 'settings' ? (
            <form className="bm-chat-scroll" onSubmit={handleSaveSettings}>
              <h3>⚙️ {isZh ? '区域 Relay 与大模型设置（本地 SQLite 持久化）' : 'Region Relay & LLM Settings (SQLite Persisted)'}</h3>
              <div className="bm-card">
                <label className="bm-field-label">{isZh ? `当前区域 (${profile.name[locale]}) MCP 端点` : `Active Region (${profile.name[locale]}) MCP Endpoint`}</label>
                <div className="bm-mono">{profile.mcp.httpEndpoint}</div>
                <label className="bm-field-label">{isZh ? '区域 MCP API Key（按环境独立隔离存储）' : 'Region MCP API Key (isolated per region)'}</label>
                <input className="bm-input" type="password" value={regionApiKeyInput} onChange={(e) => setRegionApiKeyInput(e.target.value)} placeholder="cn_... / gl_..." />
                <div className="bm-card-actions">
                  <button type="button" className="bm-btn-ghost" onClick={handleTestMcp}>
                    {isZh ? '🔌 测试真实 MCP 连接' : '🔌 Test Live MCP Connection'}
                  </button>
                </div>
              </div>

              <div className="bm-card">
                <label className="bm-field-label">{isZh ? '大模型 Base URL（支持 DeepSeek / OpenAI / 本地 Ollama）' : 'LLM Base URL (DeepSeek / OpenAI / Ollama)'}</label>
                <input className="bm-input" value={llmBaseUrl} onChange={(e) => setLlmBaseUrl(e.target.value)} />
                <label className="bm-field-label">{isZh ? '模型名称' : 'Model Name'}</label>
                <input className="bm-input" value={llmModel} onChange={(e) => setLlmModel(e.target.value)} />
                <label className="bm-field-label">{isZh ? '大模型 API Key' : 'LLM API Key'}</label>
                <input className="bm-input" type="password" value={llmApiKeyInput} onChange={(e) => setLlmApiKeyInput(e.target.value)} placeholder="sk-..." />
                <div className="bm-card-actions">
                  <button type="submit" className="bm-btn-primary">{isZh ? '保存配置' : 'Save Settings'}</button>
                </div>
              </div>
              {settingsFeedback && <div className="bm-banner bm-banner-success">{settingsFeedback}</div>}
            </form>
          ) : centerMode === 'marketplace' ? (
            <div className="bm-chat-scroll">
              <div className="bm-card-header">
                <h3>🧩 {isZh ? '插件与技能市场（实时磁盘热加载）' : 'Plugins & Skills Marketplace (Live Disk Loader)'}</h3>
                <button
                  type="button"
                  className="bm-btn-ghost"
                  onClick={async () => {
                    await fetch('/api/packs/reload', { method: 'POST' });
                    await refreshData();
                  }}
                >
                  {isZh ? '↻ 热重载扩展包' : '↻ Hot Reload Packs'}
                </button>
              </div>
              <div className="bm-card">
                <div className="bm-card-header">
                  <strong>{leadgenManifest.displayName[locale]}</strong>
                  <span className="bm-badge bm-badge-success">{isZh ? '已启用' : 'Enabled'}</span>
                </div>
                <p className="bm-muted">{leadgenManifest.description[locale]}</p>
                <div className="bm-muted">🛡️ browserCdp=true · Always-Ask={leadgenManifest.permissions.alwaysAskActions.join(', ')}</div>
              </div>
              <div className="bm-card">
                <div className="bm-card-header">
                  <strong>{templateManifest.displayName[locale]}</strong>
                  <span className="bm-badge bm-badge-info">Apache-2.0</span>
                </div>
                <p className="bm-muted">{templateManifest.description[locale]}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="bm-chat-scroll">
                {mismatchBanner && (
                  <div className="bm-card bm-approval-card">
                    <strong>⚠️ {mismatchBanner.message}</strong>
                    {mismatchBanner.suggestedRegion && (
                      <button type="button" className="bm-btn-primary" onClick={() => handleRegionChange(mismatchBanner.suggestedRegion!)}>
                        {isZh ? `一键切换至 ${mismatchBanner.suggestedRegion}` : `Switch to ${mismatchBanner.suggestedRegion}`}
                      </button>
                    )}
                  </div>
                )}

                {pendingApproval && (
                  <div className="bm-card bm-approval-card">
                    <strong>🛡️ {isZh ? '人工确认审批门禁（Always-Ask）' : 'Human-in-the-Loop Approval Required'}</strong>
                    <div className="bm-muted">{pendingApproval.title} ({pendingApproval.platformId})</div>
                    <div className="bm-card-actions">
                      <button type="button" className="bm-btn-ghost" onClick={() => setPendingApproval(null)}>{isZh ? '取消' : 'Cancel'}</button>
                      <button type="button" className="bm-btn-primary" onClick={handleConfirmPublish}>{isZh ? '确认执行发布' : 'Confirm Publish'}</button>
                    </div>
                  </div>
                )}

                {messages.map((m) => (
                  <div key={m.id} className="bm-card">
                    <div className="bm-card-header">
                      <span className="bm-badge bm-badge-info">{m.role === 'user' ? '👤 Operator' : '🤖 Expert'}</span>
                      {m.latencyMs && <span className="bm-mono">{m.latencyMs}ms</span>}
                    </div>
                    <p className="bm-comment-text" style={{ whiteSpace: 'pre-wrap' }}>{m.text}</p>
                  </div>
                ))}
              </div>

              <form className="bm-composer" onSubmit={handleSendPrompt}>
                <div className="bm-composer-row">
                  <input
                    className="bm-input"
                    style={{ flex: 1 }}
                    placeholder={isZh ? '输入真实获客指令（将自动加载专家 SKILL.zh.md 调用 LLM）...' : 'Enter lead-gen prompt (loads expert SKILL.en.md)...'}
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                  />
                  <button type="submit" className="bm-btn-primary" disabled={sending}>
                    {sending ? '...' : isZh ? '发送' : 'Send'}
                  </button>
                </div>
              </form>
            </>
          )}
        </main>

        <section className="bm-canvas-pane">
          <div className="bm-canvas-tabs">
            {visibleCanvases.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`bm-chip ${activeCanvasId === c.id ? 'bm-chip-active' : ''}`}
                onClick={() => setActiveCanvasId(c.id)}
              >
                {c.title[locale]}
              </button>
            ))}
          </div>

          {activeCanvasId === 'preview-canvas' && (
            <PreviewCanvas locale={locale} profile={profile} draft={draft} onDraftChange={setDraft} onAddToCalendar={handleAddToCalendar} />
          )}
          {activeCanvasId === 'calendar-canvas' && (
            <CalendarCanvas locale={locale} profile={profile} posts={posts} onRequestPublishApproval={setPendingApproval} />
          )}
          {activeCanvasId === 'browser-radar-canvas' && (
            <BrowserRadarCanvas
              locale={locale}
              profile={profile}
              sessions={sessions}
              activePartition={activePartition}
              onSelectPartition={setActivePartition}
              onCreateAccount={handleCreateAccount}
              scoredLeads={scoredLeads}
              onAnalyzeCurrentPage={handleAnalyzeBrowser}
              onAdoptReply={handleAdoptReply}
              onAddLeadToCrm={handleAddLeadToCrm}
            />
          )}
          {activeCanvasId === 'lead-crm-canvas' && (
            <LeadCRMCanvas
              locale={locale}
              profile={profile}
              leads={leads}
              roiSummaries={roiSummaries}
              onAdvanceStage={handleAdvanceStage}
              onExportCsv={() => window.open('/api/leads/export.csv', '_blank')}
            />
          )}
          {activeCanvasId === 'sample-canvas' && <SampleCanvas locale={locale} />}
        </section>
      </div>
    </div>
  );
};
