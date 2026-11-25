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
  Select,
  Space,
  Tag,
} from '@arco-design/web-react';

const { TextArea } = Input;

interface BiaoMaiElectronBridge {
  openIsolatedBrowser: (payload: { partition: string; url: string; title?: string }) => Promise<{ ok: boolean; url?: string }>;
  extractBrowserComments: (payload: { partition: string }) => Promise<{
    ok: boolean;
    url?: string;
    error?: string;
    comments: Array<{ id: string; text: string; redacted: number }>;
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
  shortLinkUrl?: string;
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

  const [activeTab, setActiveTab] = useState<'create' | 'publish' | 'engage' | 'crm'>('create');
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
    })
  );
  const [mcpTestMsg, setMcpTestMsg] = useState<string>('');

  const [regionFilter, setRegionFilter] = useState<'all' | 'cn' | 'global'>('all');
  const [accounts, setAccounts] = useState<LocalAccount[]>(() => readJson<LocalAccount[]>(KEYS.accounts, []));
  const [posts, setPosts] = useState<LocalPost[]>(() => readJson<LocalPost[]>(KEYS.posts, []));
  const [leads, setLeads] = useState<LocalLead[]>(() => readJson<LocalLead[]>(KEYS.leads, []));

  // Create State
  const [createPlatform, setCreatePlatform] = useState('xiaohongshu');
  const [topicInput, setTopicInput] = useState('');
  const [targetLang, setTargetLang] = useState<'zh-CN' | 'en-US' | 'ja-JP' | 'es-ES'>('zh-CN');
  const [creatingCopy, setCreatingCopy] = useState(false);
  const [creatingImg, setCreatingImg] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftImageUrl, setDraftImageUrl] = useState('');
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

  useEffect(() => localStorage.setItem(KEYS.accounts, JSON.stringify(accounts)), [accounts]);
  useEffect(() => localStorage.setItem(KEYS.posts, JSON.stringify(posts)), [posts]);
  useEffect(() => localStorage.setItem(KEYS.leads, JSON.stringify(leads)), [leads]);
  useEffect(() => localStorage.setItem(KEYS.settings, JSON.stringify(settings)), [settings]);

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
      shortLinkUrl: draftShortLink.trim() || undefined,
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

  const navTabs: Array<{ id: 'create' | 'publish' | 'engage' | 'crm'; step: string; title: string; count?: number }> = [
    { id: 'create', step: '01', title: isZh ? 'AI 内容创作' : 'Create Studio' },
    { id: 'publish', step: '02', title: isZh ? '全渠道分发' : 'Omni-Publish', count: posts.length },
    { id: 'engage', step: '03', title: isZh ? '浏览器意向雷达' : 'Intent Radar', count: analyzedList.length },
    { id: 'crm', step: '04', title: isZh ? '线索 CRM' : 'Lead CRM', count: leads.length },
  ];

  return (
    <div className='h-full w-full overflow-y-auto bg-1 text-t-primary'>
      <div className='max-w-1240px mx-auto px-28px py-24px flex flex-col gap-20px'>
        {/* Top Studio Header — Linear / Vercel Aesthetic */}
        <div className='flex items-start justify-between flex-wrap gap-16px pb-16px border-b border-solid border-[var(--color-border-2)]'>
          <div className='flex flex-col gap-4px'>
            <div className='flex items-center gap-10px'>
              <span className='text-22px font-700 tracking-tight text-t-primary'>
                {isZh ? '全媒介全自动获客工作台' : 'Omni-Media Lead-Gen Studio'}
              </span>
              <span className='px-8px py-2px rd-full text-11px font-600 bg-[rgba(99,102,241,0.12)] text-[#6366F1]'>
                Zero-Docker Local
              </span>
            </div>
            <span className='text-13px text-t-secondary'>
              {isZh
                ? '创作 → 17 大全球平台隔离分发 → 实时评论意向捕获 → 本地线索 CRM 闭环'
                : 'Create → 17-Channel Isolated Distribution → Live Browser Intent Radar → Local Lead CRM'}
            </span>
          </div>

          <div className='flex items-center gap-8px flex-wrap'>
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
                style={{ background: activeMcpKey ? '#10B981' : '#6366F1' }}
              />
              {activeMcpKey ? 'AiToEarn MCP' : (isZh ? '隔离浏览器直连' : 'Isolated Browser')}
            </button>

            <button
              type='button'
              onClick={() => setSettingsModalOpen(true)}
              className='h-32px px-14px rd-8px border-none bg-[#4F46E5] hover:bg-[#4338CA] text-12px font-600 text-white cursor-pointer transition-colors'
            >
              {isZh ? '⚙️ 接口配置' : '⚙️ API Settings'}
            </button>
          </div>
        </div>

        {/* Modern Segmented 4-Step Pipeline Navigation */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-8px p-4px rd-12px bg-2 border border-solid border-[var(--color-border-2)]'>
          {navTabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type='button'
                onClick={() => setActiveTab(t.id)}
                className={`h-38px px-14px rd-8px border-none cursor-pointer flex items-center justify-between text-13px font-600 transition-all ${
                  active
                    ? 'bg-1 text-t-primary shadow-sm'
                    : 'bg-transparent text-t-secondary hover:text-t-primary'
                }`}
              >
                <span className='flex items-center gap-8px'>
                  <span className={`text-11px font-700 ${active ? 'text-[#4F46E5]' : 'text-t-tertiary'}`}>{t.step}</span>
                  <span>{t.title}</span>
                </span>
                {typeof t.count === 'number' && (
                  <span className='px-7px py-1px rd-full text-11px font-600 bg-fill-2 text-t-secondary'>
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
              </div>

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

                  {draftImageUrl ? (
                    <img src={draftImageUrl} alt='AI Cover' className='w-full h-180px object-cover' />
                  ) : (
                    <div className='h-150px bg-2 flex flex-col items-center justify-center gap-4px text-12px text-t-secondary border-b border-solid border-[var(--color-border-2)]'>
                      <span>{isZh ? '封面视觉预览区' : 'Visual Cover Preview'}</span>
                      <span className='text-11px text-t-tertiary'>{isZh ? '点击左侧「AI 生成封面配图」' : 'Click Generate Cover Visual'}</span>
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
                </Space>
                <Tag color='green'>{isZh ? '强制 PII 隐私脱敏 · 停在发送键前人工确认' : 'Mandatory PII Sanitizer · Human-in-the-Loop'}</Tag>
              </div>

              <div className='flex items-center gap-8px'>
                <Select value={radarPlatform} onChange={setRadarPlatform} style={{ width: 160 }}>
                  {ALL_PLATFORMS.map((p) => (
                    <Select.Option key={p.id} value={p.id}>{isZh ? p.nameZh : p.nameEn}</Select.Option>
                  ))}
                </Select>
                <Button type='outline' onClick={handleAnalyzePastedComments}>{isZh ? '分析下方粘贴评论' : 'Analyze Pasted Comments'}</Button>
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

            <div className='flex justify-end'>
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
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default LeadGenStudioPage;
