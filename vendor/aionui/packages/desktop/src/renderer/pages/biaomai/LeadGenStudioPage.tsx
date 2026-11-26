/**
 * @license
 * Copyright 2026 BiaoMai Lingshu Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { crawlerProspects, mergeProspects } from './prospect-import';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './flat-buttons.css';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Message, Modal, Select } from '@arco-design/web-react';
import {
  IconClockCircle,
  IconQuestionCircle,
  IconSettings,
} from '@arco-design/web-react/icon';
import {
  ALL_PLATFORMS,
  type AnalyzedComment,
  getBridge,
  type GlobalProspect,
  INDUSTRY_PRESETS,
  type InstalledPack,
  KEYS,
  nextEmailDraft,
  type LeadStage,
  type LocalAccount,
  type LocalLead,
  type LocalPost,
  type OutreachStep,
  readJson,
  sanitizePii,
  scoreComment,
  type StudioSettings,
} from './types';
import { CreateStudioTab } from './components/CreateStudioTab';
import { OmniPublishTab } from './components/OmniPublishTab';
import { IntentRadarTab } from './components/IntentRadarTab';
import { ProspectorOutboundTab } from './components/ProspectorOutboundTab';
import { LeadCrmTab } from './components/LeadCrmTab';
import { PacksMarketTab } from './components/PacksMarketTab';
import { StudioModals } from './components/StudioModals';

const studioSections = [
  ['create', '内容创作', 'Content'],
  ['publish', '渠道发布', 'Publishing'],
  ['engage', '意向雷达', 'Intent radar'],
  ['outbound', '企业寻客', 'Prospecting'],
  ['crm', '线索管理', 'Lead CRM'],
  ['packs', '插件中心', 'Extensions'],
] as const;

const LeadGenStudioPage: React.FC = () => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isZh = (i18n.language || 'zh-CN').startsWith('zh');
  const bridge = getBridge();

  const requestedTab = new URLSearchParams(location.search).get('tab');
  const activeTab = studioSections.find(([id]) => id === requestedTab)?.[0] ?? 'create';
  const setActiveTab = (tab: typeof activeTab) => {
    void navigate(`/leadgen?tab=${tab}`, { replace: true });
  };
  const [industryId, setIndustryId] = useState<string>('foreign-trade');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [cronModalOpen, setCronModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  const [settings, setSettings] = useState<StudioSettings>(() =>
    readJson<StudioSettings>(KEYS.settings, {
      region: 'cn',
      llmBaseUrl: 'https://api.deepseek.com/v1',
      llmModel: 'deepseek-chat',
      llmApiKey: '',
      imageBaseUrl: 'https://api.openai.com/v1',
      imageModel: 'gpt-image-1',
      imageApiKey: '',
      cnMcpKey: '',
      globalMcpKey: '',
      customMcpUrl: 'http://localhost:8080/api/unified/mcp',
      smtpHost: 'smtp.163.com',
      smtpPort: 465,
      smtpUser: '',
      smtpPass: '',
      imapHost: 'imap.163.com',
      imapPort: 993,
      imWebhookUrl: '',
      crawlerMcpUrl: 'http://localhost:11235/crawl',
    })
  );
  const [mcpTestMsg, setMcpTestMsg] = useState('');
  const [cronEnabled, setCronEnabled] = useState(() => readJson('biaomai.daily.enabled', false));
  const [dbReady, setDbReady] = useState(false);

  const [regionFilter, setRegionFilter] = useState<'all' | 'cn' | 'global'>('all');
  const [accounts, setAccounts] = useState<LocalAccount[]>(() => readJson<LocalAccount[]>(KEYS.accounts, []));
  const [posts, setPosts] = useState<LocalPost[]>(() => readJson<LocalPost[]>(KEYS.posts, []));
  const [leads, setLeads] = useState<LocalLead[]>(() => readJson<LocalLead[]>(KEYS.leads, []));
  const [prospects, setProspects] = useState<GlobalProspect[]>(() => readJson<GlobalProspect[]>(KEYS.prospects, []));

  // Create State
  const [createPlatform, setCreatePlatform] = useState('xiaohongshu');
  const [topicInput, setTopicInput] = useState('');
  const [targetLang, setTargetLang] = useState<'zh-CN' | 'en-US' | 'ja-JP' | 'es-ES'>('zh-CN');
  const [creatingCopy, setCreatingCopy] = useState(false);
  const [creatingImg, setCreatingImg] = useState(false);
  const [creatingVideo, setCreatingVideo] = useState(false);
  const [videoTaskProgress, setVideoTaskProgress] = useState(0);
  const [videoTaskStatus, setVideoTaskStatus] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftImageUrl, setDraftImageUrl] = useState('');
  const [draftVideoUrl, setDraftVideoUrl] = useState('');
  const [draftShortLink, setDraftShortLink] = useState('');
  const [scheduledTime, setScheduledTime] = useState('2026-11-26 09:00');

  // Accounts & Radar State
  const [accPlatform, setAccPlatform] = useState('xiaohongshu');
  const [accLabel, setAccLabel] = useState('');
  const [selectedPartition, setSelectedPartition] = useState(() => accounts[0]?.partition || '');
  const [radarPlatform, setRadarPlatform] = useState('xiaohongshu');
  const [rawCommentInput, setRawCommentInput] = useState('');
  const [analyzedList, setAnalyzedList] = useState<AnalyzedComment[]>([]);
  const [extractingFormula, setExtractingFormula] = useState(false);
  const [scoringWithLlm, setScoringWithLlm] = useState(false);
  const [extractedFormula, setExtractedFormula] = useState<{ title: string; url: string; excerpt: string } | null>(null);

  // Outbound State
  const [b2bMode, setB2bMode] = useState<'global' | 'cn'>('cn');
  const [cnCompanyInput, setCnCompanyInput] = useState('');
  const [lookingUpCn, setLookingUpCn] = useState(false);
  const [crawlTarget, setCrawlTarget] = useState('');
  const [b2bIndustry, setB2bIndustry] = useState('CNC Machining & Industrial Parts');
  const [b2bCountry, setB2bCountry] = useState('Germany');
  const [b2bLang, setB2bLang] = useState('en-US');
  const [extractingB2b, setExtractingB2b] = useState(false);
  const [enrichingId, setEnrichingId] = useState('');
  const [draftingOutreachId, setDraftingOutreachId] = useState('');
  const [sendingEmailId, setSendingEmailId] = useState('');
  const [checkingImap, setCheckingImap] = useState(false);
  const [crawlingMcp, setCrawlingMcp] = useState(false);
  const [syncingCrm, setSyncingCrm] = useState(false);
  const [openMotionRunning, setOpenMotionRunning] = useState(false);
  const [openMotionBusy, setOpenMotionBusy] = useState(false);

  const refreshOpenMotionStatus = useCallback(async () => {
    if (!bridge?.openMotionStudioControl) return;
    const res = await bridge.openMotionStudioControl({ action: 'status' });
    if (res?.ok) setOpenMotionRunning(res.running);
  }, [bridge]);

  useEffect(() => {
    if (activeTab === 'packs') void refreshOpenMotionStatus();
  }, [activeTab, refreshOpenMotionStatus]);

  // Packs State
  const [installedPacks, setInstalledPacks] = useState<InstalledPack[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(false);

  const refreshInstalledPacks = async () => {
    if (!bridge?.listInstalledPacks) return;
    setLoadingPacks(true);
    const res = await bridge.listInstalledPacks();
    setLoadingPacks(false);
    if (res.ok) setInstalledPacks(res.packs || []);
  };

  useEffect(() => {
    void refreshInstalledPacks();
    const hydrateFromMainDb = async () => {
      if (!bridge?.dbGetAll) return;
      const res = await bridge.dbGetAll();
      if (!res.ok || !res.db) throw new Error('Local database unavailable');
      if (Array.isArray(res.db.accounts) && res.db.accounts.length > 0) setAccounts(res.db.accounts as LocalAccount[]);
      if (Array.isArray(res.db.posts) && res.db.posts.length > 0) setPosts(res.db.posts as LocalPost[]);
      if (Array.isArray(res.db.leads) && res.db.leads.length > 0) setLeads(res.db.leads as LocalLead[]);
      if (Array.isArray(res.db.prospects) && res.db.prospects.length > 0) setProspects(res.db.prospects as GlobalProspect[]);
    };
    void hydrateFromMainDb().then(() => setDbReady(true)).catch(() => Message.error(isZh ? '本地数据库读取失败' : 'Local database read failed'));
  }, []);

  useEffect(() => {
    if (!dbReady) return;
    localStorage.setItem(KEYS.accounts, JSON.stringify(accounts));
    void bridge?.dbSaveCollection?.({ collection: 'accounts', items: accounts });
  }, [accounts, dbReady]);
  useEffect(() => {
    if (!dbReady) return;
    localStorage.setItem(KEYS.posts, JSON.stringify(posts));
    void bridge?.dbSaveCollection?.({ collection: 'posts', items: posts });
  }, [posts, dbReady]);
  useEffect(() => {
    if (!dbReady) return;
    localStorage.setItem(KEYS.leads, JSON.stringify(leads));
    void bridge?.dbSaveCollection?.({ collection: 'leads', items: leads });
  }, [leads, dbReady]);
  useEffect(() => {
    if (!dbReady) return;
    localStorage.setItem(KEYS.prospects, JSON.stringify(prospects));
    void bridge?.dbSaveCollection?.({ collection: 'prospects', items: prospects });
  }, [prospects, dbReady]);
  useEffect(() => localStorage.setItem(KEYS.settings, JSON.stringify(settings)), [settings]);

  const activeMcpEndpoint =
    settings.region === 'cn' ? 'https://aitoearn.cn/api/unified/mcp' : settings.region === 'global' ? 'https://aitoearn.ai/api/unified/mcp' : settings.customMcpUrl;
  const activeMcpKey = settings.region === 'cn' ? settings.cnMcpKey : settings.globalMcpKey;
  const visiblePlatforms = useMemo(() => (regionFilter === 'all' ? ALL_PLATFORMS : ALL_PLATFORMS.filter((p) => p.region === regionFilter)), [regionFilter]);
  const selectedCreatePlatform = ALL_PLATFORMS.find((p) => p.id === createPlatform) || ALL_PLATFORMS[0];

  const handleIndustryChange = (id: string) => {
    setIndustryId(id);
    const preset = INDUSTRY_PRESETS.find((x) => x.id === id);
    if (!preset) return;
    setB2bIndustry(preset.defaultB2bIndustry);
    setB2bCountry(preset.defaultCountry);
    setB2bMode(preset.defaultCountry === 'CN' ? 'cn' : 'global');
    setTopicInput(isZh ? preset.defaultPitchZh : preset.defaultPitchEn);
    Message.success(isZh ? `已切换至「${preset.nameZh}」获客场景` : `Switched to ${preset.nameEn}`);
  };

  const handleAiGenerateCopy = async () => {
    if (!topicInput.trim()) return Message.warning(isZh ? '请输入产品卖点或获客主题' : 'Enter a topic first');
    if (!settings.llmApiKey && !settings.llmBaseUrl.includes('localhost') && !settings.llmBaseUrl.includes('127.0.0.1')) {
      setSettingsModalOpen(true);
      return Message.info(isZh ? '请先配置大模型 API Key' : 'Configure LLM API Key first');
    }
    if (!bridge?.runLlm) return;
    setCreatingCopy(true);
    const platName = isZh ? selectedCreatePlatform.nameZh : selectedCreatePlatform.nameEn;
    const res = await bridge.runLlm({
      baseUrl: settings.llmBaseUrl,
      apiKey: settings.llmApiKey,
      model: settings.llmModel,
      systemPrompt: `You are an expert social media lead-generation copywriter. Output strict JSON with keys "title", "body", "cta". Target platform: ${platName} (aspect ${selectedCreatePlatform.aspect}). Output language: ${targetLang}.`,
      userPrompt: topicInput.trim(),
    });
    setCreatingCopy(false);
    if (!res.ok || !res.content) return Message.error(res.error || 'LLM request failed');
    try {
      const parsed = JSON.parse(res.content.replace(/```json\s*|```/g, '').trim()) as { title?: string; body?: string; cta?: string };
      setDraftTitle(parsed.title || topicInput.trim());
      setDraftBody(`${parsed.body || res.content}${parsed.cta ? `\n\n${parsed.cta}` : ''}`.trim());
    } catch {
      const lines = res.content.split('\n').filter(Boolean);
      setDraftTitle(lines[0]?.replace(/^#+\s*/, '') || topicInput.trim());
      setDraftBody(lines.slice(1).join('\n') || res.content);
    }
    Message.success(isZh ? `AI 创作完成 (${res.latencyMs}ms)` : `Generated in ${res.latencyMs}ms`);
  };

  const handleAiGenerateImage = async () => {
    const prompt = draftTitle || topicInput;
    if (!prompt.trim()) return Message.warning(isZh ? '请先输入主题或生成标题' : 'Enter a topic first');
    const key = settings.imageApiKey || settings.llmApiKey;
    if (!key) {
      setSettingsModalOpen(true);
      return Message.info(isZh ? '请先配置生图 API Key' : 'Configure Image API Key');
    }
    if (!bridge?.generateImage) return;
    setCreatingImg(true);
    const res = await bridge.generateImage({
      baseUrl: settings.imageBaseUrl,
      apiKey: key,
      model: settings.imageModel,
      prompt: `Clean modern commercial social media cover visual for ${selectedCreatePlatform.nameEn}: ${prompt}`,
    });
    setCreatingImg(false);
    if (res.ok && res.imageUrl) {
      setDraftImageUrl(res.imageUrl);
      Message.success(isZh ? 'AI 配图生成成功' : 'AI visual generated');
    } else {
      Message.error(res.error || 'Image generation failed');
    }
  };

  const handleAiGenerateVideo = async () => {
    const prompt = draftTitle || topicInput;
    if (!prompt.trim()) return Message.warning(isZh ? '请先输入主题或生成文案' : 'Enter a topic first');
    if (!activeMcpKey) {
      setSettingsModalOpen(true);
      return Message.info(isZh ? 'AI 视频生成需配置 AiToEarn MCP Key' : 'Configure AiToEarn MCP Key');
    }
    if (!bridge?.callAiToEarnMcp) return;
    setCreatingVideo(true);
    setVideoTaskProgress(30);
    setVideoTaskStatus(isZh ? '正在提交 AI 视频任务...' : 'Submitting video task...');
    const res = await bridge.callAiToEarnMcp({
      endpoint: activeMcpEndpoint,
      apiKey: activeMcpKey,
      method: 'tools/call',
      params: { name: targetLang !== 'zh-CN' ? 'translate_video' : 'video_generation', arguments: { prompt: `${prompt}\n${draftBody}`.slice(0, 600), language: targetLang, aspectRatio: selectedCreatePlatform.aspect } },
    });
    if (!res.ok) {
      setCreatingVideo(false);
      setVideoTaskProgress(0);
      setVideoTaskStatus('');
      return Message.error(res.error || 'Video task failed');
    }
    const payload = (res.data ?? {}) as Record<string, unknown>;
    const directUrl = typeof payload.videoUrl === 'string' ? payload.videoUrl : typeof payload.url === 'string' ? payload.url : '';
    if (directUrl) {
      setDraftVideoUrl(directUrl);
      setVideoTaskProgress(100);
      setVideoTaskStatus(isZh ? '视频已生成就绪' : 'Video ready');
    } else {
      setVideoTaskProgress(100);
      setVideoTaskStatus(isZh ? '任务已受理，请在 AiToEarn 查看' : 'Task accepted');
    }
    setCreatingVideo(false);
  };

  const handleGenerateOpenMotion = async () => {
    const prompt = draftTitle || topicInput;
    if (!prompt.trim()) return Message.warning(isZh ? '请先输入主题或生成文案' : 'Enter a topic first');
    if (!bridge?.generateOpenMotionVideo) return;
    setCreatingVideo(true);
    setVideoTaskProgress(45);
    setVideoTaskStatus(isZh ? '正在生成 OpenMotion 分镜与动效工程...' : 'Generating OpenMotion project...');
    try {
      const res = await bridge.generateOpenMotionVideo({
        title: draftTitle || prompt.slice(0, 36),
        body: draftBody || topicInput,
        platformName: isZh ? selectedCreatePlatform.nameZh : selectedCreatePlatform.nameEn,
        aspect: selectedCreatePlatform.aspect,
        brandColor: selectedCreatePlatform.brandColor,
        language: targetLang,
      });
      if (!res.ok) return Message.error(res.error || 'OpenMotion failed');
      setVideoTaskProgress(100);
      setVideoTaskStatus(
        isZh
          ? `OpenMotion 动效工程已生成 (${res.mode === 'server' ? '已同步本地 Studio' : 'HTML5 动效预览'}): ${res.projectDir}`
          : `OpenMotion project ready (${res.mode}): ${res.projectDir}`
      );
      if (!draftBody.trim()) setDraftBody(res.motionMd);
      await handleOpenIsolatedWindow('biaomai-openmotion', res.previewUrl, 'OpenMotion Video Studio');
      Message.success(isZh ? '已生成 Motion.md 并打开动效预览窗口' : 'Generated Motion.md & opened preview');
    } finally {
      setCreatingVideo(false);
    }
  };

  const handleSaveToSchedule = () => {
    if (!draftTitle.trim()) return Message.warning(isZh ? '请先输入或生成标题' : 'Enter a title first');
    const newPost: LocalPost = {
      id: `post_${Date.now()}`,
      platformId: createPlatform,
      title: draftTitle.trim(),
      body: draftBody.trim(),
      imageUrl: draftImageUrl || undefined,
      videoUrl: draftVideoUrl || undefined,
      shortLinkUrl: draftShortLink.trim() || undefined,
      clicks: 0,
      scheduledAt: scheduledTime,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) => [newPost, ...prev]);
    setActiveTab('publish');
    Message.success(isZh ? '已加入排期日历' : 'Added to Calendar');
  };

  const handleOpenIsolatedWindow = async (partition: string, url: string, label: string) => {
    if (bridge?.openIsolatedBrowser) {
      await bridge.openIsolatedBrowser({ partition, url, title: `标脉隔离浏览器 · ${label}` });
      setSelectedPartition(partition);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAddAccount = () => {
    if (!accLabel.trim()) return Message.warning(isZh ? '请输入账号备注名' : 'Enter account label');
    const id = `acc_${Date.now()}`;
    const partition = `persist:bm-acc-${accPlatform}-${id}`;
    setAccounts((prev) => [{ id, platformId: accPlatform, label: accLabel.trim(), partition, createdAt: new Date().toISOString() }, ...prev]);
    setSelectedPartition(partition);
    setAccLabel('');
    Message.success(isZh ? '已创建独立隔离账号' : 'Created isolated account');
  };

  const handleConfirmPublish = (post: LocalPost) => {
    const plat = ALL_PLATFORMS.find((p) => p.id === post.platformId);
    Modal.confirm({
      title: isZh ? '人工确认发布（合规门禁）' : 'Human-in-the-Loop Publish Confirmation',
      content: isZh ? `即将发布到「${plat?.nameZh ?? post.platformId}」：${post.title}` : `Publish to "${plat?.nameEn ?? post.platformId}": ${post.title}`,
      okText: isZh ? '确认发布' : 'Confirm Publish',
      cancelText: isZh ? '取消' : 'Cancel',
      onOk: async () => {
        if (activeMcpKey && bridge?.callAiToEarnMcp) {
          const mcpRes = await bridge.callAiToEarnMcp({
            endpoint: activeMcpEndpoint,
            apiKey: activeMcpKey,
            method: 'tools/call',
            params: { name: 'publish_now', arguments: { platform: post.platformId, title: post.title, content: post.body, mediaUrl: post.imageUrl } },
          });
          if (mcpRes.ok) {
            setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: 'published' } : p)));
            return Message.success(isZh ? '已通过 AiToEarn MCP 发布成功' : 'Published via AiToEarn MCP');
          }
        }
        const acc = accounts.find((a) => a.platformId === post.platformId);
        const partition = acc?.partition || `persist:bm-acc-${post.platformId}-default`;
        if (plat) await handleOpenIsolatedWindow(partition, plat.creatorUrl, acc?.label || plat.nameZh);
        setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: 'published' } : p)));
      },
    });
  };

  const handleExtractLiveBrowserComments = async () => {
    if (!selectedPartition || !bridge?.extractBrowserComments) return Message.warning(isZh ? '请先打开隔离浏览器窗口' : 'Open browser first');
    const res = await bridge.extractBrowserComments({ partition: selectedPartition });
    if (!res.ok || res.comments.length === 0) return Message.warning(res.error || (isZh ? '未检测到可见评论' : 'No visible comments'));
    setAnalyzedList(res.comments.map((c) => ({ id: c.id, text: c.text, redacted: c.redacted, ...scoreComment(c.text) })).sort((a, b) => b.score - a.score));
    Message.success(isZh ? `已提取并脱敏 ${res.comments.length} 条评论` : `Extracted ${res.comments.length} comments`);
  };

  const handleExtractCompetitorFormula = async () => {
    if (!selectedPartition || !bridge?.extractBrowserPageFormula) return Message.warning(isZh ? '请先打开隔离浏览器窗口' : 'Open browser first');
    setExtractingFormula(true);
    const res = await bridge.extractBrowserPageFormula({ partition: selectedPartition });
    setExtractingFormula(false);
    if (!res.ok || !res.excerpt) return Message.warning(res.error || (isZh ? '未提取到正文' : 'No content extracted'));
    setExtractedFormula({ title: res.title || 'Competitor Post', url: res.url || '', excerpt: res.excerpt });
  };

  const handleAnalyzePastedComments = () => {
    const lines = rawCommentInput.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return Message.warning(isZh ? '请先粘贴评论' : 'Paste comments first');
    setAnalyzedList(
      lines
        .map((line, idx) => {
          const clean = sanitizePii(line);
          return { id: `paste_${Date.now()}_${idx}`, text: clean.text, redacted: clean.redacted, ...scoreComment(clean.text) };
        })
        .sort((a, b) => b.score - a.score)
    );
  };

  const handleEnrichCommentsWithLlm = async () => {
    if (analyzedList.length === 0 || !bridge?.runLlm) return;
    if (!settings.llmApiKey && !settings.llmBaseUrl.includes('localhost') && !settings.llmBaseUrl.includes('127.0.0.1')) return setSettingsModalOpen(true);
    setScoringWithLlm(true);
    const res = await bridge.runLlm({
      baseUrl: settings.llmBaseUrl,
      apiKey: settings.llmApiKey,
      model: settings.llmModel,
      systemPrompt: 'Score social media comments for buyer intent. Return strict JSON array of {"id": string, "tier": "S"|"A"|"B"|"C", "score": number, "draftReply": string}.',
      userPrompt: JSON.stringify(analyzedList.slice(0, 12).map((c) => ({ id: c.id, text: c.text }))),
    });
    setScoringWithLlm(false);
    if (!res.ok || !res.content) return Message.error(res.error || 'LLM failed');
    try {
      const parsed = JSON.parse(res.content.replace(/```json\s*|```/g, '').trim()) as Array<{ id: string; tier: 'S' | 'A' | 'B' | 'C'; score: number; draftReply: string }>;
      const map = new Map(parsed.map((item) => [item.id, item]));
      setAnalyzedList((prev) => prev.map((item) => (map.get(item.id) ? { ...item, ...map.get(item.id)! } : item)).sort((a, b) => b.score - a.score));
      Message.success(isZh ? '大模型语义精排完成' : 'LLM scoring complete');
    } catch {
      Message.warning(isZh ? '模型返回非标准 JSON，保留基础评分' : 'Kept baseline scores');
    }
  };

  const handlePrefillReplyToBrowser = async (replyText: string) => {
    if (!selectedPartition || !bridge?.prefillBrowserReply) return Message.info(isZh ? '请先打开隔离浏览器窗口' : 'Open browser first');
    const res = await bridge.prefillBrowserReply({ partition: selectedPartition, replyText });
    Message[res.ok ? 'success' : 'warning'](res.ok ? (isZh ? '已自动填入（停在发送键前）' : 'Prefilled') : res.error || 'Failed');
  };

  const handleAddToCrm = (item: AnalyzedComment) => {
    setLeads((prev) => [{ id: `lead_${Date.now()}`, platformId: radarPlatform, nickname: `Prospect_${leads.length + 1}`, sanitizedComment: item.text, tier: item.tier, score: item.score, stage: 'new', dealValue: 0, createdAt: new Date().toISOString() }, ...prev]);
    Message.success(isZh ? '已入库本地线索 CRM' : 'Added to CRM');
  };

  const b2bPartition = 'persist:bm-b2b-global-radar';
  const handleOpenB2bDirectory = async (channel: 'gmaps' | 'linkedin' | 'thomasnet' | 'europages' | 'alibaba' | 'amap' | 'baidu_map') => {
    const q = encodeURIComponent(`${b2bIndustry} ${b2bCountry}`.trim());
    const urls: Record<typeof channel, string> = {
      gmaps: `https://www.google.com/maps/search/${q}`,
      linkedin: `https://www.linkedin.com/search/results/companies/?keywords=${q}`,
      thomasnet: `https://www.thomasnet.com/nsearch.html?cov=NA&heading=&searchterm=${encodeURIComponent(b2bIndustry)}`,
      europages: `https://www.europages.co.uk/companies/${encodeURIComponent(b2bIndustry)}.html`,
      alibaba: `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(b2bIndustry)}`,
      amap: `https://ditu.amap.com/search?query=${q}`,
      baidu_map: `https://map.baidu.com/search/${q}`,
    };
    await handleOpenIsolatedWindow(b2bPartition, urls[channel], `Prospector · ${channel}`);
  };

  const handleLookupCnCompanies = async () => {
    const lines = cnCompanyInput.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return Message.warning(isZh ? '请输入国内公司名称' : 'Enter CN company name');
    if (!bridge?.lookupCnCompany) return;
    setLookingUpCn(true);
    let added = 0;
    for (const companyName of lines.slice(0, 10)) {
      const res = await bridge.lookupCnCompany({ companyName, excludeEmails: settings.smtpUser ? [settings.smtpUser] : [] });
      if (res.ok) {
        added += 1;
        const item: GlobalProspect = {
          id: `cn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          companyName: res.companyName,
          industry: b2bIndustry || '国内企业',
          country: 'CN',
          website: res.website,
          email: res.emails[0] || '',
          phone: res.phones[0] || '',
          snippet: `${res.source}${res.phones.length > 1 ? ` · 备用电话: ${res.phones.slice(1).join(', ')}` : ''}`,
          sourceUrl: res.website || '360/百度公开探测',
        };
        setProspects((prev) => mergeProspects(prev, [item]));
      }
    }
    setLookingUpCn(false);
    Message.success(isZh ? `已完成 ${added} 家国内企业官网与联系方式挖掘` : `Enriched ${added} CN companies`);
  };

  const handleExtractB2bProspects = async () => {
    if (!bridge?.extractGlobalProspects) return;
    setExtractingB2b(true);
    const res = await bridge.extractGlobalProspects({ partition: b2bPartition });
    setExtractingB2b(false);
    if (!res.ok || res.prospects.length === 0) return Message.warning(res.error || (isZh ? '未提取到企业列表' : 'No prospects extracted'));
    const mapped: GlobalProspect[] = res.prospects.map((p) => ({ ...p, industry: b2bIndustry, country: b2bCountry }));
    setProspects(prev => mergeProspects(prev, mapped));
    Message.success(isZh ? `已提取 ${mapped.length} 家企业线索` : `Extracted ${mapped.length} prospects`);
  };

  const handleEnrichProspect = async (item: GlobalProspect) => {
    if (!bridge?.enrichCompanyDomain || (!item.website && !item.email)) return Message.warning(isZh ? '暂无官网或邮箱' : 'No website/email');
    setEnrichingId(item.id);
    const res = await bridge.enrichCompanyDomain({ website: item.website, email: item.email });
    setEnrichingId('');
    if (res.ok) {
      setProspects((prev) => prev.map((p) => (p.id === item.id ? { ...p, email: res.email || p.email, phone: res.phone || p.phone, whatsappUrl: res.whatsappUrl || p.whatsappUrl, linkedinUrl: res.linkedinUrl || p.linkedinUrl, mxValid: res.mxValid, mxHost: res.mxHost } : p)));
      Message.success(res.mxValid ? (isZh ? `邮箱 MX 有效 (${res.mxHost})` : `MX valid (${res.mxHost})`) : (isZh ? '已完成官网抓取' : 'Website checked'));
    }
  };

  const handleGenerateColdEmail = async (item: GlobalProspect) => {
    if (!settings.llmApiKey && !settings.llmBaseUrl.includes('localhost') && !settings.llmBaseUrl.includes('127.0.0.1')) return setSettingsModalOpen(true);
    if (!bridge?.runLlm) return;
    setDraftingOutreachId(item.id);
    const res = await bridge.runLlm({
      baseUrl: settings.llmBaseUrl,
      apiKey: settings.llmApiKey,
      model: settings.llmModel,
      systemPrompt: `You are a global B2B sales strategist. Output strict JSON {"subject": string, "body": string, "sequence": [{"dayOffset": 1, "channel": "email", "subject": string, "body": string}, {"dayOffset": 4, "channel": "email", "subject": string, "body": string}, {"dayOffset": 9, "channel": "whatsapp", "subject": "WhatsApp Follow-up", "body": string}]} in the language specified by the user.`,
      userPrompt: `Language: ${b2bLang}\nTarget company: ${item.companyName}\nCountry: ${item.country}\nIndustry: ${item.industry}\nWebsite: ${item.website}\nContext: ${item.snippet}`,
    });
    setDraftingOutreachId('');
    if (!res.ok || !res.content) return Message.error(res.error || 'Failed');
    try {
      const parsed = JSON.parse(res.content.replace(/```json\s*|```/g, '').trim()) as { subject?: string; body?: string; sequence?: Array<{ dayOffset: number; channel: 'email' | 'whatsapp' | 'linkedin'; subject: string; body: string }> };
      const seq: OutreachStep[] = Array.isArray(parsed.sequence) ? parsed.sequence.map((s) => ({ ...s, status: 'pending' })) : [];
      setProspects((prev) => prev.map((p) => (p.id === item.id ? { ...p, outreachSubject: parsed.subject || `Partnership with ${item.companyName}`, outreachBody: parsed.body || seq[0]?.body || res.content, sequence: seq } : p)));
    } catch {
      setProspects((prev) => prev.map((p) => (p.id === item.id ? { ...p, outreachSubject: `Inquiry for ${item.companyName}`, outreachBody: res.content } : p)));
    }
    Message.success(isZh ? '已生成 3 轮开发信序列' : 'Sequence drafted');
  };

  const handleSendColdEmail = (item: GlobalProspect) => {
    const draft = nextEmailDraft(item);
    if (!draft || !item.email) return Message.warning(isZh ? '请先补全邮箱并生成草稿' : 'Enrich email and draft first');
    if (!settings.smtpUser || !settings.smtpPass || !settings.smtpHost) return setSettingsModalOpen(true);
    Modal.confirm({
      title: isZh ? '人工确认发送开发信' : 'Confirm Cold Email',
      content: `${item.companyName} (${item.email})\nSubject: ${draft.subject || item.companyName}\n\n${draft.body}`,
      onOk: async () => {
        if (!bridge?.sendSmtpEmail) return;
        setSendingEmailId(item.id);
        const res = await bridge.sendSmtpEmail({
          host: settings.smtpHost || 'smtp.163.com',
          port: Number(settings.smtpPort || 465),
          user: settings.smtpUser || '',
          pass: settings.smtpPass || '',
          fromName: isZh ? '标脉灵枢商务中心' : 'BiaoMai Lingshu',
          to: item.email,
          subject: draft.subject || `Collaboration with ${item.companyName}`,
          text: draft.body,
        });
        setSendingEmailId('');
        if (res.ok) {
          setProspects((prev) => prev.map((p) => (p.id === item.id ? { ...p, outreachSent: true, sequence: p.sequence?.map(step => step === draft ? { ...step, status: 'sent' } : step) } : p)));
          Message.success(isZh ? `已发送至 ${item.email}` : `Sent to ${item.email}`);
        } else {
          Message.error(res.error || 'SMTP failed');
        }
      },
    });
  };

  const handleCheckImapReplies = async (scheduled = false) => {
    const sentEmails = prospects.filter((p) => p.outreachSent && p.email).map((p) => p.email);
    if (sentEmails.length === 0) return Message.info(isZh ? '暂无已发信客户邮箱' : 'No sent emails');
    if (!settings.imapHost || !settings.smtpUser || !settings.smtpPass) return setSettingsModalOpen(true);
    if (!bridge?.checkImapReplies) return;
    setCheckingImap(true);
    const res = await bridge.checkImapReplies({ host: settings.imapHost, port: Number(settings.imapPort || 993), user: settings.smtpUser, pass: settings.smtpPass, prospectEmails: sentEmails })
      .catch((error: unknown) => ({ ok: false, error: String(error), repliedEmails: [] as string[] }))
      .finally(() => setCheckingImap(false));
    if (!res.ok) {
      if (scheduled) throw new Error(res.error || 'IMAP failed');
      return Message.error(res.error || 'IMAP failed');
    }
    if (res.repliedEmails.length > 0) {
      const set = new Set(res.repliedEmails.map((e) => e.toLowerCase()));
      setProspects((prev) => prev.map((p) => (set.has(p.email.toLowerCase()) ? { ...p, replied: true } : p)));
      const repliedIds = new Set(prospects.filter(p => set.has(p.email.toLowerCase())).map(p => `b2b_${p.id}`));
      setLeads(prev => prev.map(l => repliedIds.has(l.id) && l.stage === 'new' ? { ...l, stage: 'engaged' } : l));
      Message.success(isZh ? `检测到 ${res.repliedEmails.length} 位客户回信` : `Detected ${res.repliedEmails.length} replies`);
    } else {
      Message.info(isZh ? '暂无新回信' : 'No new replies');
    }
  };

  const dailyCheck = useRef(async () => {});
  dailyCheck.current = async () => {
    if (settings.imapHost && settings.smtpUser && settings.smtpPass && prospects.some(p => p.outreachSent && !p.replied)) {
      await handleCheckImapReplies(true);
    }
    if (settings.imWebhookUrl && bridge?.triggerImWebhook) {
      const pending = prospects.filter(p => p.outreachBody && !p.outreachSent && !p.replied).length;
      const result = await bridge.triggerImWebhook({ webhookUrl: settings.imWebhookUrl,
        title: isZh ? '每日获客巡检' : 'Daily lead digest',
        content: isZh ? `企业 ${prospects.length} · 待确认开发信 ${pending} · CRM ${leads.length}` : `Companies ${prospects.length} · Pending emails ${pending} · CRM ${leads.length}` });
      if (!result.ok) throw new Error(result.error || 'Webhook failed');
    }
  };
  useEffect(() => {
    localStorage.setItem('biaomai.daily.enabled', JSON.stringify(cronEnabled));
    if (!cronEnabled || !dbReady) return;
    let running = false;
    const tick = async () => {
      const day = new Date().toDateString();
      if (running || localStorage.getItem('biaomai.daily.completed') === day) return;
      running = true;
      try {
        await dailyCheck.current();
        localStorage.setItem('biaomai.daily.completed', day);
      } catch (error) {
        Message.error(String(error));
      } finally { running = false; }
    };
    void tick();
    const timer = window.setInterval(() => void tick(), 15 * 60_000);
    return () => window.clearInterval(timer);
  }, [cronEnabled, dbReady]);

  const stageOrder: LeadStage[] = ['new', 'engaged', 'qualified', 'opportunity', 'won'];
  const stageLabel: Record<LeadStage, string> = isZh
    ? { new: '新意向', engaged: '已回复', qualified: '已留资', opportunity: '商机', won: '已成交' }
    : { new: 'New', engaged: 'Engaged', qualified: 'Qualified', opportunity: 'Opportunity', won: 'Won' };

  const sectionMeta: Record<'create' | 'publish' | 'engage' | 'outbound' | 'crm' | 'packs', { zh: string; en: string }> = {
    create: { zh: '内容创作', en: 'Create Studio' },
    publish: { zh: '渠道分发', en: 'Omni-Publish' },
    engage: { zh: '社媒雷达', en: 'Intent Radar' },
    outbound: { zh: '企业寻客', en: 'Global & CN Outbound' },
    crm: { zh: '线索 CRM', en: 'Lead CRM' },
    packs: { zh: '行业插件', en: 'Packs Market' },
  };
  const currentMeta = sectionMeta[activeTab] || sectionMeta.create;

  return (
    <div className='biaomai-workbench-root h-full w-full overflow-y-auto overflow-x-hidden bg-2 text-t-primary box-border'>
      <div className='w-full px-20px py-16px flex flex-col gap-16px box-border'>
        {/* Slim Per-Feature Header */}
        <div className='flex items-center justify-between gap-12px flex-wrap pb-12px border-b border-solid border-[var(--color-border-2)]'>
          <div className='flex items-center gap-12px flex-wrap min-w-0'>
            <h1 className='m-0 text-18px font-700 leading-tight tracking-tight text-t-primary whitespace-nowrap'>
              {isZh ? currentMeta.zh : currentMeta.en}
            </h1>
            <Select value={industryId} onChange={handleIndustryChange} style={{ width: 215 }}>
              {INDUSTRY_PRESETS.map((p) => (
                <Select.Option key={p.id} value={p.id}>{isZh ? p.nameZh : p.nameEn}</Select.Option>
              ))}
            </Select>
          </div>

          <div className='flex items-center gap-8px flex-wrap shrink-0'>
            <button
              type='button'
              onClick={() => setGuideModalOpen(true)}
              className='h-32px px-12px rd-8px border-none bg-1 hover:bg-[#E2E8F0] text-13px font-500 text-t-primary cursor-pointer flex items-center gap-5px transition-colors whitespace-nowrap shrink-0'
            >
              <IconQuestionCircle />
              {isZh ? '使用指南' : 'Guide'}
            </button>
            <button
              type='button'
              onClick={() => setCronModalOpen(true)}
              className='h-32px px-12px rd-8px border-none bg-1 hover:bg-[#E2E8F0] text-13px font-500 text-t-primary cursor-pointer flex items-center gap-5px transition-colors whitespace-nowrap shrink-0'
            >
              <IconClockCircle />
              {isZh ? '定时巡检' : 'Cron'}
            </button>
            <button
              type='button'
              onClick={() => setSettingsModalOpen(true)}
              className='h-32px px-12px rd-8px border-none bg-1 hover:bg-[#E2E8F0] text-13px font-500 text-t-primary cursor-pointer flex items-center gap-6px transition-colors whitespace-nowrap shrink-0'
            >
              <span className='inline-block size-6px rd-full' style={{ background: settings.llmApiKey ? '#10B981' : '#F59E0B' }} />
              {settings.llmApiKey ? settings.llmModel : (isZh ? '模型未配置' : 'No LLM Key')}
            </button>
            <button
              type='button'
              onClick={() => setSettingsModalOpen(true)}
              className='h-32px px-14px rd-8px border-none bg-[#4F46E5] hover:bg-[#4338CA] text-13px font-600 text-white cursor-pointer flex items-center gap-5px transition-colors whitespace-nowrap shrink-0'
            >
              <IconSettings />
              {isZh ? '接口配置' : 'Settings'}
            </button>
          </div>
        </div>

        {activeTab === 'create' && (
          <CreateStudioTab
            isZh={isZh}
            createPlatform={createPlatform}
            setCreatePlatform={setCreatePlatform}
            targetLang={targetLang}
            setTargetLang={setTargetLang}
            topicInput={topicInput}
            setTopicInput={setTopicInput}
            creatingCopy={creatingCopy}
            creatingImg={creatingImg}
            creatingVideo={creatingVideo}
            videoTaskProgress={videoTaskProgress}
            videoTaskStatus={videoTaskStatus}
            draftTitle={draftTitle}
            setDraftTitle={setDraftTitle}
            draftBody={draftBody}
            setDraftBody={setDraftBody}
            draftImageUrl={draftImageUrl}
            draftVideoUrl={draftVideoUrl}
            draftShortLink={draftShortLink}
            setDraftShortLink={setDraftShortLink}
            scheduledTime={scheduledTime}
            setScheduledTime={setScheduledTime}
            selectedCreatePlatform={selectedCreatePlatform}
            onAiGenerateCopy={handleAiGenerateCopy}
            onAiGenerateImage={handleAiGenerateImage}
            onAiGenerateVideo={handleAiGenerateVideo}
            onGenerateOpenMotion={handleGenerateOpenMotion}
            onSaveToSchedule={handleSaveToSchedule}
          />
        )}

        {activeTab === 'publish' && (
          <OmniPublishTab
            isZh={isZh}
            regionFilter={regionFilter}
            setRegionFilter={setRegionFilter}
            visiblePlatforms={visiblePlatforms}
            accounts={accounts}
            posts={posts}
            accPlatform={accPlatform}
            setAccPlatform={setAccPlatform}
            accLabel={accLabel}
            setAccLabel={setAccLabel}
            onOpenIsolatedWindow={handleOpenIsolatedWindow}
            onAddAccount={handleAddAccount}
            onConfirmPublish={handleConfirmPublish}
          />
        )}

        {activeTab === 'engage' && (
          <IntentRadarTab
            isZh={isZh}
            accounts={accounts}
            selectedPartition={selectedPartition}
            setSelectedPartition={setSelectedPartition}
            radarPlatform={radarPlatform}
            setRadarPlatform={setRadarPlatform}
            rawCommentInput={rawCommentInput}
            setRawCommentInput={setRawCommentInput}
            analyzedList={analyzedList}
            extractingFormula={extractingFormula}
            scoringWithLlm={scoringWithLlm}
            extractedFormula={extractedFormula}
            onExtractLiveComments={handleExtractLiveBrowserComments}
            onExtractCompetitorFormula={handleExtractCompetitorFormula}
            onSendToCreate={(text, plat) => {
              if (plat) setCreatePlatform(plat);
              setTopicInput(text);
              setActiveTab('create');
            }}
            onAnalyzePasted={handleAnalyzePastedComments}
            onEnrichWithLlm={handleEnrichCommentsWithLlm}
            onPrefillReply={handlePrefillReplyToBrowser}
            onAddToCrm={handleAddToCrm}
          />
        )}

        {activeTab === 'outbound' && (
          <ProspectorOutboundTab
            isZh={isZh}
            b2bMode={b2bMode}
            setB2bMode={setB2bMode}
            cnCompanyInput={cnCompanyInput}
            setCnCompanyInput={setCnCompanyInput}
            lookingUpCn={lookingUpCn}
            b2bIndustry={b2bIndustry}
            setB2bIndustry={setB2bIndustry}
            b2bCountry={b2bCountry}
            setB2bCountry={setB2bCountry}
            b2bLang={b2bLang}
            setB2bLang={setB2bLang}
            crawlTarget={crawlTarget}
            setCrawlTarget={setCrawlTarget}
            prospects={prospects}
            extractingB2b={extractingB2b}
            enrichingId={enrichingId}
            draftingOutreachId={draftingOutreachId}
            sendingEmailId={sendingEmailId}
            checkingImap={checkingImap}
            crawlingMcp={crawlingMcp}
            onOpenDirectory={handleOpenB2bDirectory}
            onLookupCnCompanies={handleLookupCnCompanies}
            onExtractProspects={handleExtractB2bProspects}
            onEnrichProspect={handleEnrichProspect}
            onGenerateColdEmail={handleGenerateColdEmail}
            onSendColdEmail={handleSendColdEmail}
            onAddProspectToCrm={(item) => {
              setLeads((prev) => prev.some(l => l.id === `b2b_${item.id}`) ? prev : [{ id: `b2b_${item.id}`, platformId: 'global-b2b', nickname: item.companyName, sanitizedComment: `${item.country} · ${item.industry}${item.email ? ` · ${item.email}` : ''}`, tier: item.mxValid ? 'S' : 'A', score: item.mxValid ? 92 : 78, stage: item.replied ? 'engaged' : 'new', dealValue: 0, createdAt: new Date().toISOString() }, ...prev]);
              Message.success(isZh ? `已入库「${item.companyName}」` : 'Added to CRM');
            }}
            onCheckImapReplies={() => void handleCheckImapReplies()}
            onRunCrawlerMcp={async () => {
              if (!bridge?.runCrawlerMcp) return Message.warning(isZh ? '请打开桌面工作台' : 'Open the desktop workbench');
              const target = crawlTarget.trim() || `https://www.europages.co.uk/companies/${encodeURIComponent(b2bIndustry)}.html`;
              if (!URL.canParse(target) || !/^https?:\/\//i.test(target)) return Message.warning(isZh ? '请输入完整网页地址' : 'Enter an HTTP(S) page URL');
              setCrawlingMcp(true);
              try {
                const res = await bridge.runCrawlerMcp({ endpoint: settings.crawlerMcpUrl || 'http://localhost:11235/crawl', targetUrl: target, token: settings.crawlerToken });
                if (!res.ok) return Message.error(res.error || 'Crawl4AI failed');
                const rows = crawlerProspects(res.data, target, b2bIndustry, b2bCountry);
                if (!rows.length) return Message.warning(isZh ? '未发现结构化企业记录，可打开目录后手动提取' : 'No structured company records. Try directory extraction.');
                setProspects(prev => mergeProspects(prev, rows));
                Message.success(isZh ? `已合并 ${rows.length} 条企业记录` : `Merged ${rows.length} company records`);
              } catch (error) {
                Message.error(String(error));
              } finally {
                setCrawlingMcp(false);
              }
            }}
            onPrefillSocialDm={async (url, text) => {
              await handleOpenIsolatedWindow(b2bPartition, url, 'Global DM Outreach');
              setTimeout(async () => {
                const res = await bridge?.prefillSocialDm?.({ partition: b2bPartition, text });
                if (res?.ok) Message.success(isZh ? '已填入话术（停在发送键前）' : 'Prefilled');
              }, 1500);
            }}
          />
        )}

        {activeTab === 'crm' && (
          <LeadCrmTab
            isZh={isZh}
            leads={leads}
            posts={posts}
            stageLabel={stageLabel}
            settings={settings}
            setSettings={setSettings}
            syncingCrm={syncingCrm}
            onExportCsv={() => {
              const header = 'id,platform,nickname,company,email,phone,sanitizedComment,tier,score,stage,dealValue,createdAt';
              const rows = leads.map((l) => [l.id, l.platformId, l.nickname, l.company || '', l.email || '', l.phone || '', l.sanitizedComment, l.tier, l.score, l.stage, l.dealValue, l.createdAt].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
              const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'biaomai-leads.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}
            onAddLead={(draft) => {
              setLeads((prev) => [{ ...draft, id: `lead_${Date.now()}`, createdAt: new Date().toISOString() }, ...prev]);
              Message.success(isZh ? `已新增线索「${draft.nickname}」` : 'Lead created');
            }}
            onUpdateLead={(id, patch) =>
              setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
            }
            onDeleteLead={(id) => {
              setLeads((prev) => prev.filter((l) => l.id !== id));
              Message.success(isZh ? '已删除线索' : 'Lead deleted');
            }}
            onSyncExternalCrm={async () => {
              if (!settings.crmBaseUrl?.trim()) {
                return Message.warning(isZh ? '请先点击「配置开源 CRM」填写 Twenty / Atomic CRM 地址' : 'Configure external CRM URL first');
              }
              if (!bridge?.syncExternalCrm) return;
              setSyncingCrm(true);
              try {
                const res = await bridge.syncExternalCrm({
                  provider: settings.crmProvider || 'twenty',
                  baseUrl: settings.crmBaseUrl,
                  apiKey: settings.crmApiKey,
                  leads,
                });
                if (res.ok) {
                  Message.success(isZh ? `已成功推送 ${res.syncedCount} 条线索至开源 CRM` : `Synced ${res.syncedCount} leads`);
                } else {
                  Message.warning(res.error || (isZh ? `成功 ${res.syncedCount} 条，失败 ${res.failedCount} 条` : `Synced ${res.syncedCount}, failed ${res.failedCount}`));
                }
              } finally {
                setSyncingCrm(false);
              }
            }}
            onOpenExternalCrm={() => {
              if (!settings.crmBaseUrl?.trim()) return;
              void handleOpenIsolatedWindow('biaomai-oss-crm', settings.crmBaseUrl, 'Open-Source CRM');
            }}
            onSyncPostClicks={async (post) => {
              if (!activeMcpKey || !bridge?.callAiToEarnMcp) {
                return Message.info(isZh ? '请配置渠道统计接口后同步' : 'Configure channel analytics to sync clicks');
              }
              const res = await bridge.callAiToEarnMcp({ endpoint: activeMcpEndpoint, apiKey: activeMcpKey, method: 'tools/call', params: { name: 'short_link_stats', arguments: { shortLinkUrl: post.shortLinkUrl || '', postId: post.id } } });
              const data = (res.data ?? {}) as Record<string, unknown>;
              if (res.ok && typeof data.clicks === 'number') {
                setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, clicks: data.clicks as number } : p)));
              }
            }}
            onRespinPost={(prompt, plat) => {
              setCreatePlatform(plat);
              setTopicInput(prompt);
              setActiveTab('create');
            }}
          />
        )}

        {activeTab === 'packs' && (
          <PacksMarketTab
            isZh={isZh}
            installedPacks={installedPacks}
            loadingPacks={loadingPacks}
            onRefresh={refreshInstalledPacks}
            onInstallLocalPack={async () => {
              const res = await bridge?.installLocalPack?.();
              if (res?.ok) {
                await refreshInstalledPacks();
                Message.success(isZh ? `已安装：${res.packName}` : `Installed ${res.packName}`);
              } else if (res && !res.canceled) {
                Message.error(res.error || 'Install failed');
              }
            }}
            onUninstallPack={async (packName) => {
              await bridge?.uninstallPack?.({ packName });
              await refreshInstalledPacks();
            }}
            openMotionRunning={openMotionRunning}
            openMotionBusy={openMotionBusy}
            onStartOpenMotion={async () => {
              if (!bridge?.openMotionStudioControl) return;
              setOpenMotionBusy(true);
              Message.info(isZh ? '正在启动本地完整版 OpenMotion Studio（首次将自动拉取并构建，请稍候）...' : 'Starting local OpenMotion Studio...');
              try {
                const res = await bridge.openMotionStudioControl({ action: 'start' });
                setOpenMotionRunning(res.running);
                if (res.ok && res.running) {
                  Message.success(res.message || (isZh ? 'OpenMotion Studio 已启动' : 'Started'));
                  await handleOpenIsolatedWindow('biaomai-openmotion-studio', res.url, 'OpenMotion Studio');
                } else if (res.ok) {
                  Message.info(res.message || 'Initializing...');
                } else {
                  Message.error(res.error || 'Start failed');
                }
              } finally {
                setOpenMotionBusy(false);
              }
            }}
            onOpenOpenMotion={() => {
              void handleOpenIsolatedWindow('biaomai-openmotion-studio', 'http://localhost:3001', 'OpenMotion Studio');
            }}
            onStopOpenMotion={async () => {
              if (!bridge?.openMotionStudioControl) return;
              setOpenMotionBusy(true);
              try {
                const res = await bridge.openMotionStudioControl({ action: 'stop' });
                setOpenMotionRunning(res.running);
                Message.info(res.message || (isZh ? '已停止 OpenMotion Studio' : 'Stopped'));
              } finally {
                setOpenMotionBusy(false);
              }
            }}
          />
        )}

        <StudioModals
          isZh={isZh}
          settingsModalOpen={settingsModalOpen}
          setSettingsModalOpen={setSettingsModalOpen}
          settings={settings}
          setSettings={setSettings}
          mcpTestMsg={mcpTestMsg}
          onTestAiToEarnMcp={async () => {
            if (!bridge?.callAiToEarnMcp) return;
            setMcpTestMsg(isZh ? '连接测试中...' : 'Testing...');
            const res = await bridge.callAiToEarnMcp({ endpoint: activeMcpEndpoint, apiKey: activeMcpKey, method: 'tools/list' });
            setMcpTestMsg(res.ok ? `Connected (${res.latencyMs}ms)` : res.error || 'Failed');
          }}
          cronModalOpen={cronModalOpen}
          setCronModalOpen={setCronModalOpen}
          cronEnabled={cronEnabled}
          setCronEnabled={setCronEnabled}
          checkingImap={checkingImap}
          onCheckImapReplies={() => void handleCheckImapReplies()}
          onTriggerCronTest={async () => {
            if (!settings.imWebhookUrl) return setSettingsModalOpen(true);
            const res = await bridge?.triggerImWebhook?.({ webhookUrl: settings.imWebhookUrl, title: '每日获客汇总', content: `待发布: ${posts.length} | 企业池: ${prospects.length} | 线索: ${leads.length}` });
            Message[res?.ok ? 'success' : 'error'](res?.ok ? (isZh ? '已推送至 IM 群' : 'Pushed') : res?.error || 'Failed');
          }}
          guideModalOpen={guideModalOpen}
          setGuideModalOpen={setGuideModalOpen}
        />
      </div>
    </div>
  );
};

export default LeadGenStudioPage;
