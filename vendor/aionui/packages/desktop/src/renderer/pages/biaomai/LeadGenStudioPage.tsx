/**
 * @license
 * Copyright 2026 BiaoMai Lingshu Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  Empty,
  Input,
  Message,
  Modal,
  Progress,
  Select,
  Space,
  Tag,
} from '@arco-design/web-react';
import { IconClockCircle, IconSettings } from '@arco-design/web-react/icon';

const { TextArea } = Input;

interface BiaoMaiElectronBridge {
  openIsolatedBrowser: (payload: { partition: string; url: string; title?: string }) => Promise<{ ok: boolean; url?: string }>;
  extractBrowserComments: (payload: { partition: string }) => Promise<{
    ok: boolean;
    url?: string;
    error?: string;
    comments: Array<{ id: string; text: string; redacted: number }>;
  }>;
  extractBrowserPageFormula: (payload: { partition: string }) => Promise<{
    ok: boolean;
    url?: string;
    title?: string;
    excerpt?: string;
    error?: string;
  }>;
  prefillBrowserReply: (payload: { partition: string; replyText: string }) => Promise<{ ok: boolean; error?: string; stopBeforeSubmit?: boolean }>;
  runLlm: (payload: { baseUrl: string; apiKey: string; model: string; systemPrompt: string; userPrompt: string }) => Promise<{
    ok: boolean;
    content?: string;
    latencyMs?: number;
    error?: string;
  }>;
  generateImage: (payload: { baseUrl: string; apiKey: string; model: string; prompt: string; size?: string }) => Promise<{
    ok: boolean;
    imageUrl?: string;
    error?: string;
  }>;
  callAiToEarnMcp: (payload: { endpoint: string; apiKey: string; method: string; params?: Record<string, unknown> }) => Promise<{
    ok: boolean;
    httpStatus?: number;
    latencyMs?: number;
    isAuthMismatch?: boolean;
    data?: unknown;
    error?: string;
  }>;
  listInstalledPacks: () => Promise<{
    ok: boolean;
    packs: InstalledPack[];
  }>;
  installLocalPack: () => Promise<{ ok: boolean; canceled?: boolean; packName?: string; error?: string }>;
  uninstallPack: (payload: { packName: string }) => Promise<{ ok: boolean }>;
  extractGlobalProspects: (payload: { partition: string }) => Promise<{
    ok: boolean;
    url?: string;
    error?: string;
    prospects: Array<{
      id: string;
      companyName: string;
      website: string;
      email: string;
      phone: string;
      snippet: string;
      sourceUrl: string;
    }>;
  }>;
  enrichCompanyDomain: (payload: { website?: string; email?: string }) => Promise<{
    ok: boolean;
    email?: string;
    phone?: string;
    whatsappUrl?: string;
    linkedinUrl?: string;
    mxValid: boolean;
    mxHost?: string;
  }>;
  sendSmtpEmail: (payload: {
    host: string;
    port: number;
    secure?: boolean;
    user: string;
    pass: string;
    from?: string;
    fromName?: string;
    to: string;
    subject: string;
    text: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  lookupCnCompany: (payload: { companyName: string; excludeEmails?: string[]; excludePhones?: string[] }) => Promise<{
    ok: boolean;
    companyName: string;
    website: string;
    phones: string[];
    emails: string[];
    source: string;
    error?: string;
  }>;
  dbGetAll: () => Promise<{ ok: boolean; db: Record<string, unknown[]> }>;
  dbSaveCollection: (payload: { collection: string; items: unknown[] }) => Promise<{ ok: boolean }>;
  checkImapReplies: (payload: {
    host: string;
    port?: number;
    user: string;
    pass: string;
    prospectEmails: string[];
  }) => Promise<{ ok: boolean; error?: string; repliedEmails: string[] }>;
  prefillSocialDm: (payload: { partition: string; text: string }) => Promise<{ ok: boolean; error?: string; stopBeforeSubmit?: boolean }>;
  triggerImWebhook: (payload: { webhookUrl: string; title: string; content: string }) => Promise<{ ok: boolean; error?: string }>;
  runCrawlerMcp: (payload: { endpoint: string; targetUrl: string }) => Promise<{ ok: boolean; data?: unknown; error?: string }>;
}

interface OutreachStep {
  dayOffset: number;
  channel: 'email' | 'whatsapp' | 'linkedin';
  subject: string;
  body: string;
  status: 'pending' | 'sent';
}

interface GlobalProspect {
  id: string;
  companyName: string;
  industry: string;
  country: string;
  website: string;
  email: string;
  phone: string;
  whatsappUrl?: string;
  linkedinUrl?: string;
  mxValid?: boolean;
  mxHost?: string;
  snippet: string;
  sourceUrl: string;
  outreachSubject?: string;
  outreachBody?: string;
  outreachSent?: boolean;
  replied?: boolean;
  sequence?: OutreachStep[];
}

interface InstalledPack {
  name: string;
  displayName: Record<string, string> | string;
  description: Record<string, string> | string;
  version: string;
  license: string;
  category: string;
  permissions: Record<string, unknown>;
  assistantsCount: number;
  skillsCount: number;
  canvasesCount: number;
}

const getBridge = (): BiaoMaiElectronBridge | undefined =>
  (window as unknown as { biaomaiAPI?: BiaoMaiElectronBridge }).biaomaiAPI;

interface MediaPlatform {
  id: string;
  region: 'cn' | 'global';
  nameZh: string;
  nameEn: string;
  badge: string;
  brandColor: string;
  aspect: string;
  creatorUrl: string;
  localUploader: string;
}

const ALL_PLATFORMS: MediaPlatform[] = [
  { id: 'xiaohongshu', region: 'cn', nameZh: '小红书', nameEn: 'RedNote', badge: 'XHS', brandColor: '#FF2442', aspect: '3:4', creatorUrl: 'https://creator.xiaohongshu.com/', localUploader: 'social-auto-upload/xiaohongshu' },
  { id: 'douyin', region: 'cn', nameZh: '抖音', nameEn: 'Douyin', badge: 'DY', brandColor: '#111827', aspect: '9:16', creatorUrl: 'https://creator.douyin.com/', localUploader: 'social-auto-upload/douyin' },
  { id: 'wechat_channels', region: 'cn', nameZh: '视频号', nameEn: 'Channels', badge: 'WC', brandColor: '#07C160', aspect: '9:16', creatorUrl: 'https://channels.weixin.qq.com/', localUploader: 'social-auto-upload/tencent' },
  { id: 'bilibili', region: 'cn', nameZh: 'B站', nameEn: 'Bilibili', badge: 'B', brandColor: '#00A1D6', aspect: '16:9', creatorUrl: 'https://member.bilibili.com/', localUploader: 'social-auto-upload/bilibili' },
  { id: 'kuaishou', region: 'cn', nameZh: '快手', nameEn: 'Kuaishou', badge: 'KS', brandColor: '#FF5000', aspect: '9:16', creatorUrl: 'https://cp.kuaishou.com/', localUploader: 'social-auto-upload/ks' },
  { id: 'wechat_oa', region: 'cn', nameZh: '公众号', nameEn: 'WeChat OA', badge: 'OA', brandColor: '#07C160', aspect: '16:9', creatorUrl: 'https://mp.weixin.qq.com/', localUploader: 'isolated-browser' },
  { id: 'weibo', region: 'cn', nameZh: '微博', nameEn: 'Weibo', badge: 'WB', brandColor: '#E6162D', aspect: '1:1', creatorUrl: 'https://weibo.com/', localUploader: 'social-auto-upload/weibo' },
  { id: 'zhihu', region: 'cn', nameZh: '知乎', nameEn: 'Zhihu', badge: 'ZH', brandColor: '#0066FF', aspect: '16:9', creatorUrl: 'https://www.zhihu.com/creator', localUploader: 'social-auto-upload/zhihu' },
  { id: 'baijiahao', region: 'cn', nameZh: '百家号', nameEn: 'Baijiahao', badge: 'BJ', brandColor: '#2932E1', aspect: '16:9', creatorUrl: 'https://baijiahao.baidu.com/', localUploader: 'social-auto-upload/baijiahao' },
  { id: 'tiktok', region: 'global', nameZh: 'TikTok', nameEn: 'TikTok', badge: 'TT', brandColor: '#000000', aspect: '9:16', creatorUrl: 'https://www.tiktok.com/creator-center/upload', localUploader: 'social-auto-upload/tk' },
  { id: 'youtube', region: 'global', nameZh: 'YouTube', nameEn: 'YouTube', badge: 'YT', brandColor: '#FF0000', aspect: '16:9', creatorUrl: 'https://studio.youtube.com/', localUploader: 'social-auto-upload/youtube' },
  { id: 'linkedin', region: 'global', nameZh: 'LinkedIn', nameEn: 'LinkedIn', badge: 'IN', brandColor: '#0A66C2', aspect: '16:9', creatorUrl: 'https://www.linkedin.com/feed/', localUploader: 'isolated-browser' },
  { id: 'x', region: 'global', nameZh: 'X (Twitter)', nameEn: 'X', badge: 'X', brandColor: '#0F172A', aspect: '16:9', creatorUrl: 'https://x.com/compose/post', localUploader: 'isolated-browser' },
  { id: 'instagram', region: 'global', nameZh: 'Instagram', nameEn: 'Instagram', badge: 'IG', brandColor: '#E1306C', aspect: '4:5', creatorUrl: 'https://business.facebook.com/latest/composer', localUploader: 'social-auto-upload/meta' },
  { id: 'facebook', region: 'global', nameZh: 'Facebook', nameEn: 'Facebook', badge: 'FB', brandColor: '#1877F2', aspect: '16:9', creatorUrl: 'https://business.facebook.com/', localUploader: 'social-auto-upload/meta' },
  { id: 'threads', region: 'global', nameZh: 'Threads', nameEn: 'Threads', badge: 'TH', brandColor: '#18181B', aspect: '1:1', creatorUrl: 'https://www.threads.net/', localUploader: 'isolated-browser' },
  { id: 'pinterest', region: 'global', nameZh: 'Pinterest', nameEn: 'Pinterest', badge: 'PT', brandColor: '#E60023', aspect: '2:3', creatorUrl: 'https://www.pinterest.com/pin-creation-tool/', localUploader: 'isolated-browser' },
];

interface LocalAccount {
  id: string;
  platformId: string;
  label: string;
  partition: string;
  createdAt: string;
}

interface LocalPost {
  id: string;
  platformId: string;
  title: string;
  body: string;
  imageUrl?: string;
  videoUrl?: string;
  shortLinkUrl?: string;
  clicks?: number;
  scheduledAt: string;
  status: 'draft' | 'scheduled' | 'published';
  createdAt: string;
}

type LeadStage = 'new' | 'engaged' | 'qualified' | 'opportunity' | 'won';

interface LocalLead {
  id: string;
  platformId: string;
  nickname: string;
  sanitizedComment: string;
  tier: 'S' | 'A' | 'B' | 'C';
  score: number;
  stage: LeadStage;
  dealValue: number;
  createdAt: string;
}

interface StudioSettings {
  region: 'cn' | 'global' | 'self-hosted';
  llmBaseUrl: string;
  llmModel: string;
  llmApiKey: string;
  imageBaseUrl: string;
  imageModel: string;
  imageApiKey: string;
  cnMcpKey: string;
  globalMcpKey: string;
  customMcpUrl: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  imapHost?: string;
  imapPort?: number;
  imWebhookUrl?: string;
  crawlerMcpUrl?: string;
}

interface AnalyzedComment {
  id: string;
  text: string;
  redacted: number;
  tier: 'S' | 'A' | 'B' | 'C';
  score: number;
  draftReply: string;
}

function sanitizePii(raw: string): { text: string; redacted: number } {
  let redacted = 0;
  let text = raw;
  const patterns = [
    /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
    /(?<!\d)1[3-9]\d{9}(?!\d)/g,
    /(?:微信|vx|v信|wx|wechat)[\s:：号]*[a-zA-Z0-9_-]{5,20}/gi,
    /https?:\/\/[^\s]+/gi,
  ];
  for (const p of patterns) {
    text = text.replace(p, () => {
      redacted += 1;
      return '[REDACTED]';
    });
  }
  return { text: text.trim(), redacted };
}

function scoreComment(content: string): { tier: 'S' | 'A' | 'B' | 'C'; score: number; draftReply: string } {
  const lower = content.toLowerCase();
  const sKeys = ['怎么收费', '多少钱', '报价', '求链接', '怎么买', '合作', '私有化', 'how much', 'pricing', 'link', 'buy'];
  const aKeys = ['支持', '适合', '教程', '怎么用', '对比', 'support', 'tutorial', 'compatible'];
  const isEn = /^[ -~]+$/.test(content);
  if (sKeys.some((k) => lower.includes(k))) {
    return {
      tier: 'S',
      score: 94,
      draftReply: isEn
        ? 'Thanks for reaching out! Full pricing and quick-start details are in our bio link—happy to help!'
        : '您好，感谢咨询！详细方案与报价已整理好，欢迎点击主页置顶链接或私信获取。',
    };
  }
  if (aKeys.some((k) => lower.includes(k))) {
    return {
      tier: 'A',
      score: 76,
      draftReply: isEn
        ? 'Great question! Yes, it works out of the box—check our pinned walkthrough for details.'
        : '问得很精准！完全支持的，主页置顶有完整实操演示，欢迎随时交流～',
    };
  }
  if (content.length >= 12) return { tier: 'B', score: 52, draftReply: isEn ? 'Thanks for sharing!' : '感谢关注与反馈！' };
  return { tier: 'C', score: 30, draftReply: '' };
}

const KEYS = {
  accounts: 'biaomai:local:accounts',
  posts: 'biaomai:local:posts',
  leads: 'biaomai:local:leads',
  settings: 'biaomai:local:settings',
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const LeadGenStudioPage: React.FC = () => {
  const { i18n } = useTranslation();
  const isZh = (i18n.language || 'zh-CN').startsWith('zh');
  const bridge = getBridge();

  const [activeTab, setActiveTab] = useState<'create' | 'publish' | 'engage' | 'outbound' | 'crm' | 'packs'>('create');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
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
      smtpHost: 'smtp.gmail.com',
      smtpPort: 465,
      smtpUser: '',
      smtpPass: '',
      imapHost: 'imap.gmail.com',
      imapPort: 993,
      imWebhookUrl: '',
      crawlerMcpUrl: 'http://localhost:11235/crawl',
    })
  );
  const [cronModalOpen, setCronModalOpen] = useState(false);
  const [checkingImap, setCheckingImap] = useState(false);
  const [crawlingMcp, setCrawlingMcp] = useState(false);
  const [cronEnabled, setCronEnabled] = useState(false);
  const [mcpTestMsg, setMcpTestMsg] = useState<string>('');

  const [regionFilter, setRegionFilter] = useState<'all' | 'cn' | 'global'>('all');
  const [accounts, setAccounts] = useState<LocalAccount[]>(() => readJson<LocalAccount[]>(KEYS.accounts, []));
  const [posts, setPosts] = useState<LocalPost[]>(() => readJson<LocalPost[]>(KEYS.posts, []));
  const [leads, setLeads] = useState<LocalLead[]>(() => readJson<LocalLead[]>(KEYS.leads, []));
  const [prospects, setProspects] = useState<GlobalProspect[]>(() => readJson<GlobalProspect[]>('biaomai:local:prospects', []));
  const [b2bMode, setB2bMode] = useState<'global' | 'cn'>('cn');
  const [cnCompanyInput, setCnCompanyInput] = useState('');
  const [lookingUpCn, setLookingUpCn] = useState(false);
  const [b2bIndustry, setB2bIndustry] = useState('CNC Machining & Industrial Parts');
  const [b2bCountry, setB2bCountry] = useState('Germany');
  const [b2bLang, setB2bLang] = useState<'en-US' | 'de-DE' | 'es-ES' | 'ja-JP' | 'ar-SA'>('en-US');
  const [extractingB2b, setExtractingB2b] = useState(false);
  const [enrichingId, setEnrichingId] = useState<string>('');
  const [draftingOutreachId, setDraftingOutreachId] = useState<string>('');
  const [sendingEmailId, setSendingEmailId] = useState<string>('');

  // Create State
  const [createPlatform, setCreatePlatform] = useState('xiaohongshu');
  const [topicInput, setTopicInput] = useState('');
  const [targetLang, setTargetLang] = useState<'zh-CN' | 'en-US' | 'ja-JP' | 'es-ES'>('zh-CN');
  const [creatingCopy, setCreatingCopy] = useState(false);
  const [creatingImg, setCreatingImg] = useState(false);
  const [creatingVideo, setCreatingVideo] = useState(false);
  const [videoTaskProgress, setVideoTaskProgress] = useState<number>(0);
  const [videoTaskStatus, setVideoTaskStatus] = useState<string>('');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftImageUrl, setDraftImageUrl] = useState('');
  const [draftVideoUrl, setDraftVideoUrl] = useState('');
  const [draftShortLink, setDraftShortLink] = useState('');
  const [scheduledTime, setScheduledTime] = useState('2026-11-26 09:00');

  // Accounts State
  const [accPlatform, setAccPlatform] = useState('xiaohongshu');
  const [accLabel, setAccLabel] = useState('');

  // Engage State
  const [selectedPartition, setSelectedPartition] = useState<string>(() => accounts[0]?.partition || '');
  const [radarPlatform, setRadarPlatform] = useState('xiaohongshu');
  const [rawCommentInput, setRawCommentInput] = useState('');
  const [analyzedList, setAnalyzedList] = useState<AnalyzedComment[]>([]);
  const [extractingFormula, setExtractingFormula] = useState(false);
  const [scoringWithLlm, setScoringWithLlm] = useState(false);
  const [extractedFormula, setExtractedFormula] = useState<{ title: string; url: string; excerpt: string } | null>(null);

  // Micro-Kernel Packs State
  const [installedPacks, setInstalledPacks] = useState<InstalledPack[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(false);

  useEffect(() => localStorage.setItem(KEYS.accounts, JSON.stringify(accounts)), [accounts]);
  useEffect(() => localStorage.setItem(KEYS.posts, JSON.stringify(posts)), [posts]);
  useEffect(() => localStorage.setItem(KEYS.leads, JSON.stringify(leads)), [leads]);
  useEffect(() => localStorage.setItem(KEYS.settings, JSON.stringify(settings)), [settings]);

  const refreshInstalledPacks = async () => {
    if (!bridge?.listInstalledPacks) return;
    setLoadingPacks(true);
    const res = await bridge.listInstalledPacks();
    setLoadingPacks(false);
    if (res.ok) setInstalledPacks(res.packs || []);
  };

  useEffect(() => {
    void refreshInstalledPacks();
  }, []);

  const activeMcpEndpoint =
    settings.region === 'cn'
      ? 'https://aitoearn.cn/api/unified/mcp'
      : settings.region === 'global'
        ? 'https://aitoearn.ai/api/unified/mcp'
        : settings.customMcpUrl;
  const activeMcpKey = settings.region === 'cn' ? settings.cnMcpKey : settings.globalMcpKey;

  const visiblePlatforms = useMemo(
    () => (regionFilter === 'all' ? ALL_PLATFORMS : ALL_PLATFORMS.filter((p) => p.region === regionFilter)),
    [regionFilter]
  );

  const selectedCreatePlatform = ALL_PLATFORMS.find((p) => p.id === createPlatform) || ALL_PLATFORMS[0];

  const handleAiGenerateCopy = async () => {
    if (!topicInput.trim()) {
      Message.warning(isZh ? '请输入产品卖点或获客主题' : 'Please enter a topic or product pitch');
      return;
    }
    if (!settings.llmApiKey && !settings.llmBaseUrl.includes('localhost') && !settings.llmBaseUrl.includes('127.0.0.1')) {
      setSettingsModalOpen(true);
      Message.info(isZh ? '请先配置大模型 API Key' : 'Please configure your LLM API Key first');
      return;
    }
    if (!bridge?.runLlm) {
      Message.error('Electron bridge unavailable');
      return;
    }
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
    if (!res.ok || !res.content) {
      Message.error(res.error || 'LLM request failed');
      return;
    }
    try {
      const cleaned = res.content.replace(/```json\s*|```/g, '').trim();
      const parsed = JSON.parse(cleaned) as { title?: string; body?: string; cta?: string };
      setDraftTitle(parsed.title || topicInput.trim());
      setDraftBody(`${parsed.body || res.content}${parsed.cta ? `\n\n👉 ${parsed.cta}` : ''}`.trim());
    } catch {
      const lines = res.content.split('\n').filter(Boolean);
      setDraftTitle(lines[0]?.replace(/^#+\s*/, '') || topicInput.trim());
      setDraftBody(lines.slice(1).join('\n') || res.content);
    }
    Message.success(isZh ? `AI 创作完成 (${res.latencyMs}ms)` : `Generated in ${res.latencyMs}ms`);
  };

  const handleAiGenerateImage = async () => {
    const prompt = draftTitle || topicInput;
    if (!prompt.trim()) {
      Message.warning(isZh ? '请先输入主题或生成标题' : 'Enter a topic or title first');
      return;
    }
    const key = settings.imageApiKey || settings.llmApiKey;
    if (!key) {
      setSettingsModalOpen(true);
      Message.info(isZh ? '请先配置生图 API Key' : 'Please configure an Image API Key');
      return;
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
    if (!prompt.trim()) {
      Message.warning(isZh ? '请先输入主题或生成文案' : 'Enter a topic or generate copy first');
      return;
    }
    if (!activeMcpKey) {
      setSettingsModalOpen(true);
      Message.info(isZh ? 'AI 视频生成与多语配音需配置 AiToEarn MCP Key（或自建端点）' : 'Configure AiToEarn MCP Key for AI video & dubbing');
      return;
    }
    if (!bridge?.callAiToEarnMcp) return;
    setCreatingVideo(true);
    setVideoTaskProgress(25);
    const isDubbing = targetLang !== 'zh-CN';
    setVideoTaskStatus(isZh ? (isDubbing ? `正在提交多语配音/翻译视频任务 (${targetLang})...` : '正在提交 AI 短视频生成任务...') : 'Submitting video task...');
    const toolName = isDubbing ? 'translate_video' : 'video_generation';
    const res = await bridge.callAiToEarnMcp({
      endpoint: activeMcpEndpoint,
      apiKey: activeMcpKey,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: {
          prompt: `${prompt}\n${draftBody}`.slice(0, 600),
          language: targetLang,
          aspectRatio: selectedCreatePlatform.aspect,
        },
      },
    });
    if (!res.ok) {
      setCreatingVideo(false);
      setVideoTaskProgress(0);
      setVideoTaskStatus('');
      Message.error(res.error || (isZh ? '视频任务提交失败' : 'Video task failed'));
      return;
    }
    const payload = (res.data ?? {}) as Record<string, unknown>;
    const directUrl = typeof payload.videoUrl === 'string' ? payload.videoUrl : typeof payload.url === 'string' ? payload.url : '';
    if (directUrl) {
      setDraftVideoUrl(directUrl);
      setVideoTaskProgress(100);
      setVideoTaskStatus(isZh ? '✅ 视频已生成就绪' : '✅ Video ready');
      setCreatingVideo(false);
      return;
    }
    const taskId = typeof payload.taskId === 'string' ? payload.taskId : typeof payload.id === 'string' ? payload.id : '';
    if (!taskId) {
      setVideoTaskProgress(100);
      setVideoTaskStatus(isZh ? '✅ 任务已受理，请在 AiToEarn 后台查看成片' : '✅ Task accepted');
      setCreatingVideo(false);
      return;
    }
    setVideoTaskProgress(55);
    setVideoTaskStatus(isZh ? `任务 ${taskId} 渲染中...` : `Rendering task ${taskId}...`);
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await new Promise((r) => setTimeout(r, 2500));
      const poll = await bridge.callAiToEarnMcp({
        endpoint: activeMcpEndpoint,
        apiKey: activeMcpKey,
        method: 'tools/call',
        params: { name: 'get_video_status', arguments: { taskId } },
      });
      const pollData = (poll.data ?? {}) as Record<string, unknown>;
      const polledUrl = typeof pollData.videoUrl === 'string' ? pollData.videoUrl : typeof pollData.url === 'string' ? pollData.url : '';
      if (polledUrl) {
        setDraftVideoUrl(polledUrl);
        setVideoTaskProgress(100);
        setVideoTaskStatus(isZh ? '✅ 视频渲染完成' : '✅ Video render complete');
        setCreatingVideo(false);
        return;
      }
      setVideoTaskProgress(Math.min(90, 60 + attempt * 5));
    }
    setCreatingVideo(false);
    setVideoTaskStatus(isZh ? `⏳ 任务 ${taskId} 仍在云端渲染，稍后可查看` : `⏳ Task ${taskId} still rendering`);
  };

  const handleTestAiToEarnMcp = async () => {
    if (!bridge?.callAiToEarnMcp) return;
    setMcpTestMsg(isZh ? '连接测试中...' : 'Testing...');
    const res = await bridge.callAiToEarnMcp({
      endpoint: activeMcpEndpoint,
      apiKey: activeMcpKey,
      method: 'tools/list',
    });
    setMcpTestMsg(res.ok ? `✅ ${isZh ? '已连通' : 'Connected'} (${res.latencyMs}ms)` : `❌ ${res.error || 'Failed'}`);
  };

  const handleSaveToSchedule = () => {
    if (!draftTitle.trim()) {
      Message.warning(isZh ? '请先输入或生成标题' : 'Please enter or generate a title');
      return;
    }
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
    if (!accLabel.trim()) {
      Message.warning(isZh ? '请输入账号备注名' : 'Enter account label');
      return;
    }
    const id = `acc_${Date.now()}`;
    const partition = `persist:bm-acc-${accPlatform}-${id}`;
    const acc: LocalAccount = { id, platformId: accPlatform, label: accLabel.trim(), partition, createdAt: new Date().toISOString() };
    setAccounts((prev) => [acc, ...prev]);
    setSelectedPartition(partition);
    setAccLabel('');
    Message.success(isZh ? '已创建独立 Cookie 隔离账号' : 'Created isolated account container');
  };

  const handleConfirmPublish = (post: LocalPost) => {
    const plat = ALL_PLATFORMS.find((p) => p.id === post.platformId);
    Modal.confirm({
      title: isZh ? '人工确认发布（合规门禁）' : 'Human-in-the-Loop Publish Confirmation',
      content: isZh
        ? `即将发布到「${plat?.nameZh ?? post.platformId}」：${post.title}`
        : `Publish to "${plat?.nameEn ?? post.platformId}": ${post.title}`,
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
            Message.success(isZh ? '已通过 AiToEarn MCP 发布成功！' : 'Published via AiToEarn MCP!');
            return;
          }
          Message.warning(mcpRes.error || 'MCP publish failed, falling back to isolated browser');
        }
        const acc = accounts.find((a) => a.platformId === post.platformId);
        const partition = acc?.partition || `persist:bm-acc-${post.platformId}-default`;
        if (plat) await handleOpenIsolatedWindow(partition, plat.creatorUrl, acc?.label || plat.nameZh);
        setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: 'published' } : p)));
      },
    });
  };

  const handleExtractLiveBrowserComments = async () => {
    if (!selectedPartition || !bridge?.extractBrowserComments) {
      Message.warning(isZh ? '请先选择一个隔离浏览器账号并打开窗口' : 'Select and open an isolated browser window first');
      return;
    }
    const res = await bridge.extractBrowserComments({ partition: selectedPartition });
    if (!res.ok || res.comments.length === 0) {
      Message.warning(res.error || (isZh ? '未检测到可见评论，请先在隔离浏览器打开帖子评论区' : 'No visible comments found'));
      return;
    }
    const scored: AnalyzedComment[] = res.comments
      .map((c) => ({ id: c.id, text: c.text, redacted: c.redacted, ...scoreComment(c.text) }))
      .sort((a, b) => b.score - a.score);
    setAnalyzedList(scored);
    Message.success(isZh ? `已提取并脱敏 ${scored.length} 条真实评论` : `Extracted & sanitized ${scored.length} comments`);
  };

  const handleAnalyzePastedComments = () => {
    const lines = rawCommentInput.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      Message.warning(isZh ? '请先粘贴真实评论（每行一条）' : 'Paste real comments first');
      return;
    }
    const scored: AnalyzedComment[] = lines
      .map((line, idx) => {
        const clean = sanitizePii(line);
        return { id: `paste_${Date.now()}_${idx}`, text: clean.text, redacted: clean.redacted, ...scoreComment(clean.text) };
      })
      .sort((a, b) => b.score - a.score);
    setAnalyzedList(scored);
  };

  const handlePrefillReplyToBrowser = async (replyText: string) => {
    if (!selectedPartition || !bridge?.prefillBrowserReply) {
      Message.info(isZh ? '请先打开隔离浏览器窗口' : 'Open the isolated browser window first');
      return;
    }
    const res = await bridge.prefillBrowserReply({ partition: selectedPartition, replyText });
    if (res.ok) {
      Message.success(isZh ? '已自动填入评论框（已停在发送键前，请人工确认发送）' : 'Prefilled into browser input (stopped before Send)');
    } else {
      Message.warning(res.error || (isZh ? '请先在隔离浏览器中点击评论输入框' : 'Click the comment box inside the browser first'));
    }
  };

  const handleAddToCrm = (item: AnalyzedComment) => {
    const lead: LocalLead = {
      id: `lead_${Date.now()}`,
      platformId: radarPlatform,
      nickname: `Prospect_${leads.length + 1}`,
      sanitizedComment: item.text,
      tier: item.tier,
      score: item.score,
      stage: 'new',
      dealValue: 0,
      createdAt: new Date().toISOString(),
    };
    setLeads((prev) => [lead, ...prev]);
    Message.success(isZh ? '已入库本地线索 CRM' : 'Added to Lead CRM');
  };

  const stageOrder: LeadStage[] = ['new', 'engaged', 'qualified', 'opportunity', 'won'];
  const stageLabel: Record<LeadStage, string> = isZh
    ? { new: '新意向', engaged: '已回复', qualified: '已留资', opportunity: '商机', won: '已成交' }
    : { new: 'New', engaged: 'Engaged', qualified: 'Qualified', opportunity: 'Opportunity', won: 'Won' };

  const handleAdvanceLead = (id: string) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const idx = stageOrder.indexOf(l.stage);
        return { ...l, stage: stageOrder[Math.min(idx + 1, stageOrder.length - 1)] };
      })
    );
  };

  const handleExportCsv = () => {
    const header = 'id,platform,nickname,sanitizedComment,tier,score,stage,dealValue,createdAt';
    const rows = leads.map((l) =>
      [l.id, l.platformId, l.nickname, l.sanitizedComment, l.tier, l.score, l.stage, l.dealValue, l.createdAt]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'biaomai-leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExtractCompetitorFormula = async () => {
    if (!selectedPartition || !bridge?.extractBrowserPageFormula) {
      Message.warning(isZh ? '请先选择一个隔离浏览器账号并打开竞品帖子页' : 'Select and open an isolated browser window first');
      return;
    }
    setExtractingFormula(true);
    const res = await bridge.extractBrowserPageFormula({ partition: selectedPartition });
    setExtractingFormula(false);
    if (!res.ok || !res.excerpt) {
      Message.warning(res.error || (isZh ? '未提取到竞品正文内容' : 'Could not extract page content'));
      return;
    }
    setExtractedFormula({ title: res.title || 'Competitor Post', url: res.url || '', excerpt: res.excerpt });
    Message.success(isZh ? '已提取竞品爆款结构，可一键送入创作工坊改写' : 'Competitor formula extracted');
  };

  const handleSendToCreate = (promptText: string, platformId?: string) => {
    if (platformId) setCreatePlatform(platformId);
    setTopicInput(promptText);
    setActiveTab('create');
    Message.success(isZh ? '已载入创作工坊，点击「AI 生成获客文案」即可改写' : 'Loaded into Create Studio');
  };

  const handleEnrichCommentsWithLlm = async () => {
    if (analyzedList.length === 0) return;
    if (!settings.llmApiKey && !settings.llmBaseUrl.includes('localhost') && !settings.llmBaseUrl.includes('127.0.0.1')) {
      setSettingsModalOpen(true);
      Message.info(isZh ? '请先配置大模型 API Key 以启用语义意向精排' : 'Configure LLM API Key first');
      return;
    }
    if (!bridge?.runLlm) return;
    setScoringWithLlm(true);
    const sample = analyzedList.slice(0, 12).map((c) => ({ id: c.id, text: c.text }));
    const res = await bridge.runLlm({
      baseUrl: settings.llmBaseUrl,
      apiKey: settings.llmApiKey,
      model: settings.llmModel,
      systemPrompt:
        'Score social media comments for B2B/B2C buyer intent. Return strict JSON array of {"id": string, "tier": "S"|"A"|"B"|"C", "score": number, "draftReply": string}.',
      userPrompt: JSON.stringify(sample),
    });
    setScoringWithLlm(false);
    if (!res.ok || !res.content) {
      Message.error(res.error || 'LLM intent scoring failed');
      return;
    }
    try {
      const cleaned = res.content.replace(/```json\s*|```/g, '').trim();
      const parsed = JSON.parse(cleaned) as Array<{ id: string; tier: 'S' | 'A' | 'B' | 'C'; score: number; draftReply: string }>;
      const map = new Map(parsed.map((item) => [item.id, item]));
      setAnalyzedList((prev) =>
        prev
          .map((item) => {
            const ai = map.get(item.id);
            return ai ? { ...item, tier: ai.tier, score: ai.score, draftReply: ai.draftReply || item.draftReply } : item;
          })
          .sort((a, b) => b.score - a.score)
      );
      Message.success(isZh ? `大模型语义精排完成 (${res.latencyMs}ms)` : `LLM intent scoring complete (${res.latencyMs}ms)`);
    } catch {
      Message.warning(isZh ? '模型返回格式非标准 JSON，已保留基础评分' : 'Non-JSON LLM response, kept baseline scores');
    }
  };

  const handleSyncPostClicks = async (post: LocalPost) => {
    if (!activeMcpKey || !bridge?.callAiToEarnMcp) {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, clicks: (p.clicks ?? 0) + 1 } : p)));
      Message.info(isZh ? '未配置 AiToEarn MCP，已手动记录 +1 归因点击' : 'Recorded +1 local click');
      return;
    }
    const res = await bridge.callAiToEarnMcp({
      endpoint: activeMcpEndpoint,
      apiKey: activeMcpKey,
      method: 'tools/call',
      params: { name: 'short_link_stats', arguments: { shortLinkUrl: post.shortLinkUrl || '', postId: post.id } },
    });
    const data = (res.data ?? {}) as Record<string, unknown>;
    if (res.ok && typeof data.clicks === 'number') {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, clicks: data.clicks as number } : p)));
      Message.success(isZh ? `已同步短链点击：${data.clicks}` : `Synced clicks: ${data.clicks}`);
    } else {
      Message.warning(res.error || (isZh ? '未能从 MCP 获取短链统计' : 'Failed to fetch short-link stats'));
    }
  };

  const handleInstallLocalPack = async () => {
    if (!bridge?.installLocalPack) return;
    const res = await bridge.installLocalPack();
    if (res.canceled) return;
    if (!res.ok) {
      Message.error(res.error || (isZh ? '行业包安装失败' : 'Pack install failed'));
      return;
    }
    await refreshInstalledPacks();
    Message.success(isZh ? `已热插拔安装行业包：${res.packName}` : `Installed pack: ${res.packName}`);
  };

  const handleUninstallPack = async (packName: string) => {
    if (!bridge?.uninstallPack) return;
    await bridge.uninstallPack({ packName });
    await refreshInstalledPacks();
    Message.success(isZh ? `已卸载行业包：${packName}` : `Uninstalled pack: ${packName}`);
  };

  useEffect(() => {
    localStorage.setItem('biaomai:local:prospects', JSON.stringify(prospects));
    void bridge?.dbSaveCollection?.({ collection: 'prospects', items: prospects });
  }, [prospects]);
  useEffect(() => {
    void bridge?.dbSaveCollection?.({ collection: 'accounts', items: accounts });
  }, [accounts]);
  useEffect(() => {
    void bridge?.dbSaveCollection?.({ collection: 'posts', items: posts });
  }, [posts]);
  useEffect(() => {
    void bridge?.dbSaveCollection?.({ collection: 'leads', items: leads });
  }, [leads]);

  useEffect(() => {
    const hydrateFromMainDb = async () => {
      if (!bridge?.dbGetAll) return;
      const res = await bridge.dbGetAll();
      if (!res.ok || !res.db) return;
      if (Array.isArray(res.db.accounts) && res.db.accounts.length > 0) setAccounts(res.db.accounts as LocalAccount[]);
      if (Array.isArray(res.db.posts) && res.db.posts.length > 0) setPosts(res.db.posts as LocalPost[]);
      if (Array.isArray(res.db.leads) && res.db.leads.length > 0) setLeads(res.db.leads as LocalLead[]);
      if (Array.isArray(res.db.prospects) && res.db.prospects.length > 0) setProspects(res.db.prospects as GlobalProspect[]);
    };
    void hydrateFromMainDb();
  }, []);

  const b2bPartition = 'persist:bm-b2b-global-radar';
  const handleOpenB2bDirectory = async (
    channel: 'gmaps' | 'linkedin' | 'thomasnet' | 'europages' | 'alibaba' | 'amap' | 'baidu_map'
  ) => {
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
    const lines = cnCompanyInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      Message.warning(isZh ? '请输入至少一家国内公司名称（每行一个）' : 'Enter at least one CN company name');
      return;
    }
    if (!bridge?.lookupCnCompany) return;
    setLookingUpCn(true);
    let added = 0;
    for (const companyName of lines.slice(0, 10)) {
      const res = await bridge.lookupCnCompany({
        companyName,
        excludeEmails: settings.smtpUser ? [settings.smtpUser] : [],
      });
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
          sourceUrl: res.website || '360/百度公开工商官网探测',
        };
        setProspects((prev) => [item, ...prev.filter((p) => p.companyName !== item.companyName)]);
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
    if (!res.ok || res.prospects.length === 0) {
      Message.warning(res.error || (isZh ? '未提取到企业列表，请先在隔离浏览器打开 Google Maps/LinkedIn/黄页搜索结果' : 'No prospects extracted'));
      return;
    }
    const mapped: GlobalProspect[] = res.prospects.map((p) => ({
      ...p,
      industry: b2bIndustry,
      country: b2bCountry,
    }));
    setProspects((prev) => {
      const existingNames = new Set(prev.map((x) => x.companyName.toLowerCase()));
      const fresh = mapped.filter((x) => !existingNames.has(x.companyName.toLowerCase()));
      return [...fresh, ...prev];
    });
    Message.success(isZh ? `已提取 ${mapped.length} 家真实企业线索` : `Extracted ${mapped.length} prospects`);
  };

  const handleEnrichProspect = async (item: GlobalProspect) => {
    if (!bridge?.enrichCompanyDomain) return;
    if (!item.website && !item.email) {
      Message.warning(isZh ? '该企业暂无官网域名或邮箱可供验真' : 'No website or email to enrich');
      return;
    }
    setEnrichingId(item.id);
    const res = await bridge.enrichCompanyDomain({ website: item.website, email: item.email });
    setEnrichingId('');
    if (res.ok) {
      setProspects((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? {
                ...p,
                email: res.email || p.email,
                phone: res.phone || p.phone,
                whatsappUrl: res.whatsappUrl || p.whatsappUrl,
                linkedinUrl: res.linkedinUrl || p.linkedinUrl,
                mxValid: res.mxValid,
                mxHost: res.mxHost,
              }
            : p
        )
      );
      Message.success(
        res.mxValid
          ? isZh
            ? `✅ 补全成功，邮箱 MX 有效 (${res.mxHost})`
            : `✅ Enriched & MX valid (${res.mxHost})`
          : isZh
            ? '已完成官网公开信息抓取（暂未检测到有效邮箱 MX）'
            : 'Website checked (no valid MX email found yet)'
      );
    }
  };

  const handleGenerateColdEmail = async (item: GlobalProspect) => {
    if (!settings.llmApiKey && !settings.llmBaseUrl.includes('localhost') && !settings.llmBaseUrl.includes('127.0.0.1')) {
      setSettingsModalOpen(true);
      Message.info(isZh ? '请先配置大模型 API Key 以生成多语种开发信' : 'Configure LLM API Key first');
      return;
    }
    if (!bridge?.runLlm) return;
    setDraftingOutreachId(item.id);
    const res = await bridge.runLlm({
      baseUrl: settings.llmBaseUrl,
      apiKey: settings.llmApiKey,
      model: settings.llmModel,
      systemPrompt: `You are an elite global B2B foreign-trade sales strategist. Output strict JSON {"subject": string, "body": string, "sequence": [{"dayOffset": 1, "channel": "email", "subject": string, "body": string}, {"dayOffset": 4, "channel": "email", "subject": string, "body": string}, {"dayOffset": 9, "channel": "whatsapp", "subject": "WhatsApp Follow-up", "body": string}]} in language ${b2bLang}.`,
      userPrompt: `Target company: ${item.companyName}\nCountry: ${item.country}\nIndustry: ${item.industry}\nWebsite: ${item.website}\nContext: ${item.snippet}`,
    });
    setDraftingOutreachId('');
    if (!res.ok || !res.content) {
      Message.error(res.error || 'Failed to draft cold email');
      return;
    }
    try {
      const cleaned = res.content.replace(/```json\s*|```/g, '').trim();
      const parsed = JSON.parse(cleaned) as {
        subject?: string;
        body?: string;
        sequence?: Array<{ dayOffset: number; channel: 'email' | 'whatsapp' | 'linkedin'; subject: string; body: string }>;
      };
      const seq: OutreachStep[] = Array.isArray(parsed.sequence)
        ? parsed.sequence.map((s) => ({ ...s, status: 'pending' }))
        : [{ dayOffset: 1, channel: 'email', subject: parsed.subject || `Partnership with ${item.companyName}`, body: parsed.body || res.content, status: 'pending' }];
      setProspects((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? {
                ...p,
                outreachSubject: parsed.subject || seq[0]?.subject || `Partnership with ${item.companyName}`,
                outreachBody: parsed.body || seq[0]?.body || res.content,
                sequence: seq,
              }
            : p
        )
      );
    } catch {
      setProspects((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, outreachSubject: `Inquiry for ${item.companyName}`, outreachBody: res.content } : p))
      );
    }
    Message.success(isZh ? '已生成 3 轮多语开发信与 WhatsApp 跟进序列' : '3-step outreach sequence drafted');
  };

  const handleCheckImapReplies = async () => {
    const sentEmails = prospects.filter((p) => p.outreachSent && p.email).map((p) => p.email);
    if (sentEmails.length === 0) {
      Message.info(isZh ? '暂无已发送开发信的客户邮箱可检测' : 'No sent prospect emails to check yet');
      return;
    }
    if (!settings.imapHost || !settings.smtpUser || !settings.smtpPass) {
      setSettingsModalOpen(true);
      Message.info(isZh ? '请先在设置中填写 IMAP 与邮箱授权码' : 'Configure IMAP credentials first');
      return;
    }
    if (!bridge?.checkImapReplies) return;
    setCheckingImap(true);
    const res = await bridge.checkImapReplies({
      host: settings.imapHost,
      port: Number(settings.imapPort || 993),
      user: settings.smtpUser,
      pass: settings.smtpPass,
      prospectEmails: sentEmails,
    });
    setCheckingImap(false);
    if (!res.ok) {
      Message.error(res.error || 'IMAP check failed');
      return;
    }
    if (res.repliedEmails.length > 0) {
      const repliedSet = new Set(res.repliedEmails.map((e) => e.toLowerCase()));
      setProspects((prev) => prev.map((p) => (repliedSet.has(p.email.toLowerCase()) ? { ...p, replied: true } : p)));
      Message.success(isZh ? `📬 检测到 ${res.repliedEmails.length} 位客户已回信，已自动暂停后续跟进` : `📬 Detected ${res.repliedEmails.length} replies`);
    } else {
      Message.info(isZh ? '收件箱暂无新的客户回信' : 'No new prospect replies found');
    }
  };

  const handleRunCrawlerMcp = async () => {
    if (!bridge?.runCrawlerMcp) return;
    setCrawlingMcp(true);
    const target = `https://www.europages.co.uk/companies/${encodeURIComponent(b2bIndustry)}.html`;
    const res = await bridge.runCrawlerMcp({
      endpoint: settings.crawlerMcpUrl || 'http://localhost:11235/crawl',
      targetUrl: target,
    });
    setCrawlingMcp(false);
    if (!res.ok) {
      Message.warning(res.error || 'Crawl4AI local service not running');
      return;
    }
    Message.success(isZh ? 'Crawl4AI 深度采集任务已返回结果' : 'Crawl4AI crawl completed');
  };

  const handlePrefillSocialDm = async (url: string, text: string) => {
    await handleOpenIsolatedWindow(b2bPartition, url, 'Global DM Outreach');
    setTimeout(async () => {
      const res = await bridge?.prefillSocialDm?.({ partition: b2bPartition, text });
      if (res?.ok) {
        Message.success(isZh ? '已自动填入话术（停在发送键前，请人工确认发送）' : 'Prefilled DM (stopped before Send)');
      }
    }, 1500);
  };

  const handleTriggerCronTest = async () => {
    if (!settings.imWebhookUrl) {
      setSettingsModalOpen(true);
      Message.info(isZh ? '请先填写飞书 / 企微 / 钉钉 Webhook URL' : 'Configure IM Webhook URL first');
      return;
    }
    const res = await bridge?.triggerImWebhook?.({
      webhookUrl: settings.imWebhookUrl,
      title: '每日获客与待审批汇总',
      content: `待发布社媒: ${posts.filter((p) => p.status !== 'published').length} | 外贸客户池: ${prospects.length} | CRM 线索: ${leads.length}`,
    });
    if (res?.ok) {
      Message.success(isZh ? '✅ 已推送定时巡检汇总到您的飞书/企微/钉钉群' : '✅ Webhook alert sent');
    } else {
      Message.error(res?.error || 'Webhook push failed');
    }
  };

  const handleSendColdEmail = (item: GlobalProspect) => {
    if (!item.email || !item.outreachBody) {
      Message.warning(isZh ? '请先补全对方邮箱并生成开发信草稿' : 'Enrich email and generate draft first');
      return;
    }
    if (!settings.smtpUser || !settings.smtpPass || !settings.smtpHost) {
      setSettingsModalOpen(true);
      Message.info(isZh ? '请先在「接口配置」中填写您的发件 SMTP 邮箱与授权码' : 'Configure SMTP credentials in Settings first');
      return;
    }
    Modal.confirm({
      title: isZh ? '人工确认发送外贸开发信（防群发垃圾邮件门禁）' : 'Human-in-the-Loop Cold Email Confirmation',
      content: isZh
        ? `收件企业：${item.companyName} (${item.email})\n主题：${item.outreachSubject}`
        : `To: ${item.companyName} (${item.email})\nSubject: ${item.outreachSubject}`,
      okText: isZh ? '确认通过 SMTP 发送' : 'Confirm & Send via SMTP',
      cancelText: isZh ? '取消' : 'Cancel',
      onOk: async () => {
        if (!bridge?.sendSmtpEmail) return;
        setSendingEmailId(item.id);
        const res = await bridge.sendSmtpEmail({
          host: settings.smtpHost || 'smtp.gmail.com',
          port: Number(settings.smtpPort || 465),
          user: settings.smtpUser || '',
          pass: settings.smtpPass || '',
          fromName: isZh ? '标脉灵枢商务中心' : 'BiaoMai Lingshu',
          to: item.email,
          subject: item.outreachSubject || `Collaboration with ${item.companyName}`,
          text: item.outreachBody || '',
        });
        setSendingEmailId('');
        if (res.ok) {
          setProspects((prev) => prev.map((p) => (p.id === item.id ? { ...p, outreachSent: true } : p)));
          Message.success(isZh ? `✅ 已成功发送开发信至 ${item.email}` : `✅ Sent to ${item.email}`);
        } else {
          Message.error(res.error || 'SMTP send failed');
        }
      },
    });
  };

  const handleAddProspectToCrm = (item: GlobalProspect) => {
    const lead: LocalLead = {
      id: `lead_${Date.now()}`,
      platformId: 'global-b2b',
      nickname: item.companyName,
      sanitizedComment: `${item.country} · ${item.industry}${item.email ? ` · ${item.email}` : ''}${item.website ? ` · ${item.website}` : ''}`,
      tier: item.mxValid ? 'S' : 'A',
      score: item.mxValid ? 92 : 78,
      stage: item.outreachSent ? 'engaged' : 'new',
      dealValue: 0,
      createdAt: new Date().toISOString(),
    };
    setLeads((prev) => [lead, ...prev]);
    Message.success(isZh ? `已将「${item.companyName}」入库线索 CRM` : `Added ${item.companyName} to CRM`);
  };

  const navTabs: Array<{ id: 'create' | 'publish' | 'engage' | 'outbound' | 'crm' | 'packs'; step: string; title: string; count?: number }> = [
    { id: 'create', step: '01', title: isZh ? 'AI 内容创作' : 'Create Studio' },
    { id: 'publish', step: '02', title: isZh ? '全渠道分发' : 'Omni-Publish', count: posts.length },
    { id: 'engage', step: '03', title: isZh ? '社媒意向雷达' : 'Intent Radar', count: analyzedList.length },
    { id: 'outbound', step: '04', title: isZh ? '全球与国内寻客' : 'Global & CN Outbound', count: prospects.length },
    { id: 'crm', step: '05', title: isZh ? '线索 CRM' : 'Lead CRM', count: leads.length },
    { id: 'packs', step: '06', title: isZh ? '插件与行业包' : 'Packs Market', count: installedPacks.length },
  ];

  return (
    <div className='h-full w-full overflow-y-auto bg-1 text-t-primary'>
      <div className='max-w-1240px mx-auto px-28px py-24px flex flex-col gap-20px'>
        {/* Top Studio Header — BiaoMai Brand + Linear / Vercel Aesthetic */}
        <div className='flex items-center justify-between flex-wrap gap-16px pb-16px border-b border-solid border-[var(--color-border-2)]'>
          <div className='flex items-center gap-12px'>
            <div className='size-38px rd-10px bg-[#0A0A0C] flex items-center justify-center shrink-0 shadow-sm'>
              <svg className='size-28px' viewBox='0 0 80 80' fill='none'>
                <path
                  d='M26 18 H47 L58 29 V58 C58 60.2 56.2 62 54 62 H26 C23.8 62 22 60.2 22 58 V22 C22 19.8 23.8 18 26 18 Z'
                  stroke='#9CA3AF'
                  strokeWidth='4.2'
                  strokeLinejoin='round'
                />
                <path d='M46 18 V27 C46 28.6 47.4 30 49 30 H58' stroke='#9CA3AF' strokeWidth='4.2' strokeLinejoin='round' />
                <circle cx='66' cy='43' r='4.5' fill='#3FE0D0' />
              </svg>
            </div>
            <div className='flex flex-col gap-2px'>
              <div className='flex items-center gap-8px'>
                <span className='text-20px font-700 tracking-tight text-t-primary'>
                  {isZh ? '标脉灵枢 · 全球获客工作台' : 'BiaoMai Lingshu · Global Lead-Gen Studio'}
                </span>
                <span className='px-8px py-2px rd-full text-11px font-600 bg-[rgba(63,224,208,0.14)] text-[#0D9488]'>
                  Apache-2.0 · Zero-Docker
                </span>
              </div>
              <span className='text-12px text-t-secondary'>
                {isZh
                  ? 'AI 内容创作 → 17 平台分发 → 社媒意向雷达 → 全球与国内 B2B 寻客 → 线索 CRM 闭环'
                  : 'Create → 17-Channel Publish → Social Intent Radar → Global & CN B2B Outbound → Lead CRM'}
              </span>
            </div>
          </div>

          <div className='flex items-center gap-8px flex-wrap'>
            <button
              type='button'
              onClick={() => setCronModalOpen(true)}
              className='h-32px px-12px rd-8px border border-solid border-[var(--color-border-2)] bg-2 hover:bg-fill-2 text-12px font-500 text-t-primary cursor-pointer flex items-center gap-6px transition-colors'
            >
              <IconClockCircle />
              {isZh ? '定时巡检 & IM' : 'Cron & IM'}
            </button>

            <button
              type='button'
              onClick={() => setSettingsModalOpen(true)}
              className='h-32px px-12px rd-8px border border-solid border-[var(--color-border-2)] bg-2 hover:bg-fill-2 text-12px font-500 text-t-primary cursor-pointer flex items-center gap-6px transition-colors'
            >
              <span
                className='inline-block size-7px rd-full'
                style={{ background: settings.llmApiKey ? '#10B981' : '#F59E0B' }}
              />
              {settings.llmApiKey ? settings.llmModel : (isZh ? '配置模型密钥' : 'Configure LLM')}
            </button>

            <button
              type='button'
              onClick={() => setSettingsModalOpen(true)}
              className='h-32px px-12px rd-8px border border-solid border-[var(--color-border-2)] bg-2 hover:bg-fill-2 text-12px font-500 text-t-primary cursor-pointer flex items-center gap-6px transition-colors'
            >
              <span
                className='inline-block size-7px rd-full'
                style={{ background: activeMcpKey ? '#10B981' : '#3FE0D0' }}
              />
              {activeMcpKey ? 'AiToEarn MCP' : (isZh ? '隔离浏览器直连' : 'Isolated Browser')}
            </button>

            <button
              type='button'
              onClick={() => setSettingsModalOpen(true)}
              className='h-32px px-14px rd-8px border-none bg-[#0F172A] hover:bg-[#1E293B] text-12px font-600 text-white cursor-pointer flex items-center gap-6px transition-colors'
            >
              <IconSettings />
              {isZh ? '接口配置' : 'API Settings'}
            </button>
          </div>
        </div>

        {/* Clean Scrollable Pill Navigation — Zero Squishing */}
        <div className='flex items-center gap-6px p-5px rd-12px bg-2 border border-solid border-[var(--color-border-2)] overflow-x-auto'>
          {navTabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type='button'
                onClick={() => setActiveTab(t.id)}
                className={`shrink-0 whitespace-nowrap h-36px px-14px rd-8px cursor-pointer flex items-center gap-8px text-13px font-600 transition-all ${
                  active
                    ? 'bg-1 text-t-primary shadow-sm border border-solid border-[var(--color-border-2)]'
                    : 'bg-transparent border border-solid border-transparent text-t-secondary hover:text-t-primary hover:bg-fill-1'
                }`}
              >
                <span className={`text-11px font-700 ${active ? 'text-[#4F46E5]' : 'text-t-tertiary'}`}>{t.step}</span>
                <span>{t.title}</span>
                {typeof t.count === 'number' && (
                  <span className={`px-7px py-1px rd-full text-11px font-600 ${active ? 'bg-[rgba(79,70,229,0.12)] text-[#4F46E5]' : 'bg-fill-2 text-t-secondary'}`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: CREATE STUDIO */}
        {activeTab === 'create' && (
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-20px items-start'>
            <div className='lg:col-span-7 p-20px rd-14px bg-2 border border-solid border-[var(--color-border-2)] flex flex-col gap-16px'>
              <div className='flex items-center justify-between'>
                <div>
                  <div className='text-15px font-600 text-t-primary'>
                    {isZh ? 'AI 多平台获客内容工坊' : 'AI Lead-Gen Content Composer'}
                  </div>
                  <div className='text-12px text-t-secondary mt-2px'>
                    {isZh ? '自动匹配目标平台画幅、痛点钩子与多语出海改写' : 'Adapts aspect ratios, pain-point hooks & target language'}
                  </div>
                </div>
                <span className='px-8px py-3px rd-6px text-11px font-600 bg-fill-2 text-t-secondary'>
                  {selectedCreatePlatform.aspect}
                </span>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-12px'>
                <div className='flex flex-col gap-6px'>
                  <label className='text-12px font-500 text-t-secondary'>{isZh ? '目标发布平台' : 'Target Channel'}</label>
                  <Select value={createPlatform} onChange={setCreatePlatform}>
                    {ALL_PLATFORMS.map((p) => (
                      <Select.Option key={p.id} value={p.id}>
                        {isZh ? `${p.nameZh} · ${p.aspect}` : `${p.nameEn} · ${p.aspect}`}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
                <div className='flex flex-col gap-6px'>
                  <label className='text-12px font-500 text-t-secondary'>{isZh ? '内容生成语种' : 'Output Language'}</label>
                  <Select value={targetLang} onChange={setTargetLang}>
                    <Select.Option value='zh-CN'>简体中文 (zh-CN)</Select.Option>
                    <Select.Option value='en-US'>English (Global)</Select.Option>
                    <Select.Option value='ja-JP'>日本語 (ja-JP)</Select.Option>
                    <Select.Option value='es-ES'>Español (es-ES)</Select.Option>
                  </Select>
                </div>
              </div>

              <div className='flex flex-col gap-6px'>
                <label className='text-12px font-500 text-t-secondary'>
                  {isZh ? '产品卖点与目标客户痛点' : 'Product Pitch & Target ICP Pain Points'}
                </label>
                <TextArea
                  rows={4}
                  value={topicInput}
                  onChange={setTopicInput}
                  placeholder={
                    isZh
                      ? '例如：标脉灵枢是一款开源免 Docker 的企业 AI 获客工作台，帮跨境团队 1 个人管理 17 个社媒矩阵，自动捕捉评论区询价客户...'
                      : 'e.g., BiaoMai Lingshu is an Apache-2.0 zero-Docker AI workbench helping lean teams run 17 channels & capture buyer intent...'
                  }
                />
              </div>

              <div className='flex items-center gap-10px flex-wrap'>
                <Button type='primary' loading={creatingCopy} onClick={handleAiGenerateCopy} style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>
                  {isZh ? '✨ AI 生成获客文案' : '✨ Generate Copy'}
                </Button>
                <Button type='outline' loading={creatingImg} onClick={handleAiGenerateImage}>
                  {isZh ? '🎨 AI 生成封面配图' : '🎨 Generate Cover Visual'}
                </Button>
                <Button type='outline' loading={creatingVideo} onClick={handleAiGenerateVideo}>
                  {isZh
                    ? targetLang !== 'zh-CN'
                      ? '🎬 AI 视频 + 多语配音'
                      : '🎬 AI 生成短视频'
                    : '🎬 AI Video / Dubbing'}
                </Button>
              </div>

              {(creatingVideo || videoTaskStatus) && (
                <div className='p-12px rd-10px bg-1 border border-solid border-[var(--color-border-2)] flex flex-col gap-6px'>
                  <div className='flex items-center justify-between text-12px'>
                    <span className='font-600 text-t-primary'>{videoTaskStatus}</span>
                    <span className='text-t-secondary'>{videoTaskProgress}%</span>
                  </div>
                  <Progress percent={videoTaskProgress} size='small' showText={false} color='#4F46E5' />
                </div>
              )}

              <div className='h-1px bg-[var(--color-border-2)]' />

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-12px'>
                <div className='flex flex-col gap-6px'>
                  <label className='text-12px font-500 text-t-secondary'>{isZh ? '归因短链 / UTM（可选）' : 'UTM / Short-Link (Optional)'}</label>
                  <Input value={draftShortLink} onChange={setDraftShortLink} placeholder='https://...' />
                </div>
                <div className='flex flex-col gap-6px'>
                  <label className='text-12px font-500 text-t-secondary'>{isZh ? '计划发布时间' : 'Schedule Time'}</label>
                  <Input value={scheduledTime} onChange={setScheduledTime} placeholder='YYYY-MM-DD HH:mm' />
                </div>
              </div>

              <div className='flex justify-end pt-4px'>
                <Button type='primary' size='large' onClick={handleSaveToSchedule} style={{ background: '#0F172A', borderColor: '#0F172A' }}>
                  {isZh ? '保存草稿并进入排期分发 →' : 'Save & Continue to Publish →'}
                </Button>
              </div>
            </div>

            {/* Right: Realistic iPhone Device Mockup */}
            <div className='lg:col-span-5 flex justify-center'>
              <div className='w-full max-w-360px p-14px rd-28px bg-[#0F172A] shadow-xl border-4 border-solid border-[#1E293B]'>
                {/* Dynamic Island */}
                <div className='flex items-center justify-between px-12px pb-10px text-white/80 text-11px'>
                  <span>9:41</span>
                  <div className='w-84px h-18px rd-full bg-black' />
                  <span>5G</span>
                </div>

                {/* Inner Screen */}
                <div className='rd-20px bg-1 overflow-hidden border border-solid border-[var(--color-border-2)] flex flex-col'>
                  <div className='px-12px py-8px border-b border-solid border-[var(--color-border-2)] flex items-center justify-between text-12px'>
                    <span className='font-600 flex items-center gap-6px'>
                      <span
                        className='inline-flex items-center justify-center size-18px rd-4px text-white text-9px font-700'
                        style={{ background: selectedCreatePlatform.brandColor }}
                      >
                        {selectedCreatePlatform.badge}
                      </span>
                      {isZh ? selectedCreatePlatform.nameZh : selectedCreatePlatform.nameEn}
                    </span>
                    <span className='text-11px text-t-secondary'>{selectedCreatePlatform.aspect}</span>
                  </div>

                  {draftVideoUrl ? (
                    <video src={draftVideoUrl} controls className='w-full h-180px object-cover bg-black' />
                  ) : draftImageUrl ? (
                    <img src={draftImageUrl} alt='AI Cover' className='w-full h-180px object-cover' />
                  ) : (
                    <div className='h-150px bg-2 flex flex-col items-center justify-center gap-4px text-12px text-t-secondary border-b border-solid border-[var(--color-border-2)]'>
                      <span>{isZh ? '封面视觉 / 视频预览区' : 'Visual & Video Preview'}</span>
                      <span className='text-11px text-t-tertiary'>{isZh ? '点击左侧「AI 生成封面配图」或「AI 生成短视频」' : 'Click Generate Cover or Video'}</span>
                    </div>
                  )}

                  <div className='p-12px flex flex-col gap-8px'>
                    <Input
                      value={draftTitle}
                      onChange={setDraftTitle}
                      placeholder={isZh ? '标题（生成后可在此行内微调）' : 'Headline (editable inline)'}
                      style={{ fontWeight: 600 }}
                    />
                    <TextArea
                      rows={5}
                      value={draftBody}
                      onChange={setDraftBody}
                      placeholder={isZh ? '正文与 CTA 钩子（生成后可微调）' : 'Body & CTA hook (editable inline)'}
                    />
                    {draftShortLink && (
                      <div className='px-8px py-4px rd-6px bg-[rgba(79,70,229,0.08)] text-[#4F46E5] text-11px truncate'>
                        🔗 {draftShortLink}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: OMNI-PUBLISH (17 CHANNELS) */}
        {activeTab === 'publish' && (
          <div className='flex flex-col gap-20px'>
            <div className='p-20px rd-14px bg-2 border border-solid border-[var(--color-border-2)] flex flex-col gap-14px'>
              <div className='flex items-center justify-between flex-wrap gap-10px'>
                <div>
                  <div className='text-15px font-600'>{isZh ? '全球 17 大媒介矩阵（本地隔离浏览器直连）' : '17 Global & Domestic Channels'}</div>
                  <div className='text-12px text-t-secondary mt-2px'>
                    {isZh ? '每个账号独立 Cookie 分区，免服务器、免开发者资质即可登录发布' : 'Isolated Cookie partitions per account, zero server setup required'}
                  </div>
                </div>
                <Space>
                  <Button size='small' type={regionFilter === 'all' ? 'primary' : 'secondary'} onClick={() => setRegionFilter('all')}>{isZh ? '全部 (17)' : 'All (17)'}</Button>
                  <Button size='small' type={regionFilter === 'cn' ? 'primary' : 'secondary'} onClick={() => setRegionFilter('cn')}>{isZh ? '🇨🇳 国内 (9)' : '🇨🇳 CN (9)'}</Button>
                  <Button size='small' type={regionFilter === 'global' ? 'primary' : 'secondary'} onClick={() => setRegionFilter('global')}>{isZh ? '🌍 海外 (8)' : '🌍 Global (8)'}</Button>
                </Space>
              </div>

              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-10px'>
                {visiblePlatforms.map((p) => {
                  const acc = accounts.find((a) => a.platformId === p.id);
                  const partition = acc?.partition || `persist:bm-acc-${p.id}-default`;
                  return (
                    <div
                      key={p.id}
                      className='p-12px rd-12px bg-1 border border-solid border-[var(--color-border-2)] flex flex-col justify-between gap-10px hover:border-[#4F46E5] transition-colors'
                    >
                      <div className='flex items-center justify-between'>
                        <span
                          className='inline-flex items-center justify-center size-26px rd-7px text-white text-11px font-700'
                          style={{ background: p.brandColor }}
                        >
                          {p.badge}
                        </span>
                        <span className='text-10px font-600 text-t-tertiary'>{p.region === 'cn' ? 'CN' : 'GL'}</span>
                      </div>
                      <div>
                        <div className='text-13px font-600 text-t-primary'>{isZh ? p.nameZh : p.nameEn}</div>
                        <div className='text-11px text-t-secondary truncate mt-2px'>{acc ? `🟢 ${acc.label}` : p.aspect}</div>
                      </div>
                      <Button size='mini' type='outline' long onClick={() => handleOpenIsolatedWindow(partition, p.creatorUrl, acc?.label || p.nameZh)}>
                        {isZh ? '打开后台 ↗' : 'Launch ↗'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-20px'>
              <div className='p-20px rd-14px bg-2 border border-solid border-[var(--color-border-2)] flex flex-col gap-12px'>
                <div className='text-15px font-600'>{isZh ? '多账号隔离容器管理' : 'Isolated Account Containers'}</div>
                <div className='flex gap-8px'>
                  <Select value={accPlatform} onChange={setAccPlatform} style={{ width: 140 }}>
                    {ALL_PLATFORMS.map((p) => (
                      <Select.Option key={p.id} value={p.id}>{isZh ? p.nameZh : p.nameEn}</Select.Option>
                    ))}
                  </Select>
                  <Input placeholder={isZh ? '账号备注（如：主号）' : 'Account label'} value={accLabel} onChange={setAccLabel} />
                  <Button type='primary' onClick={handleAddAccount} style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>{isZh ? '添加' : 'Add'}</Button>
                </div>
                {accounts.length === 0 ? (
                  <Empty description={isZh ? '暂无自定义隔离账号' : 'No accounts yet'} />
                ) : (
                  <div className='flex flex-col gap-8px'>
                    {accounts.map((a) => {
                      const plat = ALL_PLATFORMS.find((p) => p.id === a.platformId);
                      return (
                        <div key={a.id} className='flex items-center justify-between p-10px rd-10px bg-1 border border-solid border-[var(--color-border-2)]'>
                          <div>
                            <div className='text-13px font-600'>{a.label} · {plat ? (isZh ? plat.nameZh : plat.nameEn) : a.platformId}</div>
                            <div className='text-11px text-t-secondary'>{a.partition}</div>
                          </div>
                          <Button size='mini' type='outline' onClick={() => plat && handleOpenIsolatedWindow(a.partition, plat.creatorUrl, a.label)}>
                            {isZh ? '打开窗口' : 'Open'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className='p-20px rd-14px bg-2 border border-solid border-[var(--color-border-2)] flex flex-col gap-12px'>
                <div className='text-15px font-600'>{isZh ? '排期日历与人工确认发布队列' : 'Schedule Queue & Approval'}</div>
                {posts.length === 0 ? (
                  <Empty description={isZh ? '请在「01 AI 内容创作」生成草稿并加入排期' : 'Create content in step 01 first'} />
                ) : (
                  <div className='flex flex-col gap-8px'>
                    {posts.map((post) => (
                      <div key={post.id} className='flex items-center justify-between p-12px rd-10px bg-1 border border-solid border-[var(--color-border-2)]'>
                        <div className='min-w-0 pr-8px'>
                          <div className='text-13px font-600 truncate'>{post.title}</div>
                          <Space size='mini' className='mt-4px'>
                            <Tag size='small' color='arcoblue'>{post.platformId}</Tag>
                            <Tag size='small' color={post.status === 'published' ? 'green' : 'orange'}>{post.status}</Tag>
                            <span className='text-11px text-t-secondary'>{post.scheduledAt}</span>
                          </Space>
                        </div>
                        {post.status !== 'published' && (
                          <Button size='small' type='primary' onClick={() => handleConfirmPublish(post)} style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>
                            {isZh ? '确认发布' : 'Publish'}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ENGAGE BROWSER RADAR */}
        {activeTab === 'engage' && (
          <div className='flex flex-col gap-20px'>
            <div className='p-20px rd-14px bg-2 border border-solid border-[var(--color-border-2)] flex flex-col gap-12px'>
              <div className='flex items-center justify-between flex-wrap gap-10px'>
                <Space wrap>
                  <Select
                    value={selectedPartition}
                    onChange={setSelectedPartition}
                    placeholder={isZh ? '选择隔离浏览器账号' : 'Select isolated browser account'}
                    style={{ width: 260 }}
                  >
                    {accounts.map((a) => (
                      <Select.Option key={a.partition} value={a.partition}>🟢 {a.label} ({a.platformId})</Select.Option>
                    ))}
                  </Select>
                  <Button type='primary' onClick={handleExtractLiveBrowserComments} style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>
                    {isZh ? '🎯 一键读取隔离浏览器当前页评论' : '🎯 Extract Live Browser Comments'}
                  </Button>
                  <Button type='outline' loading={extractingFormula} onClick={handleExtractCompetitorFormula}>
                    {isZh ? '🔍 提取竞品爆款结构' : '🔍 Extract Competitor Formula'}
                  </Button>
                </Space>
                <Tag color='green'>{isZh ? '强制 PII 隐私脱敏 · 停在发送键前人工确认' : 'Mandatory PII Sanitizer · Human-in-the-Loop'}</Tag>
              </div>

              {extractedFormula && (
                <div className='p-12px rd-10px bg-1 border border-solid border-[var(--color-border-2)] flex items-center justify-between gap-12px flex-wrap'>
                  <div className='min-w-0 flex-1'>
                    <div className='text-13px font-600 text-t-primary truncate'>🔍 {extractedFormula.title}</div>
                    <div className='text-12px text-t-secondary line-clamp-2 mt-2px'>{extractedFormula.excerpt}</div>
                  </div>
                  <Button
                    size='small'
                    type='primary'
                    style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
                    onClick={() =>
                      handleSendToCreate(
                        `${isZh ? '参考以下竞品爆款结构进行合规原创改写' : 'Rewrite based on competitor formula'}：\n标题：${extractedFormula.title}\n结构要点：${extractedFormula.excerpt}`,
                        radarPlatform
                      )
                    }
                  >
                    {isZh ? '✨ 送入 01 创作工坊改写 →' : '✨ Rewrite in Create Studio →'}
                  </Button>
                </div>
              )}

              <div className='flex items-center gap-8px flex-wrap'>
                <Select value={radarPlatform} onChange={setRadarPlatform} style={{ width: 160 }}>
                  {ALL_PLATFORMS.map((p) => (
                    <Select.Option key={p.id} value={p.id}>{isZh ? p.nameZh : p.nameEn}</Select.Option>
                  ))}
                </Select>
                <Button type='outline' onClick={handleAnalyzePastedComments}>{isZh ? '分析下方粘贴评论' : 'Analyze Pasted Comments'}</Button>
                {analyzedList.length > 0 && (
                  <Button type='outline' loading={scoringWithLlm} onClick={handleEnrichCommentsWithLlm}>
                    {isZh ? '🧠 大模型语义精排与定制回复' : '🧠 LLM Semantic Intent Scoring'}
                  </Button>
                )}
              </div>
              <TextArea
                rows={3}
                value={rawCommentInput}
                onChange={setRawCommentInput}
                placeholder={isZh ? '或在此粘贴真实评论区文本（每行一条），自动剔除手机号/微信号/邮箱并评分...' : 'Or paste real comments (one per line)...'}
              />
            </div>

            {analyzedList.length === 0 ? (
              <Empty description={isZh ? '打开隔离浏览器帖子页点击提取，或粘贴评论分析' : 'Extract from live browser or paste comments'} />
            ) : (
              <div className='flex flex-col gap-10px'>
                {analyzedList.map((item) => (
                  <div key={item.id} className='p-16px rd-12px bg-2 border border-solid border-[var(--color-border-2)] flex flex-col gap-10px'>
                    <div className='flex items-center justify-between gap-12px flex-wrap'>
                      <Space>
                        <Tag color={item.tier === 'S' ? 'red' : item.tier === 'A' ? 'orange' : 'gray'}>{item.tier}-Tier · {item.score}</Tag>
                        {item.redacted > 0 && <Tag color='green'>{isZh ? `已脱敏 ${item.redacted} 处隐私` : `Redacted ${item.redacted} PII`}</Tag>}
                      </Space>
                      <Space>
                        {item.draftReply && (
                          <Button size='small' type='outline' onClick={() => handlePrefillReplyToBrowser(item.draftReply)}>
                            {isZh ? '填入浏览器回复框' : 'Prefill Browser'}
                          </Button>
                        )}
                        <Button size='small' type='primary' onClick={() => handleAddToCrm(item)} style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>
                          {isZh ? '+ 加入线索 CRM' : '+ Add to CRM'}
                        </Button>
                      </Space>
                    </div>
                    <div className='text-14px font-500 text-t-primary'>{item.text}</div>
                    {item.draftReply && (
                      <div className='p-10px rd-8px bg-1 text-12px text-t-secondary border border-solid border-[var(--color-border-2)]'>
                        {isZh ? 'AI 高转化回复草稿：' : 'AI Reply Draft: '}{item.draftReply}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GLOBAL B2B & FOREIGN-TRADE OUTBOUND */}
        {activeTab === 'outbound' && (
          <div className='flex flex-col gap-20px'>
            <div className='p-20px rd-14px bg-2 border border-solid border-[var(--color-border-2)] flex flex-col gap-14px'>
              <div className='flex items-center justify-between flex-wrap gap-10px'>
                <div>
                  <div className='text-15px font-600 text-t-primary'>
                    {isZh ? '🌍 全球与国内企业寻客雷达（支持公司名 / 地图 / 黄页）' : '🌍 Global & CN Enterprise Prospector'}
                  </div>
                  <div className='text-12px text-t-secondary mt-2px'>
                    {isZh
                      ? '输入国内公司名直挖官网/手机/邮箱 · 高德/百度/Google 地图抓商家 · DNS MX 验真 + HTML 商务开发信'
                      : 'CN Company Lookup · Amap/Baidu/Google Maps Extraction · DNS MX Verification · Multilingual Cold Email'}
                  </div>
                </div>
                <Space>
                  <Button size='small' type={b2bMode === 'cn' ? 'primary' : 'secondary'} onClick={() => setB2bMode('cn')}>
                    🇨🇳 {isZh ? '国内企业/地图' : 'CN Company & Map'}
                  </Button>
                  <Button size='small' type={b2bMode === 'global' ? 'primary' : 'secondary'} onClick={() => setB2bMode('global')}>
                    🌍 {isZh ? '海外外贸寻客' : 'Global B2B'}
                  </Button>
                </Space>
              </div>

              {b2bMode === 'cn' && (
                <div className='p-14px rd-10px bg-1 border border-solid border-[var(--color-border-2)] flex flex-col gap-10px'>
                  <div className='text-13px font-600 text-t-primary'>
                    {isZh ? '🏢 输入国内公司名称批量获客（自动检索官网、爱企查/360 公开电话与官方邮箱）' : '🏢 CN Company Name Contact Discovery'}
                  </div>
                  <TextArea
                    rows={3}
                    value={cnCompanyInput}
                    onChange={setCnCompanyInput}
                    placeholder={
                      isZh
                        ? '输入国内目标公司全称（每行一家，如：山东标脉信息技术有限公司），点击下方一键挖掘官网、手机号与商务邮箱...'
                        : 'Enter Chinese company names (one per line)...'
                    }
                  />
                  <div className='flex items-center justify-between flex-wrap gap-8px'>
                    <Space wrap>
                      <Button size='small' type='outline' onClick={() => handleOpenB2bDirectory('amap')}>
                        🗺️ {isZh ? '高德地图搜商家' : 'Amap (CN)'}
                      </Button>
                      <Button size='small' type='outline' onClick={() => handleOpenB2bDirectory('baidu_map')}>
                        📍 {isZh ? '百度地图搜商家' : 'Baidu Map'}
                      </Button>
                    </Space>
                    <Button type='primary' loading={lookingUpCn} onClick={handleLookupCnCompanies} style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>
                      {isZh ? '🔎 一键挖掘公司官网 / 电话 / 邮箱' : '🔎 Lookup CN Companies'}
                    </Button>
                  </div>
                </div>
              )}

              <div className='grid grid-cols-1 md:grid-cols-3 gap-12px'>
                <div className='flex flex-col gap-4px'>
                  <label className='text-12px font-500 text-t-secondary'>{isZh ? '目标行业 / 产品关键词' : 'Target Industry / Keywords'}</label>
                  <Input value={b2bIndustry} onChange={setB2bIndustry} placeholder='e.g. CNC Machining, Solar Inverter, Packaging' />
                </div>
                <div className='flex flex-col gap-4px'>
                  <label className='text-12px font-500 text-t-secondary'>{isZh ? '目标国家 / 城市' : 'Target Country / City'}</label>
                  <Input value={b2bCountry} onChange={setB2bCountry} placeholder='e.g. Germany, USA, UAE, Japan' />
                </div>
                <div className='flex flex-col gap-4px'>
                  <label className='text-12px font-500 text-t-secondary'>{isZh ? '开发信目标语种' : 'Outreach Language'}</label>
                  <Select value={b2bLang} onChange={setB2bLang}>
                    <Select.Option value='en-US'>English (Global B2B)</Select.Option>
                    <Select.Option value='de-DE'>Deutsch (DACH)</Select.Option>
                    <Select.Option value='es-ES'>Español (LATAM / Spain)</Select.Option>
                    <Select.Option value='ja-JP'>日本語 (Japan)</Select.Option>
                    <Select.Option value='ar-SA'>العربية (Middle East)</Select.Option>
                  </Select>
                </div>
              </div>

              <div className='flex items-center justify-between flex-wrap gap-10px'>
                <Space wrap>
                  <Button size='small' type='outline' onClick={() => handleOpenB2bDirectory('gmaps')}>🗺️ Google Maps</Button>
                  <Button size='small' type='outline' onClick={() => handleOpenB2bDirectory('linkedin')}>💼 LinkedIn</Button>
                  <Button size='small' type='outline' onClick={() => handleOpenB2bDirectory('thomasnet')}>🏭 Thomasnet (北美)</Button>
                  <Button size='small' type='outline' onClick={() => handleOpenB2bDirectory('europages')}>🇪🇺 Europages (欧洲)</Button>
                  <Button size='small' type='outline' onClick={() => handleOpenB2bDirectory('alibaba')}>🚢 Alibaba</Button>
                  <Button size='small' type='outline' loading={crawlingMcp} onClick={handleRunCrawlerMcp}>🕷️ Crawl4AI 批量采</Button>
                </Space>
                <Space wrap>
                  <Button type='outline' loading={checkingImap} onClick={handleCheckImapReplies}>
                    {isZh ? '📬 IMAP 检测客户回信' : '📬 Check IMAP Replies'}
                  </Button>
                  <Button type='primary' loading={extractingB2b} onClick={handleExtractB2bProspects} style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>
                    {isZh ? '🔍 从当前隔离浏览器页面提取企业线索' : '🔍 Extract Prospects from Browser'}
                  </Button>
                </Space>
              </div>
            </div>

            {prospects.length === 0 ? (
              <Empty description={isZh ? '点击上方任一全球目录打开隔离浏览器搜索，然后点击「提取企业线索」' : 'Open a global directory and extract prospects'} />
            ) : (
              <div className='flex flex-col gap-12px'>
                {prospects.map((item) => (
                  <div key={item.id} className='p-16px rd-14px bg-2 border border-solid border-[var(--color-border-2)] flex flex-col gap-10px'>
                    <div className='flex items-start justify-between gap-12px flex-wrap'>
                      <div className='flex flex-col gap-4px min-w-0 flex-1'>
                        <div className='flex items-center gap-8px flex-wrap'>
                          <span className='text-15px font-700 text-t-primary'>{item.companyName}</span>
                          <Tag size='small' color='arcoblue'>{item.country}</Tag>
                          {item.mxValid === true && <Tag size='small' color='green'>✅ MX Valid ({item.mxHost})</Tag>}
                          {item.mxValid === false && <Tag size='small' color='orange'>⚠️ No MX</Tag>}
                          {item.outreachSent && <Tag size='small' color='purple'>✉️ 已发送开发信</Tag>}
                          {item.replied && <Tag size='small' color='green'>💬 客户已回信 (序列已暂停)</Tag>}
                        </div>
                        <div className='text-12px text-t-secondary flex items-center gap-12px flex-wrap'>
                          {item.website && <span>🌐 {item.website}</span>}
                          {item.email && <span>✉️ {item.email}</span>}
                          {item.phone && <span>📞 {item.phone}</span>}
                          {item.whatsappUrl && <span>💬 WhatsApp Ready</span>}
                        </div>
                        {item.snippet && <div className='text-12px text-t-tertiary'>{item.snippet}</div>}
                      </div>
                      <Space wrap>
                        <Button size='small' type='outline' loading={enrichingId === item.id} onClick={() => handleEnrichProspect(item)}>
                          {isZh ? '🔎 官网抓邮箱 + MX 验真' : '🔎 Enrich & MX Verify'}
                        </Button>
                        <Button size='small' type='outline' loading={draftingOutreachId === item.id} onClick={() => handleGenerateColdEmail(item)}>
                          {isZh ? '✨ AI 写多语开发信' : '✨ Draft Cold Email'}
                        </Button>
                        <Button size='small' type='primary' onClick={() => handleAddProspectToCrm(item)} style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>
                          {isZh ? '+ 入库 CRM' : '+ Add CRM'}
                        </Button>
                      </Space>
                    </div>

                    {item.outreachBody && (
                      <div className='p-12px rd-10px bg-1 border border-solid border-[var(--color-border-2)] flex flex-col gap-8px'>
                        {item.sequence && item.sequence.length > 1 && (
                          <div className='flex items-center gap-6px flex-wrap'>
                            {item.sequence.map((step, sIdx) => (
                              <Tag key={sIdx} size='small' color={step.channel === 'whatsapp' ? 'green' : 'arcoblue'}>
                                Day {step.dayOffset} · {step.channel.toUpperCase()}
                              </Tag>
                            ))}
                          </div>
                        )}
                        <div className='text-12px font-600 text-t-primary'>Subject: {item.outreachSubject}</div>
                        <div className='text-12px text-t-secondary whitespace-pre-wrap'>{item.outreachBody}</div>
                        <div className='flex justify-end gap-8px flex-wrap'>
                          {(item.whatsappUrl || item.sequence?.some((s) => s.channel === 'whatsapp')) && (
                            <Button
                              size='mini'
                              type='outline'
                              onClick={() =>
                                handlePrefillSocialDm(
                                  item.whatsappUrl || 'https://web.whatsapp.com/',
                                  item.sequence?.find((s) => s.channel === 'whatsapp')?.body || item.outreachBody || ''
                                )
                              }
                            >
                              💬 填入 WhatsApp 跟进话术
                            </Button>
                          )}
                          {item.linkedinUrl && (
                            <Button
                              size='mini'
                              type='outline'
                              onClick={() => handlePrefillSocialDm(item.linkedinUrl || 'https://www.linkedin.com/', item.outreachBody || '')}
                            >
                              💼 填入 LinkedIn 备注
                            </Button>
                          )}
                          <Button size='mini' type='primary' loading={sendingEmailId === item.id} disabled={Boolean(item.replied)} onClick={() => handleSendColdEmail(item)} style={{ background: '#0F172A', borderColor: '#0F172A' }}>
                            {item.replied
                              ? isZh
                                ? '✅ 已回信（停止外发）'
                                : '✅ Replied'
                              : isZh
                                ? '📤 人工确认并通过本地 SMTP 发送'
                                : '📤 Confirm & Send SMTP'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CONVERT CRM */}
        {activeTab === 'crm' && (
          <div className='flex flex-col gap-20px'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-12px'>
              {[
                { label: isZh ? '本地线索总数' : 'Total Leads', value: leads.length },
                { label: isZh ? 'S/A 高意向' : 'S/A High Intent', value: leads.filter((l) => l.tier === 'S' || l.tier === 'A').length },
                { label: isZh ? '商机跟进中' : 'Opportunities', value: leads.filter((l) => l.stage === 'opportunity').length },
                { label: isZh ? '已成交转化' : 'Won Deals', value: leads.filter((l) => l.stage === 'won').length },
              ].map((kpi) => (
                <div key={kpi.label} className='p-16px rd-12px bg-2 border border-solid border-[var(--color-border-2)]'>
                  <div className='text-12px text-t-secondary'>{kpi.label}</div>
                  <div className='text-24px font-700 text-t-primary mt-4px'>{kpi.value}</div>
                </div>
              ))}
            </div>

            <div className='flex justify-between items-center flex-wrap gap-8px'>
              <div className='text-14px font-600 text-t-primary'>{isZh ? '线索推进漏斗' : 'Lead Pipeline'}</div>
              <Button type='outline' onClick={handleExportCsv} disabled={leads.length === 0}>{isZh ? '导出 CSV 线索表' : 'Export CSV'}</Button>
            </div>

            {leads.length === 0 ? (
              <Empty description={isZh ? '暂无线索，请在「03 浏览器意向雷达」一键入库' : 'No leads yet'} />
            ) : (
              <div className='flex flex-col gap-10px'>
                {leads.map((lead) => (
                  <div key={lead.id} className='p-14px rd-12px bg-2 border border-solid border-[var(--color-border-2)] flex items-center justify-between gap-12px'>
                    <div className='flex flex-col gap-4px'>
                      <Space>
                        <Tag color='arcoblue'>{lead.platformId}</Tag>
                        <Tag color={lead.tier === 'S' ? 'red' : 'orange'}>{lead.tier}-Tier</Tag>
                        <Tag color={lead.stage === 'won' ? 'green' : 'purple'}>{stageLabel[lead.stage]}</Tag>
                        <span className='font-600'>{lead.nickname}</span>
                      </Space>
                      <div className='text-13px text-t-secondary'>{lead.sanitizedComment}</div>
                    </div>
                    {lead.stage !== 'won' && (
                      <Button size='small' type='outline' onClick={() => handleAdvanceLead(lead.id)}>
                        {isZh ? '推进下一阶段 →' : 'Advance →'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Channel & Content ROI Attribution */}
            <div className='p-20px rd-14px bg-2 border border-solid border-[var(--color-border-2)] flex flex-col gap-12px'>
              <div>
                <div className='text-15px font-600 text-t-primary'>{isZh ? '📊 渠道与内容 ROI 归因复盘' : '📊 Channel & Content ROI Attribution'}</div>
                <div className='text-12px text-t-secondary mt-2px'>
                  {isZh ? '追踪已发布内容的短链点击、归因线索数，并一键复用爆款结构二次裂变' : 'Track short-link clicks, attributed leads, and re-spin winning posts'}
                </div>
              </div>
              {posts.length === 0 ? (
                <Empty description={isZh ? '暂无内容归因记录，请先在 01/02 创建并发布内容' : 'No posts to attribute yet'} />
              ) : (
                <div className='flex flex-col gap-8px'>
                  {posts.map((post) => {
                    const plat = ALL_PLATFORMS.find((p) => p.id === post.platformId);
                    const attrLeads = leads.filter((l) => l.platformId === post.platformId).length;
                    const clicks = post.clicks ?? 0;
                    const cvr = clicks > 0 ? `${Math.round((attrLeads / clicks) * 100)}%` : `${attrLeads} leads`;
                    return (
                      <div key={post.id} className='p-12px rd-10px bg-1 border border-solid border-[var(--color-border-2)] flex items-center justify-between gap-12px flex-wrap'>
                        <div className='min-w-0 flex-1'>
                          <div className='text-13px font-600 text-t-primary truncate'>{post.title}</div>
                          <Space size='mini' className='mt-4px'>
                            <Tag size='small' color='arcoblue'>{plat ? (isZh ? plat.nameZh : plat.nameEn) : post.platformId}</Tag>
                            <span className='text-11px text-t-secondary'>{isZh ? `点击: ${clicks}` : `Clicks: ${clicks}`}</span>
                            <span className='text-11px text-t-secondary'>{isZh ? `归因线索: ${attrLeads}` : `Leads: ${attrLeads}`}</span>
                            <Tag size='small' color='green'>{isZh ? `转化率 ${cvr}` : `CVR ${cvr}`}</Tag>
                          </Space>
                        </div>
                        <Space>
                          <Button size='mini' type='outline' onClick={() => handleSyncPostClicks(post)}>
                            {isZh ? '🔄 同步点击' : '🔄 Sync Clicks'}
                          </Button>
                          <Button
                            size='mini'
                            type='primary'
                            style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
                            onClick={() => handleSendToCreate(`${post.title}\n${post.body}`, post.platformId)}
                          >
                            {isZh ? '🔁 按此爆款裂变' : '🔁 Re-spin Post'}
                          </Button>
                        </Space>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: MICRO-KERNEL HOT-PLUG PACKS MARKET */}
        {activeTab === 'packs' && (
          <div className='flex flex-col gap-20px'>
            <div className='p-20px rd-14px bg-2 border border-solid border-[var(--color-border-2)] flex items-center justify-between flex-wrap gap-12px'>
              <div>
                <div className='text-15px font-600 text-t-primary'>
                  {isZh ? '🧩 微内核热插拔行业包 (.bmpack)' : '🧩 Micro-Kernel Hot-Plug Industry Packs (.bmpack)'}
                </div>
                <div className='text-12px text-t-secondary mt-2px'>
                  {isZh
                    ? '支持本地 .bmpack 行业包即时加载与卸载，内置 Apache-2.0 / MIT 开源许可校验与权限沙箱声明'
                    : 'Install and hot-unload local .bmpack vertical packs with license & permission checks'}
                </div>
              </div>
              <Space>
                <Button type='outline' loading={loadingPacks} onClick={refreshInstalledPacks}>
                  {isZh ? '🔄 刷新列表' : '🔄 Refresh'}
                </Button>
                <Button type='primary' onClick={handleInstallLocalPack} style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>
                  {isZh ? '📦 安装本地 .bmpack 行业包' : '📦 Install Local .bmpack'}
                </Button>
              </Space>
            </div>

            {installedPacks.length === 0 ? (
              <Empty description={isZh ? '暂未安装扩展行业包，点击右上角选择本地 .bmpack 目录或 manifest.json 安装' : 'No packs installed yet'} />
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-14px'>
                {installedPacks.map((pack) => {
                  const title =
                    typeof pack.displayName === 'string'
                      ? pack.displayName
                      : (isZh ? pack.displayName?.['zh-CN'] : pack.displayName?.['en-US']) || pack.name;
                  const desc =
                    typeof pack.description === 'string'
                      ? pack.description
                      : (isZh ? pack.description?.['zh-CN'] : pack.description?.['en-US']) || '';
                  const permKeys = Object.entries(pack.permissions || {})
                    .filter(([, v]) => Boolean(v))
                    .map(([k]) => k);
                  return (
                    <div key={pack.name} className='p-18px rd-14px bg-2 border border-solid border-[var(--color-border-2)] flex flex-col justify-between gap-12px'>
                      <div className='flex flex-col gap-6px'>
                        <div className='flex items-center justify-between gap-8px'>
                          <span className='text-15px font-700 text-t-primary'>{title}</span>
                          <Space size='mini'>
                            <Tag size='small' color='arcoblue'>v{pack.version}</Tag>
                            <Tag size='small' color='green'>{pack.license}</Tag>
                          </Space>
                        </div>
                        <div className='text-12px text-t-secondary'>{desc}</div>
                        <Space size='mini' wrap className='mt-4px'>
                          <Tag size='small'>{isZh ? `助手 ${pack.assistantsCount}` : `Assistants ${pack.assistantsCount}`}</Tag>
                          <Tag size='small'>{isZh ? `技能 ${pack.skillsCount}` : `Skills ${pack.skillsCount}`}</Tag>
                          <Tag size='small'>{isZh ? `画布 ${pack.canvasesCount}` : `Canvases ${pack.canvasesCount}`}</Tag>
                          {permKeys.map((perm) => (
                            <Tag key={perm} size='small' color='orange'>🔒 {perm}</Tag>
                          ))}
                        </Space>
                      </div>
                      <div className='flex justify-end'>
                        <Button size='small' status='danger' type='outline' onClick={() => handleUninstallPack(pack.name)}>
                          {isZh ? '卸载行业包' : 'Uninstall'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS MODAL */}
        <Modal
          title={isZh ? '⚙️ 大模型与 AiToEarn MCP 连接配置（本地持久化）' : '⚙️ LLM & AiToEarn MCP Settings'}
          visible={settingsModalOpen}
          onCancel={() => setSettingsModalOpen(false)}
          onOk={() => {
            setSettingsModalOpen(false);
            Message.success(isZh ? '配置已保存到本地' : 'Settings saved locally');
          }}
          style={{ width: 600 }}
        >
          <div className='flex flex-col gap-12px'>
            <Alert type='info' content={isZh ? '全部密钥仅保存在您的本机，零上传；填好模型 Key 即可开启真实 AI 文案、多语出海翻译与生图。' : 'All keys stay strictly on your local machine.'} />
            <div className='font-600'>{isZh ? '1. 对话与文案大模型（OpenAI 兼容接口）' : '1. LLM Provider'}</div>
            <Input addBefore='Base URL' value={settings.llmBaseUrl} onChange={(v) => setSettings({ ...settings, llmBaseUrl: v })} />
            <Input addBefore='Model' value={settings.llmModel} onChange={(v) => setSettings({ ...settings, llmModel: v })} />
            <Input.Password addBefore='API Key' value={settings.llmApiKey} onChange={(v) => setSettings({ ...settings, llmApiKey: v })} />

            <div className='font-600 mt-6px'>{isZh ? '2. AI 生图接口（可选，留空复用上方 Key）' : '2. Image Provider (Optional)'}</div>
            <Input addBefore='Image URL' value={settings.imageBaseUrl} onChange={(v) => setSettings({ ...settings, imageBaseUrl: v })} />
            <Input addBefore='Image Model' value={settings.imageModel} onChange={(v) => setSettings({ ...settings, imageModel: v })} />
            <Input.Password addBefore='Image Key' value={settings.imageApiKey} onChange={(v) => setSettings({ ...settings, imageApiKey: v })} />

            <div className='font-600 mt-6px'>{isZh ? '3. AiToEarn 云端 / 私有化 MCP（可选，不填也能用本地隔离浏览器发布）' : '3. AiToEarn MCP (Optional)'}</div>
            <Select value={settings.region} onChange={(v) => setSettings({ ...settings, region: v })}>
              <Select.Option value='cn'>🇨🇳 国内版 (https://aitoearn.cn/api/unified/mcp)</Select.Option>
              <Select.Option value='global'>🌍 国际版 (https://aitoearn.ai/api/unified/mcp)</Select.Option>
              <Select.Option value='self-hosted'>🐳 自建端点 ({settings.customMcpUrl})</Select.Option>
            </Select>
            {settings.region === 'self-hosted' && (
              <Input addBefore='MCP URL' value={settings.customMcpUrl} onChange={(v) => setSettings({ ...settings, customMcpUrl: v })} />
            )}
            <Input.Password
              addBefore='x-api-key'
              value={settings.region === 'cn' ? settings.cnMcpKey : settings.globalMcpKey}
              onChange={(v) =>
                setSettings(settings.region === 'cn' ? { ...settings, cnMcpKey: v } : { ...settings, globalMcpKey: v })
              }
            />
            <Space>
              <Button type='outline' onClick={handleTestAiToEarnMcp}>{isZh ? '🔌 测试 AiToEarn MCP 连通性' : '🔌 Test AiToEarn MCP'}</Button>
              {mcpTestMsg && <span>{mcpTestMsg}</span>}
            </Space>

            <div className='font-600 mt-6px'>{isZh ? '4. 外贸开发信本地 SMTP / IMAP 收发箱 & IM Webhook' : '4. Outbound SMTP / IMAP & IM Webhook'}</div>
            <div className='grid grid-cols-2 gap-8px'>
              <Input addBefore='SMTP Host' value={settings.smtpHost || ''} onChange={(v) => setSettings({ ...settings, smtpHost: v })} placeholder='smtp.gmail.com' />
              <Input addBefore='Port' value={String(settings.smtpPort || 465)} onChange={(v) => setSettings({ ...settings, smtpPort: Number(v) || 465 })} placeholder='465' />
            </div>
            <div className='grid grid-cols-2 gap-8px'>
              <Input addBefore='IMAP Host' value={settings.imapHost || ''} onChange={(v) => setSettings({ ...settings, imapHost: v })} placeholder='imap.gmail.com' />
              <Input addBefore='IMAP Port' value={String(settings.imapPort || 993)} onChange={(v) => setSettings({ ...settings, imapPort: Number(v) || 993 })} placeholder='993' />
            </div>
            <Input addBefore='Email' value={settings.smtpUser || ''} onChange={(v) => setSettings({ ...settings, smtpUser: v })} placeholder='sales@yourcompany.com' />
            <Input.Password addBefore='App Password' value={settings.smtpPass || ''} onChange={(v) => setSettings({ ...settings, smtpPass: v })} placeholder='SMTP/IMAP 授权码' />
            <Input addBefore='IM Webhook' value={settings.imWebhookUrl || ''} onChange={(v) => setSettings({ ...settings, imWebhookUrl: v })} placeholder='飞书 / 企微 / 钉钉机器人 Webhook URL' />
            <Input addBefore='Crawl4AI URL' value={settings.crawlerMcpUrl || ''} onChange={(v) => setSettings({ ...settings, crawlerMcpUrl: v })} placeholder='http://localhost:11235/crawl' />
          </div>
        </Modal>

        {/* CRON & IM APPROVAL MODAL */}
        <Modal
          title={isZh ? '⏱️ 24/7 定时巡检与飞书/企微审批中心' : '⏱️ 24/7 Cron & IM Approval Center'}
          visible={cronModalOpen}
          onCancel={() => setCronModalOpen(false)}
          onOk={() => setCronModalOpen(false)}
          style={{ width: 540 }}
        >
          <div className='flex flex-col gap-12px'>
            <Alert type='info' content={isZh ? '开启后将在本地定时检查 IMAP 客户回信、提醒待审批开发信队列，并通过 Webhook 推送至飞书/企微/钉钉。' : 'Checks IMAP replies and pushes pending approvals to Feishu/WeCom/DingTalk.'} />
            <div className='p-12px rd-10px bg-2 border border-solid border-[var(--color-border-2)] flex items-center justify-between'>
              <div>
                <div className='text-13px font-600'>{isZh ? '每日获客巡检 & 回信自动停发' : 'Daily Digest & Auto-Stop on Reply'}</div>
                <div className='text-11px text-t-secondary'>{cronEnabled ? (isZh ? '已启用' : 'Enabled') : (isZh ? '未启用' : 'Disabled')}</div>
              </div>
              <Button size='small' type={cronEnabled ? 'primary' : 'outline'} onClick={() => setCronEnabled(!cronEnabled)}>
                {cronEnabled ? (isZh ? '暂停巡检' : 'Pause') : (isZh ? '立即开启' : 'Enable')}
              </Button>
            </div>
            <Space>
              <Button type='outline' loading={checkingImap} onClick={handleCheckImapReplies}>{isZh ? '📬 立即执行 IMAP 回信检测' : '📬 Check IMAP Now'}</Button>
              <Button type='primary' onClick={handleTriggerCronTest} style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>{isZh ? '📨 推送汇总到飞书/企微' : '📨 Push IM Digest'}</Button>
            </Space>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default LeadGenStudioPage;
