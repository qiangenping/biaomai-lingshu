import React, { useMemo, useState } from 'react';
import {
  CanvasRegistry,
  type Locale,
  type RegionId,
  type RegionProfile,
} from '@biaomai/plugin-sdk';
import {
  IsolatedSessionManager,
  scoreExtractedComments,
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
import { LeadCrmStore, type LeadStage } from '../../../packs/pack-leadgen-ops/core/lead-crm-store';
import { computeChannelRoi } from '../../../packs/pack-leadgen-ops/core/attribution-service';

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
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [pendingApproval, setPendingApproval] = useState<ScheduledPostItem | null>(null);

  const profile = PROFILES[regionId];
  const isZh = locale === 'zh-CN';

  // Dynamic CanvasRegistry populated from active packs
  const canvasRegistry = useMemo(() => {
    const reg = new CanvasRegistry();
    for (const c of leadgenManifest.contributes.canvases) {
      reg.register(leadgenManifest.name, c);
    }
    for (const c of templateManifest.contributes.canvases) {
      reg.register(templateManifest.name, c);
    }
    return reg;
  }, []);

  // Multi-account isolated browser sessions
  const sessionMgr = useMemo(() => {
    const mgr = new IsolatedSessionManager(19220);
    mgr.createOrGet('xiaohongshu', 'brand-main', 'RedNote Brand Main');
    mgr.createOrGet('tiktok', 'us-01', 'TikTok Global US-01');
    mgr.createOrGet('linkedin', 'b2b-founder', 'LinkedIn B2B Founder');
    return mgr;
  }, []);
  const sessions = sessionMgr.listSessions();
  const [activePartition, setActivePartition] = useState(sessions[0].partition);

  // Lead CRM Store
  const [crmVersion, setCrmVersion] = useState(0);
  const crmStore = useMemo(() => {
    const store = new LeadCrmStore();
    const seed = store.addLead({
      platform: 'tiktok',
      sourcePostId: 'post-global-01',
      shortLinkId: 'sl-tt-01',
      nickname: 'GlobalSaaS_Buyer',
      sanitizedComment: 'How much for the enterprise self-hosted license?',
      intentTier: 'S',
      intentScore: 95,
    });
    store.updateStage(seed.id, 'opportunity', 4900);
    return store;
  }, []);

  const [draft, setDraft] = useState<DraftPreviewData>({
    id: 'draft-1',
    platformId: 'tiktok',
    title: 'How 1 Person Runs 14 Global Channels with Open-Source AI',
    body: 'Stop switching 14 browser tabs. Our Apache-2.0 workbench unifies Create, Publish, AI Browser Intent Radar, and Lead CRM.',
    hashtags: ['AILeadGen', 'OpenSource', 'BiaoMaiLingshu'],
    ctaHook: 'Grab the free repo',
    shortLinkUrl: 'https://bm.link/sl-tt-01',
    aspect: '9:16',
  });

  const [posts, setPosts] = useState<ScheduledPostItem[]>([
    {
      id: 'pub-1',
      title: 'Global AI Lead-Gen Launch Demo',
      platformId: 'tiktok',
      scheduledAt: '2026-11-26 09:00 UTC',
      status: 'scheduled',
      shortLinkId: 'sl-tt-01',
    },
    {
      id: 'pub-2',
      title: 'Why Enterprises Need Micro-Kernel AI Workbenches',
      platformId: 'linkedin',
      scheduledAt: '2026-11-26 14:00 UTC',
      status: 'draft',
      shortLinkId: 'sl-li-02',
    },
  ]);

  const [scoredLeads, setScoredLeads] = useState<ScoredCommentLead[]>(() =>
    scoreExtractedComments([
      {
        commentId: 'c-101',
        nickname: 'OpsLead_CN',
        content: '请问私有化部署怎么收费？加我微信 wx_demo99 发一份报价',
        likeCount: 14,
        profileUrl: 'https://example.com/private-uid',
      },
      {
        commentId: 'c-102',
        nickname: 'IndieMaker_US',
        content: 'Does it support TikTok and LinkedIn with our own OpenCode model?',
        likeCount: 8,
      },
    ]),
  );

  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'm1',
      role: 'assistant',
      text: '欢迎来到标脉灵枢 AI 工作台（Apache-2.0 微内核 + 全球运营获客包）。请下达获客指令，或点击右侧画布体验内置隔离浏览器意向雷达与线索 CRM。',
    },
    {
      id: 'm2',
      role: 'mcp',
      toolName: 'aitoearn-unified:list_channels',
      latencyMs: 42,
      text: 'Connected to active region profile MCP endpoint cleanly.',
    },
  ]);

  const toggleTheme = () => {
    const next = theme === 'lingshu-dark' ? 'lingshu-light' : 'lingshu-dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    document.body.className = next;
  };

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    const text = promptInput.trim();
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', text },
      {
        id: `mcp-${Date.now() + 1}`,
        role: 'mcp',
        toolName: `${engine} -> aitoearn-unified:create_leadgen_draft`,
        latencyMs: 318,
        text: isZh ? '已生成获客草稿并同步到右侧预览画布。' : 'Generated lead-gen draft and synced to Preview Canvas.',
      },
    ]);
    setPromptInput('');
  };

  const handleAddToCalendar = (item: DraftPreviewData) => {
    const nextPost: ScheduledPostItem = {
      id: `pub-${Date.now()}`,
      title: item.title,
      platformId: item.platformId,
      scheduledAt: '2026-11-27 09:00 UTC',
      status: 'scheduled',
      shortLinkId: 'sl-new-01',
    };
    setPosts((prev) => [nextPost, ...prev]);
    setActiveCanvasId('calendar-canvas');
  };

  const handleConfirmPublish = () => {
    if (!pendingApproval) return;
    setPosts((prev) =>
      prev.map((p) => (p.id === pendingApproval.id ? { ...p, status: 'published' } : p)),
    );
    setPendingApproval(null);
  };

  const handleAddLeadToCrm = (lead: ScoredCommentLead) => {
    crmStore.addLead({
      platform: profile.platforms[0]?.id ?? 'tiktok',
      sourcePostId: 'live-browser-post',
      shortLinkId: 'sl-tt-01',
      nickname: lead.comment.nickname,
      sanitizedComment: lead.comment.content,
      intentTier: lead.tier,
      intentScore: lead.intentScore,
    });
    setCrmVersion((v) => v + 1);
    setActiveCanvasId('lead-crm-canvas');
  };

  const handleAdvanceStage = (leadId: string, nextStage: LeadStage) => {
    crmStore.updateStage(leadId, nextStage, nextStage === 'won' ? 2980 : undefined);
    setCrmVersion((v) => v + 1);
  };

  const currentLeads = useMemo(() => crmStore.listByStage(), [crmStore, crmVersion]);
  const roiSummaries = useMemo(
    () =>
      computeChannelRoi(
        [
          { shortLinkId: 'sl-tt-01', platform: 'tiktok', postTitle: 'Global AI Demo', clicks: 540 },
          { shortLinkId: 'sl-li-02', platform: 'linkedin', postTitle: 'Enterprise Micro-Kernel', clicks: 210 },
        ],
        currentLeads,
      ),
    [currentLeads],
  );

  const visibleCanvases = canvasRegistry.listByPack(activePack);
  const currentAssistants =
    activePack === 'pack-leadgen-ops'
      ? leadgenManifest.contributes.assistants
      : templateManifest.contributes.assistants;

  return (
    <div className="bm-shell">
      <header className="bm-topbar">
        <div className="bm-topbar-left">
          <span className="bm-brand">{isZh ? '👁️ 标脉灵枢 AI 工作台' : '👁️ BiaoMai Lingshu Workbench'}</span>
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
            onChange={(e) => setRegionId(e.target.value as RegionId)}
          >
            <option value="cn-official">🇨🇳 国内版 CN (6 平台)</option>
            <option value="global-official">🌍 国际版 Global (8 平台)</option>
            <option value="self-hosted">🐳 本地 Docker 私有化</option>
          </select>

          <button
            type="button"
            className="bm-chip"
            onClick={() => setLocale(locale === 'zh-CN' ? 'en-US' : 'zh-CN')}
          >
            {locale === 'zh-CN' ? '中 / EN' : 'EN / 中'}
          </button>
        </div>

        <div className="bm-topbar-right">
          <span className="bm-badge bm-badge-success">● MCP Ready (42ms)</span>
          <select
            className="bm-select"
            aria-label="Agent Engine"
            value={engine}
            onChange={(e) => setEngine(e.target.value as 'opencode' | 'codex' | 'builtin')}
          >
            <option value="opencode">OpenCode (MIT)</option>
            <option value="codex">Codex (Apache-2.0)</option>
            <option value="builtin">AionUi Built-in</option>
          </select>
          <button type="button" className="bm-chip" onClick={toggleTheme}>
            {theme === 'lingshu-dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <div className="bm-workspace">
        <aside className="bm-sidebar">
          <button
            type="button"
            className="bm-btn-primary"
            onClick={() => setShowMarketplace(false)}
          >
            {isZh ? '+ 新建获客任务' : '+ New Ops Task'}
          </button>

          <div className="bm-section-label">{isZh ? '当前包内置专家' : 'Pack Experts'}</div>
          {currentAssistants.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`bm-expert-btn ${activeAssistantId === a.id && !showMarketplace ? 'bm-expert-active' : ''}`}
              onClick={() => {
                setShowMarketplace(false);
                setActiveAssistantId(a.id);
                if (a.defaultCanvasId) setActiveCanvasId(a.defaultCanvasId);
              }}
            >
              <strong>{typeof a.name === 'string' ? a.name : a.name[locale]}</strong>
              <span className="bm-muted">
                {typeof a.description === 'string' ? a.description : a.description[locale]}
              </span>
            </button>
          ))}

          <div className="bm-section-label">{isZh ? '微内核平台能力' : 'Micro-Kernel'}</div>
          <button
            type="button"
            className={`bm-expert-btn ${showMarketplace ? 'bm-expert-active' : ''}`}
            onClick={() => setShowMarketplace((s) => !s)}
          >
            <strong>🧩 {isZh ? '插件与技能市场' : 'Plugins & Skills Market'}</strong>
            <span className="bm-muted">{isZh ? '热插拔 .bmpack / 权限沙盒' : 'Hot-plug .bmpack / Sandbox'}</span>
          </button>
          <div className="bm-card">
            <div className="bm-section-label" style={{ marginTop: 0 }}>
              ⏰ {isZh ? '24/7 Cron 模板' : '24/7 Cron Templates'}
            </div>
            {cronTemplates.templates.map((t) => (
              <div key={t.id} className="bm-muted">
                <span className="bm-mono">{t.cron}</span> · {t.name[locale]}
              </div>
            ))}
          </div>
        </aside>

        <main className="bm-chat-pane">
          {showMarketplace ? (
            <div className="bm-chat-scroll">
              <h3>🧩 {isZh ? '插件与技能市场（对标 WorkBuddy 开放生态）' : 'Plugins & Skills Marketplace'}</h3>
              <div className="bm-card">
                <div className="bm-card-header">
                  <strong>{leadgenManifest.displayName[locale]}</strong>
                  <span className="bm-badge bm-badge-success">{isZh ? '已启用' : 'Enabled'}</span>
                </div>
                <p className="bm-muted">{leadgenManifest.description[locale]}</p>
                <div className="bm-muted">
                  🛡️ Permissions: browserCdp=true · domains={leadgenManifest.permissions.netDomains.join(', ')} · Always-Ask={leadgenManifest.permissions.alwaysAskActions.join(', ')}
                </div>
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
                {pendingApproval && (
                  <div className="bm-card bm-approval-card">
                    <strong>🛡️ {isZh ? '人工确认审批门禁（Always-Ask）' : 'Human-in-the-Loop Approval Required'}</strong>
                    <div className="bm-muted">
                      {isZh ? '即将发布：' : 'Ready to publish: '} {pendingApproval.title} ({pendingApproval.platformId})
                    </div>
                    <div className="bm-card-actions">
                      <button type="button" className="bm-btn-ghost" onClick={() => setPendingApproval(null)}>
                        {isZh ? '取消' : 'Cancel'}
                      </button>
                      <button type="button" className="bm-btn-primary" onClick={handleConfirmPublish}>
                        {isZh ? '确认执行发布' : 'Confirm Publish'}
                      </button>
                    </div>
                  </div>
                )}

                {messages.map((m) => (
                  <div key={m.id} className="bm-card">
                    <div className="bm-card-header">
                      <span className="bm-badge bm-badge-info">
                        {m.role === 'mcp' ? `🔧 MCP · ${m.toolName}` : m.role === 'user' ? '👤 Operator' : '🤖 Expert'}
                      </span>
                      {m.latencyMs && <span className="bm-mono">{m.latencyMs}ms</span>}
                    </div>
                    <p className="bm-comment-text">{m.text}</p>
                  </div>
                ))}
              </div>

              <form className="bm-composer" onSubmit={handleSendPrompt}>
                <div className="bm-composer-row">
                  <input
                    className="bm-input"
                    style={{ flex: 1 }}
                    placeholder={isZh ? '输入获客指令，支持 / 唤起技能...' : 'Enter lead-gen goal, use / for skills...'}
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                  />
                  <button type="submit" className="bm-btn-primary">
                    {isZh ? '发送' : 'Send'}
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
            <PreviewCanvas
              locale={locale}
              profile={profile}
              draft={draft}
              onDraftChange={setDraft}
              onAddToCalendar={handleAddToCalendar}
            />
          )}
          {activeCanvasId === 'calendar-canvas' && (
            <CalendarCanvas
              locale={locale}
              profile={profile}
              posts={posts}
              onRequestPublishApproval={setPendingApproval}
            />
          )}
          {activeCanvasId === 'browser-radar-canvas' && (
            <BrowserRadarCanvas
              locale={locale}
              profile={profile}
              sessions={sessions}
              activePartition={activePartition}
              onSelectPartition={setActivePartition}
              scoredLeads={scoredLeads}
              onAnalyzeCurrentPage={() => setScoredLeads((prev) => [...prev])}
              onAdoptReply={() => {}}
              onAddLeadToCrm={handleAddLeadToCrm}
            />
          )}
          {activeCanvasId === 'lead-crm-canvas' && (
            <LeadCRMCanvas
              locale={locale}
              profile={profile}
              leads={currentLeads}
              roiSummaries={roiSummaries}
              onAdvanceStage={handleAdvanceStage}
              onExportCsv={() => {
                const csv = crmStore.exportCsv();
                console.info('Exported CSV rows:', csv.split('\n').length - 1);
              }}
            />
          )}
          {activeCanvasId === 'sample-canvas' && <SampleCanvas locale={locale} />}
        </section>
      </div>
    </div>
  );
};
