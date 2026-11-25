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
  Card,
  Empty,
  Input,
  Message,
  Modal,
  Select,
  Space,
  Statistic,
  Tabs,
  Tag,
} from '@arco-design/web-react';

const { TabPane } = Tabs;
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
  aspect: string;
  creatorUrl: string;
  localUploader: string;
}

const ALL_PLATFORMS: MediaPlatform[] = [
  { id: 'douyin', region: 'cn', nameZh: '抖音', nameEn: 'Douyin', aspect: '9:16', creatorUrl: 'https://creator.douyin.com/', localUploader: 'social-auto-upload/douyin_uploader' },
  { id: 'xiaohongshu', region: 'cn', nameZh: '小红书', nameEn: 'RedNote (XHS)', aspect: '3:4', creatorUrl: 'https://creator.xiaohongshu.com/', localUploader: 'social-auto-upload/xiaohongshu_uploader' },
  { id: 'wechat_channels', region: 'cn', nameZh: '微信视频号', nameEn: 'WeChat Channels', aspect: '9:16', creatorUrl: 'https://channels.weixin.qq.com/', localUploader: 'social-auto-upload/tencent_uploader' },
  { id: 'kuaishou', region: 'cn', nameZh: '快手', nameEn: 'Kuaishou', aspect: '9:16', creatorUrl: 'https://cp.kuaishou.com/', localUploader: 'social-auto-upload/ks_uploader' },
  { id: 'bilibili', region: 'cn', nameZh: 'B站', nameEn: 'Bilibili', aspect: '16:9', creatorUrl: 'https://member.bilibili.com/', localUploader: 'social-auto-upload/bilibili_uploader' },
  { id: 'wechat_oa', region: 'cn', nameZh: '微信公众号', nameEn: 'WeChat OA', aspect: '16:9', creatorUrl: 'https://mp.weixin.qq.com/', localUploader: 'isolated-browser' },
  { id: 'weibo', region: 'cn', nameZh: '微博', nameEn: 'Weibo', aspect: '1:1', creatorUrl: 'https://weibo.com/', localUploader: 'social-auto-upload/weibo_uploader' },
  { id: 'zhihu', region: 'cn', nameZh: '知乎', nameEn: 'Zhihu', aspect: '16:9', creatorUrl: 'https://www.zhihu.com/creator', localUploader: 'social-auto-upload/zhihu_uploader' },
  { id: 'baijiahao', region: 'cn', nameZh: '百家号', nameEn: 'Baijiahao', aspect: '16:9', creatorUrl: 'https://baijiahao.baidu.com/', localUploader: 'social-auto-upload/baijiahao_uploader' },
  { id: 'tiktok', region: 'global', nameZh: 'TikTok', nameEn: 'TikTok', aspect: '9:16', creatorUrl: 'https://www.tiktok.com/creator-center/upload', localUploader: 'social-auto-upload/tk_uploader' },
  { id: 'youtube', region: 'global', nameZh: 'YouTube', nameEn: 'YouTube & Shorts', aspect: '16:9', creatorUrl: 'https://studio.youtube.com/', localUploader: 'social-auto-upload/youtube_uploader' },
  { id: 'instagram', region: 'global', nameZh: 'Instagram', nameEn: 'Instagram', aspect: '4:5', creatorUrl: 'https://business.facebook.com/latest/composer', localUploader: 'social-auto-upload/meta_uploader' },
  { id: 'facebook', region: 'global', nameZh: 'Facebook', nameEn: 'Facebook', aspect: '16:9', creatorUrl: 'https://business.facebook.com/', localUploader: 'social-auto-upload/meta_uploader' },
  { id: 'x', region: 'global', nameZh: 'X (Twitter)', nameEn: 'X (Twitter)', aspect: '16:9', creatorUrl: 'https://x.com/compose/post', localUploader: 'isolated-browser' },
  { id: 'linkedin', region: 'global', nameZh: 'LinkedIn', nameEn: 'LinkedIn', aspect: '16:9', creatorUrl: 'https://www.linkedin.com/feed/', localUploader: 'isolated-browser' },
  { id: 'threads', region: 'global', nameZh: 'Threads', nameEn: 'Threads', aspect: '1:1', creatorUrl: 'https://www.threads.net/', localUploader: 'isolated-browser' },
  { id: 'pinterest', region: 'global', nameZh: 'Pinterest', nameEn: 'Pinterest', aspect: '2:3', creatorUrl: 'https://www.pinterest.com/pin-creation-tool/', localUploader: 'isolated-browser' },
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

  // Module 1: Create State (AI Copy + Multilingual + AI Image + Mobile Preview)
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

  // Module 2: Isolated Accounts
  const [accPlatform, setAccPlatform] = useState('xiaohongshu');
  const [accLabel, setAccLabel] = useState('');

  // Module 3: Engage (Isolated Browser + Live Comments + AI Reply)
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

  // Real AI Copy Generation
  const handleAiGenerateCopy = async () => {
    if (!topicInput.trim()) {
      Message.warning(isZh ? '请输入产品卖点或获客主题' : 'Please enter a topic or product pitch');
      return;
    }
    if (!settings.llmApiKey && !settings.llmBaseUrl.includes('localhost') && !settings.llmBaseUrl.includes('127.0.0.1')) {
      setSettingsModalOpen(true);
      Message.info(isZh ? '请先填入您的大模型 API Key（DeepSeek / OpenAI / 本地 Ollama）' : 'Please configure your LLM API key first');
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
      systemPrompt: `You are an expert social media lead-generation copywriter. Output strict JSON with keys "title", "body", "cta". Target platform: ${platName} (aspect ${selectedCreatePlatform.aspect}). Output language: ${targetLang}. Include high-converting pain-point hooks and clear CTA.`,
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
      setDraftBody(`${parsed.body || res.content}\n\n👉 ${parsed.cta || ''}`.trim());
    } catch {
      const lines = res.content.split('\n').filter(Boolean);
      setDraftTitle(lines[0]?.replace(/^#+\s*/, '') || topicInput.trim());
      setDraftBody(lines.slice(1).join('\n') || res.content);
    }
    Message.success(isZh ? `AI 创作完成 (${res.latencyMs}ms)` : `Generated in ${res.latencyMs}ms`);
  };

  // Real AI Image Generation
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

  // Real AiToEarn MCP Test
  const handleTestAiToEarnMcp = async () => {
    if (!bridge?.callAiToEarnMcp) return;
    setMcpTestMsg(isZh ? '连接测试中...' : 'Testing...');
    const res = await bridge.callAiToEarnMcp({
      endpoint: activeMcpEndpoint,
      apiKey: activeMcpKey,
      method: 'tools/list',
    });
    if (res.ok) {
      setMcpTestMsg(`✅ ${isZh ? '已连通 AiToEarn MCP' : 'Connected'} (${res.latencyMs}ms)`);
    } else {
      setMcpTestMsg(`❌ ${res.error || 'Failed'}`);
    }
  };

  // Add to Calendar Queue
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
    Message.success(isZh ? '已加入全渠道排期日历' : 'Added to Omni-Channel Calendar');
  };

  // Open real isolated Electron BrowserWindow (persist:bm-acc-*)
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
    const acc: LocalAccount = {
      id,
      platformId: accPlatform,
      label: accLabel.trim(),
      partition,
      createdAt: new Date().toISOString(),
    };
    setAccounts((prev) => [acc, ...prev]);
    setSelectedPartition(partition);
    setAccLabel('');
    Message.success(isZh ? '已创建独立 Cookie 隔离账号' : 'Created isolated account container');
  };

  // Publish via AiToEarn MCP or Local Isolated Browser (Human-in-the-Loop)
  const handleConfirmPublish = (post: LocalPost) => {
    const plat = ALL_PLATFORMS.find((p) => p.id === post.platformId);
    Modal.confirm({
      title: isZh ? '人工确认发布（合规门禁）' : 'Human-in-the-Loop Publish Confirmation',
      content: isZh
        ? `即将发布到「${plat?.nameZh ?? post.platformId}」：${post.title}${activeMcpKey ? '（将优先调用 AiToEarn MCP 发布）' : '（将打开本地隔离浏览器创作者后台）'}`
        : `Publish to "${plat?.nameEn ?? post.platformId}": ${post.title}`,
      okText: isZh ? '确认发布' : 'Confirm Publish',
      cancelText: isZh ? '取消' : 'Cancel',
      onOk: async () => {
        if (activeMcpKey && bridge?.callAiToEarnMcp) {
          const mcpRes = await bridge.callAiToEarnMcp({
            endpoint: activeMcpEndpoint,
            apiKey: activeMcpKey,
            method: 'tools/call',
            params: {
              name: 'publish_now',
              arguments: {
                platform: post.platformId,
                title: post.title,
                content: post.body,
                mediaUrl: post.imageUrl,
              },
            },
          });
          if (mcpRes.ok) {
            setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: 'published' } : p)));
            Message.success(isZh ? '已通过 AiToEarn MCP 发布成功！' : 'Published via AiToEarn MCP!');
            return;
          }
          Message.warning(mcpRes.error || 'MCP publish failed, falling back to local browser');
        }
        const acc = accounts.find((a) => a.platformId === post.platformId);
        const partition = acc?.partition || `persist:bm-acc-${post.platformId}-default`;
        if (plat) await handleOpenIsolatedWindow(partition, plat.creatorUrl, acc?.label || plat.nameZh);
        setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: 'published' } : p)));
      },
    });
  };

  // Extract visible comments directly from the open isolated browser window
  const handleExtractLiveBrowserComments = async () => {
    if (!selectedPartition || !bridge?.extractBrowserComments) {
      Message.warning(isZh ? '请先在下方选择并打开一个隔离浏览器账号窗口' : 'Open an isolated browser window first');
      return;
    }
    const res = await bridge.extractBrowserComments({ partition: selectedPartition });
    if (!res.ok || res.comments.length === 0) {
      Message.warning(res.error || (isZh ? '未检测到可见评论，请先在隔离浏览器打开帖子评论区' : 'No visible comments found'));
      return;
    }
    const scored: AnalyzedComment[] = res.comments
      .map((c) => {
        const s = scoreComment(c.text);
        return { id: c.id, text: c.text, redacted: c.redacted, ...s };
      })
      .sort((a, b) => b.score - a.score);
    setAnalyzedList(scored);
    Message.success(isZh ? `已从真实网页提取并脱敏 ${scored.length} 条评论` : `Extracted & sanitized ${scored.length} live comments`);
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
        const s = scoreComment(clean.text);
        return { id: `paste_${Date.now()}_${idx}`, text: clean.text, redacted: clean.redacted, ...s };
      })
      .sort((a, b) => b.score - a.score);
    setAnalyzedList(scored);
  };

  const handlePrefillReplyToBrowser = async (replyText: string) => {
    if (!selectedPartition || !bridge?.prefillBrowserReply) {
      Message.info(isZh ? '请先打开隔离浏览器窗口，或复制回复内容手动发送' : 'Open the isolated browser window first');
      return;
    }
    const res = await bridge.prefillBrowserReply({ partition: selectedPartition, replyText });
    if (res.ok) {
      Message.success(isZh ? '已自动填入隔离浏览器评论框（已停在发送键前，请人工确认发送）' : 'Prefilled into browser input (stopped before Send)');
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
        const nextStage = stageOrder[Math.min(idx + 1, stageOrder.length - 1)];
        return { ...l, stage: nextStage };
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

  return (
    <div className='h-full w-full overflow-y-auto px-24px py-20px bg-1 text-t-primary'>
      <div className='max-w-1200px mx-auto flex flex-col gap-16px'>
        <div className='flex items-center justify-between flex-wrap gap-12px'>
          <div>
            <h1 className='m-0 text-22px font-600 text-t-primary'>
              {isZh ? '标脉灵枢 · 全媒介全自动获客工作台' : 'BiaoMai Lingshu · Omni-Media Lead-Gen Studio'}
            </h1>
            <p className='m-0 mt-4px text-13px text-t-secondary'>
              {isZh
                ? '100% 本地免 Docker 即用（AI 创作 · 17 平台矩阵与 AiToEarn MCP · 独立隔离浏览器雷达 · 本地线索 CRM 闭环）'
                : '100% Zero-Docker Local Studio: Create · Publish (17 Channels + AiToEarn MCP) · Engage (Isolated Browser) · Convert CRM'}
            </p>
          </div>
          <Space>
            <Tag color={settings.llmApiKey ? 'green' : 'orange'}>
              {settings.llmApiKey ? (isZh ? `模型已就绪: ${settings.llmModel}` : `LLM Ready: ${settings.llmModel}`) : (isZh ? '未配置模型 Key' : 'LLM Key Needed')}
            </Tag>
            <Tag color={activeMcpKey ? 'green' : 'arcoblue'}>
              {activeMcpKey ? 'AiToEarn MCP Ready' : (isZh ? '本地隔离浏览器模式' : 'Local Isolated Browser')}
            </Tag>
            <Button type='primary' size='small' onClick={() => setSettingsModalOpen(true)}>
              {isZh ? '⚙️ 配置模型与 AiToEarn MCP' : '⚙️ Configure LLM & AiToEarn MCP'}
            </Button>
          </Space>
        </div>

        <Tabs defaultActiveTab='create' type='rounded'>
          {/* MODULE 1: CREATE */}
          <TabPane key='create' title={isZh ? '1. Create 获客创作工坊' : '1. Create Studio'}>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-16px pt-8px'>
              <Card title={isZh ? 'AI 多平台获客内容与出海多语生成' : 'AI Lead-Gen Copy & Multilingual Studio'} bordered className='rd-12px'>
                <div className='flex flex-col gap-10px'>
                  <div className='flex gap-8px flex-wrap'>
                    <Select value={createPlatform} onChange={setCreatePlatform} style={{ flex: 1 }}>
                      {ALL_PLATFORMS.map((p) => (
                        <Select.Option key={p.id} value={p.id}>
                          {isZh ? `${p.nameZh} (${p.aspect})` : `${p.nameEn} (${p.aspect})`}
                        </Select.Option>
                      ))}
                    </Select>
                    <Select value={targetLang} onChange={setTargetLang} style={{ width: 150 }}>
                      <Select.Option value='zh-CN'>简体中文</Select.Option>
                      <Select.Option value='en-US'>English (Global)</Select.Option>
                      <Select.Option value='ja-JP'>日本語</Select.Option>
                      <Select.Option value='es-ES'>Español</Select.Option>
                    </Select>
                  </div>
                  <TextArea
                    rows={3}
                    value={topicInput}
                    onChange={setTopicInput}
                    placeholder={
                      isZh
                        ? '输入产品卖点、目标客户痛点或想要推广的主题，AI 将自动按所选平台与目标语种生成高转化文案...'
                        : 'Describe your product value proposition and target ICP...'
                    }
                  />
                  <Space wrap>
                    <Button type='primary' loading={creatingCopy} onClick={handleAiGenerateCopy}>
                      {isZh ? '✨ AI 生成获客文案' : '✨ Generate Lead-Gen Copy'}
                    </Button>
                    <Button type='outline' loading={creatingImg} onClick={handleAiGenerateImage}>
                      {isZh ? '🎨 AI 生成封面配图' : '🎨 Generate Cover Visual'}
                    </Button>
                  </Space>
                  <Input
                    value={draftShortLink}
                    onChange={setDraftShortLink}
                    placeholder={isZh ? '可选：填入归因追踪短链 (UTM / short-link)' : 'Optional: tracking short-link / UTM URL'}
                  />
                  <Input
                    value={scheduledTime}
                    onChange={setScheduledTime}
                    placeholder='YYYY-MM-DD HH:mm'
                  />
                  <Button type='primary' status='success' onClick={handleSaveToSchedule}>
                    {isZh ? '加入全渠道排期日历 →' : 'Add to Omni-Channel Calendar →'}
                  </Button>
                </div>
              </Card>

              <Card title={isZh ? `手机端实时预览 (${selectedCreatePlatform.nameZh} · ${selectedCreatePlatform.aspect})` : `Mobile Preview (${selectedCreatePlatform.nameEn})`} bordered className='rd-12px'>
                <div className='max-w-360px mx-auto p-12px rd-16px border border-solid border-[var(--color-border-2)] bg-2 flex flex-col gap-10px'>
                  {draftImageUrl ? (
                    <img src={draftImageUrl} alt='AI Cover' className='w-full rd-10px max-h-220px object-cover' />
                  ) : (
                    <div className='h-120px rd-10px bg-1 flex items-center justify-center text-12px text-t-secondary border border-dashed border-[var(--color-border-2)]'>
                      {isZh ? '封面图预览区（点击左侧 AI 生成配图）' : 'Visual preview area'}
                    </div>
                  )}
                  <Input
                    value={draftTitle}
                    onChange={setDraftTitle}
                    placeholder={isZh ? '标题预览（可直接微调）' : 'Headline preview (editable)'}
                  />
                  <TextArea
                    rows={5}
                    value={draftBody}
                    onChange={setDraftBody}
                    placeholder={isZh ? '正文与 CTA 钩子预览（可直接微调）' : 'Body & CTA preview (editable)'}
                  />
                </div>
              </Card>
            </div>
          </TabPane>

          {/* MODULE 2: PUBLISH */}
          <TabPane key='publish' title={isZh ? `2. Publish 17平台与排期 (${posts.length})` : `2. Publish & Calendar (${posts.length})`}>
            <div className='flex flex-col gap-16px pt-8px'>
              <Card bordered className='rd-12px'>
                <div className='flex items-center justify-between flex-wrap gap-10px mb-12px'>
                  <span className='font-600'>{isZh ? '全球 17 大媒介（点击直接打开独立 Cookie 隔离浏览器登录/发布）' : '17 Global & CN Media Platforms (Isolated Browser)'}</span>
                  <Space>
                    <Button size='small' type={regionFilter === 'all' ? 'primary' : 'secondary'} onClick={() => setRegionFilter('all')}>
                      {isZh ? '全部 (17)' : 'All (17)'}
                    </Button>
                    <Button size='small' type={regionFilter === 'cn' ? 'primary' : 'secondary'} onClick={() => setRegionFilter('cn')}>
                      {isZh ? '🇨🇳 国内 (9)' : '🇨🇳 CN (9)'}
                    </Button>
                    <Button size='small' type={regionFilter === 'global' ? 'primary' : 'secondary'} onClick={() => setRegionFilter('global')}>
                      {isZh ? '🌍 海外 (8)' : '🌍 Global (8)'}
                    </Button>
                  </Space>
                </div>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-10px'>
                  {visiblePlatforms.map((p) => {
                    const acc = accounts.find((a) => a.platformId === p.id);
                    const partition = acc?.partition || `persist:bm-acc-${p.id}-default`;
                    return (
                      <div key={p.id} className='p-12px rd-10px border border-solid border-[var(--color-border-2)] flex flex-col gap-6px bg-2'>
                        <div className='flex items-center justify-between'>
                          <span className='font-600 text-14px'>{isZh ? p.nameZh : p.nameEn}</span>
                          <Tag size='small' color={p.region === 'cn' ? 'orangered' : 'arcoblue'}>{p.region === 'cn' ? 'CN' : 'Global'}</Tag>
                        </div>
                        <span className='text-11px text-t-secondary truncate'>{acc ? `🟢 ${acc.label}` : p.localUploader}</span>
                        <Button size='mini' type='outline' onClick={() => handleOpenIsolatedWindow(partition, p.creatorUrl, acc?.label || p.nameZh)}>
                          {isZh ? '打开隔离浏览器 ↗' : 'Open Isolated Browser ↗'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-16px'>
                <Card title={isZh ? '多账号隔离容器管理' : 'Isolated Account Containers'} bordered className='rd-12px'>
                  <div className='flex gap-8px mb-12px'>
                    <Select value={accPlatform} onChange={setAccPlatform} style={{ width: 150 }}>
                      {ALL_PLATFORMS.map((p) => (
                        <Select.Option key={p.id} value={p.id}>{isZh ? p.nameZh : p.nameEn}</Select.Option>
                      ))}
                    </Select>
                    <Input placeholder={isZh ? '账号备注（如：主号）' : 'Account label'} value={accLabel} onChange={setAccLabel} />
                    <Button type='primary' onClick={handleAddAccount}>{isZh ? '添加' : 'Add'}</Button>
                  </div>
                  {accounts.length === 0 ? (
                    <Empty description={isZh ? '暂无自定义账号，添加后分配独立 Cookie 分区' : 'No accounts yet'} />
                  ) : (
                    <div className='flex flex-col gap-8px'>
                      {accounts.map((a) => {
                        const plat = ALL_PLATFORMS.find((p) => p.id === a.platformId);
                        return (
                          <div key={a.id} className='flex items-center justify-between p-8px rd-8px bg-2'>
                            <div>
                              <div className='font-500'>{a.label} ({a.platformId})</div>
                              <div className='text-11px text-t-secondary'>{a.partition}</div>
                            </div>
                            <Button size='mini' onClick={() => plat && handleOpenIsolatedWindow(a.partition, plat.creatorUrl, a.label)}>
                              {isZh ? '启动窗口' : 'Launch'}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                <Card title={isZh ? '全渠道排期日历与人工确认发布' : 'Schedule Calendar & Approval'} bordered className='rd-12px'>
                  {posts.length === 0 ? (
                    <Empty description={isZh ? '请在「1. Create 获客创作工坊」生成并加入排期' : 'Create content in tab 1 to schedule'} />
                  ) : (
                    <div className='flex flex-col gap-8px'>
                      {posts.map((post) => (
                        <div key={post.id} className='flex items-center justify-between p-10px rd-8px bg-2'>
                          <div className='min-w-0 pr-8px'>
                            <div className='font-500 truncate'>{post.title}</div>
                            <Space size='mini'>
                              <Tag size='small' color='arcoblue'>{post.platformId}</Tag>
                              <Tag size='small' color={post.status === 'published' ? 'green' : 'orange'}>{post.status}</Tag>
                              <span className='text-11px text-t-secondary'>{post.scheduledAt}</span>
                            </Space>
                          </div>
                          {post.status !== 'published' && (
                            <Button size='mini' type='primary' onClick={() => handleConfirmPublish(post)}>
                              {isZh ? '确认发布' : 'Publish'}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </TabPane>

          {/* MODULE 3: ENGAGE */}
          <TabPane key='engage' title={isZh ? '3. Engage 隔离浏览器意向雷达' : '3. Engage Browser Radar'}>
            <div className='flex flex-col gap-16px pt-8px'>
              <Card bordered className='rd-12px'>
                <div className='flex items-center justify-between flex-wrap gap-10px mb-10px'>
                  <Space wrap>
                    <Select
                      value={selectedPartition}
                      onChange={setSelectedPartition}
                      placeholder={isZh ? '选择已打开的隔离浏览器账号' : 'Select isolated browser account'}
                      style={{ width: 260 }}
                    >
                      {accounts.map((a) => (
                        <Select.Option key={a.partition} value={a.partition}>🟢 {a.label} ({a.platformId})</Select.Option>
                      ))}
                    </Select>
                    <Button type='primary' onClick={handleExtractLiveBrowserComments}>
                      {isZh ? '🎯 一键读取隔离浏览器当前页评论' : '🎯 Extract Live Browser Comments'}
                    </Button>
                  </Space>
                  <Tag color='green'>{isZh ? '自动剔除手机号/微信号/邮箱/UID' : 'Auto PII Sanitizer'}</Tag>
                </div>

                <div className='flex items-center gap-8px mb-8px'>
                  <Select value={radarPlatform} onChange={setRadarPlatform} style={{ width: 160 }}>
                    {ALL_PLATFORMS.map((p) => (
                      <Select.Option key={p.id} value={p.id}>{isZh ? p.nameZh : p.nameEn}</Select.Option>
                    ))}
                  </Select>
                  <Button type='outline' onClick={handleAnalyzePastedComments}>
                    {isZh ? '分析下方粘贴的评论' : 'Analyze Pasted Comments'}
                  </Button>
                </div>
                <TextArea
                  rows={3}
                  value={rawCommentInput}
                  onChange={setRawCommentInput}
                  placeholder={isZh ? '也可以直接粘贴评论区文本（每行一条）进行脱敏与 S/A/B/C 意向分级...' : 'Or paste comments directly (one per line)...'}
                />
              </Card>

              {analyzedList.length === 0 ? (
                <Empty description={isZh ? '打开隔离浏览器帖子页点击上方提取，或粘贴评论分析' : 'Extract from live browser or paste comments'} />
              ) : (
                <div className='flex flex-col gap-10px'>
                  {analyzedList.map((item) => (
                    <Card key={item.id} bordered className='rd-10px'>
                      <div className='flex flex-col gap-8px'>
                        <div className='flex items-center justify-between gap-12px'>
                          <Space>
                            <Tag color={item.tier === 'S' ? 'red' : item.tier === 'A' ? 'orange' : 'gray'}>{item.tier}-Tier · {item.score}</Tag>
                            {item.redacted > 0 && <Tag color='green'>{isZh ? `已脱敏 ${item.redacted} 处隐私` : `Redacted ${item.redacted} PII`}</Tag>}
                          </Space>
                          <Space>
                            {item.draftReply && (
                              <Button size='small' type='outline' onClick={() => handlePrefillReplyToBrowser(item.draftReply)}>
                                {isZh ? '采纳并填入浏览器输入框' : 'Prefill into Browser'}
                              </Button>
                            )}
                            <Button size='small' type='primary' onClick={() => handleAddToCrm(item)}>
                              {isZh ? '+ 加入线索 CRM' : '+ Add to CRM'}
                            </Button>
                          </Space>
                        </div>
                        <div className='font-500'>{item.text}</div>
                        {item.draftReply && (
                          <div className='p-8px rd-8px bg-2 text-12px text-t-secondary'>
                            {isZh ? 'AI 回复草稿：' : 'AI Draft: '}{item.draftReply}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabPane>

          {/* MODULE 4: CONVERT CRM */}
          <TabPane key='crm' title={isZh ? `4. Convert 线索 CRM (${leads.length})` : `4. Convert CRM (${leads.length})`}>
            <div className='flex flex-col gap-16px pt-8px'>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-12px'>
                <Card bordered className='rd-10px'><Statistic title={isZh ? '线索总数' : 'Total Leads'} value={leads.length} /></Card>
                <Card bordered className='rd-10px'><Statistic title={isZh ? 'S/A 高意向' : 'S/A Intent'} value={leads.filter((l) => l.tier === 'S' || l.tier === 'A').length} /></Card>
                <Card bordered className='rd-10px'><Statistic title={isZh ? '商机跟进' : 'Opportunities'} value={leads.filter((l) => l.stage === 'opportunity').length} /></Card>
                <Card bordered className='rd-10px'><Statistic title={isZh ? '成交客户' : 'Won'} value={leads.filter((l) => l.stage === 'won').length} /></Card>
              </div>
              <div className='flex justify-end'>
                <Button onClick={handleExportCsv} disabled={leads.length === 0}>{isZh ? '导出 CSV 线索表' : 'Export CSV'}</Button>
              </div>
              {leads.length === 0 ? (
                <Empty description={isZh ? '暂无线索，请在「3. Engage 意向雷达」一键入库' : 'No leads yet'} />
              ) : (
                <div className='flex flex-col gap-10px'>
                  {leads.map((lead) => (
                    <Card key={lead.id} bordered className='rd-10px'>
                      <div className='flex items-center justify-between gap-12px'>
                        <div className='flex flex-col gap-4px'>
                          <Space>
                            <Tag color='arcoblue'>{lead.platformId}</Tag>
                            <Tag color={lead.tier === 'S' ? 'red' : 'orange'}>{lead.tier}-Tier</Tag>
                            <Tag color={lead.stage === 'won' ? 'green' : 'purple'}>{stageLabel[lead.stage]}</Tag>
                            <span className='font-600'>{lead.nickname}</span>
                          </Space>
                          <div className='text-t-secondary'>{lead.sanitizedComment}</div>
                        </div>
                        {lead.stage !== 'won' && (
                          <Button size='small' type='outline' onClick={() => handleAdvanceLead(lead.id)}>
                            {isZh ? '推进下一阶段 →' : 'Advance Stage →'}
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabPane>
        </Tabs>

        {/* SETTINGS MODAL */}
        <Modal
          title={isZh ? '⚙️ 大模型与 AiToEarn MCP 连接配置（本地持久化）' : '⚙️ LLM & AiToEarn MCP Configuration'}
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
