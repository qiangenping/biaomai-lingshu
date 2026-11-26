/**
 * @license
 * Copyright 2026 BiaoMai Lingshu Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BiaoMaiElectronBridge {
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
  listInstalledPacks: () => Promise<{ ok: boolean; packs: InstalledPack[] }>;
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
  runCrawlerMcp: (payload: { endpoint: string; targetUrl: string; token?: string }) => Promise<{ ok: boolean; data?: unknown; error?: string }>;
  syncExternalCrm: (payload: {
    provider: 'twenty' | 'atomic' | 'webhook';
    baseUrl: string;
    apiKey?: string;
    leads: LocalLead[];
  }) => Promise<{ ok: boolean; syncedCount: number; failedCount: number; error?: string }>;
  generateOpenMotionVideo: (payload: {
    title: string;
    body: string;
    platformName: string;
    aspect: string;
    brandColor: string;
    language: string;
    studioUrl?: string;
  }) => Promise<{
    ok: boolean;
    mode: 'server' | 'local-html';
    projectDir: string;
    motionMd: string;
    previewUrl: string;
    error?: string;
  }>;
  openMotionStudioControl: (payload: {
    action: 'status' | 'start' | 'stop';
    studioUrl?: string;
  }) => Promise<{
    ok: boolean;
    installed: boolean;
    running: boolean;
    url: string;
    message?: string;
    error?: string;
  }>;
}

export interface OutreachStep {
  dayOffset: number;
  channel: 'email' | 'whatsapp' | 'linkedin';
  subject: string;
  body: string;
  status: 'pending' | 'sent';
}

export function nextEmailDraft(item: GlobalProspect) {
  if (item.replied) return;
  const emails = item.sequence?.filter(step => step.channel === 'email' && step.body);
  if (emails?.length) {
    // Older records have only the boolean send receipt for their first email.
    return emails.find((step, index) => step.status !== 'sent' && !(index === 0 && item.outreachSent));
  }
  if (!item.outreachSent && item.outreachBody) return { subject: item.outreachSubject, body: item.outreachBody };
}

export interface GlobalProspect {
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

export interface InstalledPack {
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

export interface MediaPlatform {
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

export interface IndustryPreset {
  id: string;
  nameZh: string;
  nameEn: string;
  defaultB2bIndustry: string;
  defaultCountry: string;
  defaultPitchZh: string;
  defaultPitchEn: string;
  recommendedPack: string;
}

export const INDUSTRY_PRESETS: IndustryPreset[] = [
  {
    id: 'custom', nameZh: '自定义行业与市场', nameEn: 'Custom industry and market',
    defaultB2bIndustry: '', defaultCountry: '', defaultPitchZh: '', defaultPitchEn: '',
    recommendedPack: 'pack-global-b2b-outbound',
  },
  {
    id: 'foreign-trade',
    nameZh: '外贸制造业 (机械/汽配/建材)',
    nameEn: 'Global Manufacturing & Trade',
    defaultB2bIndustry: 'CNC Machining & Industrial Parts',
    defaultCountry: 'Germany',
    defaultPitchZh: '源头工厂直供 CNC 精密零件与工业组件，支持小批量打样与 ISO9001 认证出海交付。',
    defaultPitchEn: 'ISO-9001 certified precision CNC machining & custom industrial parts direct from factory.',
    recommendedPack: 'pack-global-b2b-outbound',
  },
  {
    id: 'crossborder-ecom',
    nameZh: '跨境电商与海外红人带货',
    nameEn: 'Cross-Border E-Commerce & Creators',
    defaultB2bIndustry: 'Home Gadgets & DTC Retail',
    defaultCountry: 'USA',
    defaultPitchZh: '高毛利家居爆品海外仓直发，诚邀 TikTok / YouTube / Instagram 垂类红人寄样合作。',
    defaultPitchEn: 'High-margin DTC lifestyle gadgets with US/EU warehouse fulfillment for TikTok & IG creators.',
    recommendedPack: 'pack-crossborder-ecom',
  },
  {
    id: 'tob-bidding',
    nameZh: '政企招投标与工程服务',
    nameEn: 'Enterprise ToB & Public Tenders',
    defaultB2bIndustry: '弱电智能化工程系统集成',
    defaultCountry: 'CN',
    defaultPitchZh: '标脉 AI 标书风控与招投标赋能平台：一键排查废标风险、精准匹配政企标讯甲方联系人。',
    defaultPitchEn: 'Enterprise tender intelligence & automated compliance auditing for B2B bidding teams.',
    recommendedPack: 'pack-tob-bidding',
  },
  {
    id: 'local-business',
    nameZh: '本地生活商户 (餐饮/医美/教培)',
    nameEn: 'Local Services & Retail',
    defaultB2bIndustry: '口腔医美与全屋定制门店',
    defaultCountry: 'CN',
    defaultPitchZh: '本地同城高意向客资精准触达：小红书/抖音痛点种草 + 评论区高意向客户秒级回复入库。',
    defaultPitchEn: 'Hyper-local customer acquisition across RedNote, Douyin, and Google Maps.',
    recommendedPack: 'pack-leadgen-ops',
  },
  {
    id: 'saas-tech',
    nameZh: '软件 SaaS 与科技服务出海',
    nameEn: 'Global B2B SaaS & Tech',
    defaultB2bIndustry: 'B2B AI Automation Software',
    defaultCountry: 'Singapore',
    defaultPitchZh: '标脉灵枢开源 AI 获客工作台：帮出海企业 1 人管理 17 大社媒 + 全球 B2B 客户开发闭环。',
    defaultPitchEn: 'Open-source AI lead-gen workbench empowering lean global teams across 17 social + B2B channels.',
    recommendedPack: 'pack-leadgen-ops',
  },
];

export const ALL_PLATFORMS: MediaPlatform[] = [
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

export interface LocalAccount {
  id: string;
  platformId: string;
  label: string;
  partition: string;
  createdAt: string;
}

export interface LocalPost {
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

export type LeadStage = 'new' | 'engaged' | 'qualified' | 'opportunity' | 'won';

export interface LocalLead {
  id: string;
  platformId: string;
  nickname: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
  sanitizedComment: string;
  tier: 'S' | 'A' | 'B' | 'C';
  score: number;
  stage: LeadStage;
  dealValue: number;
  createdAt: string;
}

export interface StudioSettings {
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
  crawlerToken?: string;
  crmProvider?: 'twenty' | 'atomic' | 'webhook';
  crmBaseUrl?: string;
  crmApiKey?: string;
}

export interface AnalyzedComment {
  id: string;
  text: string;
  redacted: number;
  tier: 'S' | 'A' | 'B' | 'C';
  score: number;
  draftReply: string;
}

export const getBridge = (): BiaoMaiElectronBridge | undefined =>
  (window as unknown as { biaomaiAPI?: BiaoMaiElectronBridge }).biaomaiAPI;

export const KEYS = {
  accounts: 'biaomai:local:accounts',
  posts: 'biaomai:local:posts',
  leads: 'biaomai:local:leads',
  prospects: 'biaomai:local:prospects',
  settings: 'biaomai:local:settings',
};

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function sanitizePii(raw: string): { text: string; redacted: number } {
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

export function scoreComment(content: string): { tier: 'S' | 'A' | 'B' | 'C'; score: number; draftReply: string } {
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
