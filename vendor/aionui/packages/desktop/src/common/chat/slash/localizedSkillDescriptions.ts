/**
 * @license
 * Copyright 2026 OpenGrowth Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const LOCALIZED_SKILL_DESCRIPTIONS: Record<string, { zh: string; en: string }> = {
  'crawl4ai-extractor': {
    zh: 'Crawl4AI 全行业名录抓取：将黄页、展会与招投标网页转为结构化线索',
    en: 'Crawl4AI universal web directory & tender extraction skill',
  },
  'gmaps-bulk-scraper': {
    zh: 'Google 地图批量获客：按行业与国家提取商家名称、官网与电话',
    en: 'Bulk Google Maps B2B prospect extraction skill',
  },
  'openoutreach-icp': {
    zh: 'OpenOutreach AI 寻客：客户画像匹配评分与多语种开发信破冰',
    en: 'AI ICP fit scoring & multilingual cold outreach drafting skill',
  },
  'quickly-sequence': {
    zh: 'Quickly 多邮箱轮询：3 轮冷邮件序列触达与每日发送限额保护',
    en: 'Multi-inbox rotation & 3-step cold email sequence skill',
  },
  'agentsdr-omnichannel': {
    zh: 'AgentSDR 全渠道触达：Email + LinkedIn + WhatsApp 协同开发',
    en: 'Email + LinkedIn + WhatsApp coordinated outreach skill',
  },
  'twenty-crm-sync': {
    zh: 'Twenty / Atomic 开源 CRM：一键同步高意向线索与商机管道',
    en: 'Sync qualified leads and deals to Twenty CRM or Atomic CRM',
  },
  'openmotion-video': {
    zh: 'OpenMotion 动效视频工坊：生成可编辑 Motion.md 分镜与 HTML5/MP4 短视频',
    en: 'Generate editable Motion.md storyboards & HTML5/MP4 motion videos',
  },
  'aitoearn-core': {
    zh: 'OpenGrowth多平台获客核心：内容、发布、雷达与 CRM 全链路编排',
    en: 'Core multi-platform lead-gen orchestration skill',
  },
  'channel-publish': {
    zh: '全渠道矩阵分发：17 大国内外社媒定时排期与短链归因发布',
    en: '17-channel social media matrix scheduling & UTM publishing skill',
  },
  'image-creation': {
    zh: 'AI 获客配图生成：自动匹配小红书 3:4、抖音 9:16 等平台封面画幅',
    en: 'AI multimodal cover image generation for lead-gen posts',
  },
  'video-generation': {
    zh: 'AI 短视频与出海多语配音：批量制作高转化营销短视频',
    en: 'AI short-video generation & multilingual dubbing skill',
  },
  'browser-operations': {
    zh: '隔离浏览器合规巡检：评论区高意向询价识别与人工确认回复',
    en: 'Isolated browser intent radar & human-in-the-loop reply skill',
  },
  'sample-office-skill': {
    zh: '本地办公自动化示例技能：批量文档处理与自定义画布演示',
    en: 'Sample local office automation & custom canvas skill',
  },
};

export function localizeSkillDescription(name: string, fallback: string, locale?: string): string {
  const entry = LOCALIZED_SKILL_DESCRIPTIONS[name];
  if (!entry) return fallback;
  const isZh = (locale || '').toLowerCase().startsWith('zh');
  return isZh ? entry.zh : entry.en;
}
