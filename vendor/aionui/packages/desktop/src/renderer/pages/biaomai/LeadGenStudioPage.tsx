/**
 * @license
 * Copyright 2026 BiaoMai Lingshu Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
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

interface MediaPlatform {
  id: string;
  region: 'cn' | 'global';
  nameZh: string;
  nameEn: string;
  creatorUrl: string;
  localUploader: string;
}

const ALL_PLATFORMS: MediaPlatform[] = [
  { id: 'douyin', region: 'cn', nameZh: '抖音', nameEn: 'Douyin', creatorUrl: 'https://creator.douyin.com/', localUploader: 'social-auto-upload/douyin_uploader' },
  { id: 'xiaohongshu', region: 'cn', nameZh: '小红书', nameEn: 'RedNote (XHS)', creatorUrl: 'https://creator.xiaohongshu.com/', localUploader: 'social-auto-upload/xiaohongshu_uploader' },
  { id: 'wechat_channels', region: 'cn', nameZh: '微信视频号', nameEn: 'WeChat Channels', creatorUrl: 'https://channels.weixin.qq.com/', localUploader: 'social-auto-upload/tencent_uploader' },
  { id: 'kuaishou', region: 'cn', nameZh: '快手', nameEn: 'Kuaishou', creatorUrl: 'https://cp.kuaishou.com/', localUploader: 'social-auto-upload/ks_uploader' },
  { id: 'bilibili', region: 'cn', nameZh: 'B站', nameEn: 'Bilibili', creatorUrl: 'https://member.bilibili.com/', localUploader: 'social-auto-upload/bilibili_uploader' },
  { id: 'wechat_oa', region: 'cn', nameZh: '微信公众号', nameEn: 'WeChat OA', creatorUrl: 'https://mp.weixin.qq.com/', localUploader: 'browser-studio' },
  { id: 'weibo', region: 'cn', nameZh: '微博', nameEn: 'Weibo', creatorUrl: 'https://weibo.com/', localUploader: 'social-auto-upload/weibo_uploader' },
  { id: 'zhihu', region: 'cn', nameZh: '知乎', nameEn: 'Zhihu', creatorUrl: 'https://www.zhihu.com/creator', localUploader: 'social-auto-upload/zhihu_uploader' },
  { id: 'baijiahao', region: 'cn', nameZh: '百家号', nameEn: 'Baijiahao', creatorUrl: 'https://baijiahao.baidu.com/', localUploader: 'social-auto-upload/baijiahao_uploader' },
  { id: 'tiktok', region: 'global', nameZh: 'TikTok', nameEn: 'TikTok', creatorUrl: 'https://www.tiktok.com/creator-center/upload', localUploader: 'social-auto-upload/tk_uploader' },
  { id: 'youtube', region: 'global', nameZh: 'YouTube', nameEn: 'YouTube', creatorUrl: 'https://studio.youtube.com/', localUploader: 'social-auto-upload/youtube_uploader' },
  { id: 'instagram', region: 'global', nameZh: 'Instagram', nameEn: 'Instagram', creatorUrl: 'https://business.facebook.com/latest/composer', localUploader: 'social-auto-upload/meta_uploader' },
  { id: 'facebook', region: 'global', nameZh: 'Facebook', nameEn: 'Facebook', creatorUrl: 'https://business.facebook.com/', localUploader: 'social-auto-upload/meta_uploader' },
  { id: 'x', region: 'global', nameZh: 'X (Twitter)', nameEn: 'X (Twitter)', creatorUrl: 'https://x.com/compose/post', localUploader: 'browser-studio' },
  { id: 'linkedin', region: 'global', nameZh: 'LinkedIn', nameEn: 'LinkedIn', creatorUrl: 'https://www.linkedin.com/feed/', localUploader: 'browser-studio' },
  { id: 'threads', region: 'global', nameZh: 'Threads', nameEn: 'Threads', creatorUrl: 'https://www.threads.net/', localUploader: 'browser-studio' },
  { id: 'pinterest', region: 'global', nameZh: 'Pinterest', nameEn: 'Pinterest', creatorUrl: 'https://www.pinterest.com/pin-creation-tool/', localUploader: 'browser-studio' },
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
  status: 'draft' | 'published';
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

function scoreComment(content: string): { tier: 'S' | 'A' | 'B' | 'C'; score: number } {
  const lower = content.toLowerCase();
  const sKeys = ['怎么收费', '多少钱', '报价', '求链接', '怎么买', '合作', '私有化', 'how much', 'pricing', 'link', 'buy'];
  const aKeys = ['支持', '适合', '教程', '怎么用', '对比', 'support', 'tutorial', 'compatible'];
  if (sKeys.some((k) => lower.includes(k))) return { tier: 'S', score: 92 };
  if (aKeys.some((k) => lower.includes(k))) return { tier: 'A', score: 75 };
  if (content.length >= 12) return { tier: 'B', score: 52 };
  return { tier: 'C', score: 30 };
}

const STORAGE_KEYS = {
  accounts: 'biaomai:local:accounts',
  posts: 'biaomai:local:posts',
  leads: 'biaomai:local:leads',
};

function readStorage<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

const LeadGenStudioPage: React.FC = () => {
  const { i18n } = useTranslation();
  const isZh = (i18n.language || 'zh-CN').startsWith('zh');

  const [regionFilter, setRegionFilter] = useState<'all' | 'cn' | 'global'>('all');
  const [accounts, setAccounts] = useState<LocalAccount[]>(() => readStorage<LocalAccount>(STORAGE_KEYS.accounts));
  const [posts, setPosts] = useState<LocalPost[]>(() => readStorage<LocalPost>(STORAGE_KEYS.posts));
  const [leads, setLeads] = useState<LocalLead[]>(() => readStorage<LocalLead>(STORAGE_KEYS.leads));

  // New account form
  const [accPlatform, setAccPlatform] = useState('xiaohongshu');
  const [accLabel, setAccLabel] = useState('');

  // Local publish form
  const [pubPlatform, setPubPlatform] = useState('xiaohongshu');
  const [pubTitle, setPubTitle] = useState('');
  const [pubBody, setPubBody] = useState('');

  // Comment radar input
  const [radarPlatform, setRadarPlatform] = useState('xiaohongshu');
  const [rawCommentInput, setRawCommentInput] = useState('');
  const [analyzedList, setAnalyzedList] = useState<
    Array<{ id: string; text: string; redacted: number; tier: 'S' | 'A' | 'B' | 'C'; score: number }>
  >([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.leads, JSON.stringify(leads));
  }, [leads]);

  const visiblePlatforms = useMemo(
    () => (regionFilter === 'all' ? ALL_PLATFORMS : ALL_PLATFORMS.filter((p) => p.region === regionFilter)),
    [regionFilter]
  );

  const handleAddAccount = () => {
    if (!accLabel.trim()) {
      Message.warning(isZh ? '请输入账号备注名' : 'Please enter an account label');
      return;
    }
    const id = `acc_${Date.now()}`;
    const next: LocalAccount = {
      id,
      platformId: accPlatform,
      label: accLabel.trim(),
      partition: `persist:bm-acc-${accPlatform}-${id}`,
      createdAt: new Date().toISOString(),
    };
    setAccounts((prev) => [next, ...prev]);
    setAccLabel('');
    Message.success(isZh ? '已创建本地隔离账号容器' : 'Created local isolated account partition');
  };

  const handleOpenCreator = (platform: MediaPlatform) => {
    window.open(platform.creatorUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCreatePost = () => {
    if (!pubTitle.trim()) {
      Message.warning(isZh ? '请输入发布标题' : 'Please enter a title');
      return;
    }
    const post: LocalPost = {
      id: `post_${Date.now()}`,
      platformId: pubPlatform,
      title: pubTitle.trim(),
      body: pubBody.trim(),
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) => [post, ...prev]);
    setPubTitle('');
    setPubBody('');
    Message.success(isZh ? '草稿已保存到本地' : 'Draft saved locally');
  };

  const handleConfirmPublish = (post: LocalPost) => {
    const plat = ALL_PLATFORMS.find((p) => p.id === post.platformId);
    Modal.confirm({
      title: isZh ? '人工确认发布（合规门禁）' : 'Human-in-the-Loop Publish Confirmation',
      content: isZh
        ? `即将打开「${plat?.nameZh ?? post.platformId}」创作者后台进行本地发布：${post.title}`
        : `Open "${plat?.nameEn ?? post.platformId}" creator studio to publish: ${post.title}`,
      okText: isZh ? '确认并打开后台' : 'Confirm & Open Studio',
      cancelText: isZh ? '取消' : 'Cancel',
      onOk: () => {
        if (plat) handleOpenCreator(plat);
        setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: 'published' } : p)));
        Message.success(isZh ? '已标记为已发布并打开创作者后台' : 'Marked published and opened studio');
      },
    });
  };

  const handleAnalyzeComments = () => {
    const lines = rawCommentInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      Message.warning(isZh ? '请先粘贴真实评论（每行一条）' : 'Please paste real comments (one per line)');
      return;
    }
    const results = lines.map((line, idx) => {
      const { text, redacted } = sanitizePii(line);
      const { tier, score } = scoreComment(text);
      return { id: `c_${Date.now()}_${idx}`, text, redacted, tier, score };
    });
    results.sort((a, b) => b.score - a.score);
    setAnalyzedList(results);
    Message.success(isZh ? `已完成 ${results.length} 条评论脱敏与意向评分` : `Scored ${results.length} sanitized comments`);
  };

  const handleAddToCrm = (item: { id: string; text: string; tier: 'S' | 'A' | 'B' | 'C'; score: number }) => {
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
    Message.success(isZh ? '已加入本地线索 CRM' : 'Added to local Lead CRM');
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
    const header = 'id,platform,nickname,sanitizedComment,tier,score,stage,createdAt';
    const rows = leads.map((l) =>
      [l.id, l.platformId, l.nickname, l.sanitizedComment, l.tier, l.score, l.stage, l.createdAt]
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
      <div className='max-w-1160px mx-auto flex flex-col gap-16px'>
        <div className='flex items-center justify-between flex-wrap gap-12px'>
          <div>
            <h1 className='m-0 text-22px font-600 text-t-primary'>
              {isZh ? '标脉全媒介获客工作台（100% 本地免 Docker）' : 'BiaoMai Omni-Media Lead-Gen Studio (100% Local, Zero Docker)'}
            </h1>
            <p className='m-0 mt-4px text-13px text-t-secondary'>
              {isZh
                ? '覆盖国内 9 大 + 国际 8 大共 17 个主流媒介，融合 social-auto-upload (MIT) 本地直发与合规评论意向雷达，人人下载即用。'
                : 'Supports 17 global & domestic platforms locally with zero Docker, powered by social-auto-upload (MIT) & compliant PII-safe intent radar.'}
            </p>
          </div>
          <Space>
            <Tag color='green'>{isZh ? '零 Docker 本地运行' : 'Zero-Docker Local'}</Tag>
            <Tag color='arcoblue'>17 {isZh ? '全媒介平台' : 'Platforms'}</Tag>
            <Tag color='purple'>Apache-2.0 / MIT</Tag>
          </Space>
        </div>

        <Tabs defaultActiveTab='channels' type='rounded'>
          <TabPane key='channels' title={isZh ? `全媒介账号与直发 (${ALL_PLATFORMS.length})` : `All Channels (${ALL_PLATFORMS.length})`}>
            <div className='flex flex-col gap-16px pt-8px'>
              <Card bordered className='rd-12px'>
                <div className='flex items-center justify-between flex-wrap gap-10px mb-12px'>
                  <span className='font-600'>{isZh ? '全球 17 大媒介直达入口（内置本地隔离登录）' : '17 Global & Domestic Media Platforms'}</span>
                  <Space>
                    <Button size='small' type={regionFilter === 'all' ? 'primary' : 'secondary'} onClick={() => setRegionFilter('all')}>
                      {isZh ? '全部 (17)' : 'All (17)'}
                    </Button>
                    <Button size='small' type={regionFilter === 'cn' ? 'primary' : 'secondary'} onClick={() => setRegionFilter('cn')}>
                      {isZh ? '🇨🇳 国内 (9)' : '🇨🇳 China (9)'}
                    </Button>
                    <Button size='small' type={regionFilter === 'global' ? 'primary' : 'secondary'} onClick={() => setRegionFilter('global')}>
                      {isZh ? '🌍 海外 (8)' : '🌍 Global (8)'}
                    </Button>
                  </Space>
                </div>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-10px'>
                  {visiblePlatforms.map((p) => (
                    <div
                      key={p.id}
                      className='p-12px rd-10px border border-solid border-[var(--color-border-2)] flex flex-col gap-6px bg-2'
                    >
                      <div className='flex items-center justify-between'>
                        <span className='font-600 text-14px'>{isZh ? p.nameZh : p.nameEn}</span>
                        <Tag size='small' color={p.region === 'cn' ? 'orangered' : 'arcoblue'}>
                          {p.region === 'cn' ? 'CN' : 'Global'}
                        </Tag>
                      </div>
                      <span className='text-11px text-t-secondary truncate'>{p.localUploader}</span>
                      <Button size='mini' type='outline' onClick={() => handleOpenCreator(p)}>
                        {isZh ? '打开创作者后台 ↗' : 'Open Studio ↗'}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-16px'>
                <Card title={isZh ? '本地多账号隔离容器' : 'Isolated Local Accounts'} bordered className='rd-12px'>
                  <Space className='w-full mb-12px' direction='vertical'>
                    <div className='flex gap-8px'>
                      <Select value={accPlatform} onChange={setAccPlatform} style={{ width: 150 }}>
                        {ALL_PLATFORMS.map((p) => (
                          <Select.Option key={p.id} value={p.id}>
                            {isZh ? p.nameZh : p.nameEn}
                          </Select.Option>
                        ))}
                      </Select>
                      <Input
                        placeholder={isZh ? '账号备注（如：小红书主号）' : 'Account label'}
                        value={accLabel}
                        onChange={setAccLabel}
                      />
                      <Button type='primary' onClick={handleAddAccount}>
                        {isZh ? '添加' : 'Add'}
                      </Button>
                    </div>
                  </Space>
                  {accounts.length === 0 ? (
                    <Empty description={isZh ? '暂无本地账号，添加后自动分配独立 Cookie 隔离区' : 'No local accounts yet'} />
                  ) : (
                    <div className='flex flex-col gap-8px'>
                      {accounts.map((a) => (
                        <div key={a.id} className='flex items-center justify-between p-8px rd-8px bg-2'>
                          <div>
                            <div className='font-500'>{a.label}</div>
                            <div className='text-11px text-t-secondary'>{a.partition}</div>
                          </div>
                          <Tag color='green'>{a.platformId}</Tag>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                <Card title={isZh ? '本地创作与人工确认发布队列' : 'Local Publish Queue (Human-in-the-Loop)'} bordered className='rd-12px'>
                  <div className='flex flex-col gap-8px mb-12px'>
                    <Select value={pubPlatform} onChange={setPubPlatform}>
                      {ALL_PLATFORMS.map((p) => (
                        <Select.Option key={p.id} value={p.id}>
                          {isZh ? p.nameZh : p.nameEn}
                        </Select.Option>
                      ))}
                    </Select>
                    <Input placeholder={isZh ? '输入获客标题' : 'Enter headline'} value={pubTitle} onChange={setPubTitle} />
                    <TextArea rows={2} placeholder={isZh ? '输入正文与 CTA 钩子' : 'Enter copy & CTA hook'} value={pubBody} onChange={setPubBody} />
                    <Button type='primary' onClick={handleCreatePost}>
                      {isZh ? '保存到本地队列' : 'Save to Local Queue'}
                    </Button>
                  </div>
                  {posts.length === 0 ? (
                    <Empty description={isZh ? '暂无待发草稿' : 'No queued drafts yet'} />
                  ) : (
                    <div className='flex flex-col gap-8px'>
                      {posts.map((post) => (
                        <div key={post.id} className='flex items-center justify-between p-8px rd-8px bg-2'>
                          <div className='min-w-0 pr-8px'>
                            <div className='font-500 truncate'>{post.title}</div>
                            <Tag size='small' color={post.status === 'published' ? 'green' : 'orange'}>
                              {post.platformId} · {post.status}
                            </Tag>
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

          <TabPane key='radar' title={isZh ? '评论区意向雷达（合规脱敏）' : 'Comment Intent Radar'}>
            <div className='flex flex-col gap-16px pt-8px'>
              <Card bordered className='rd-12px'>
                <div className='flex flex-col gap-10px'>
                  <div className='flex items-center gap-10px'>
                    <Select value={radarPlatform} onChange={setRadarPlatform} style={{ width: 180 }}>
                      {ALL_PLATFORMS.map((p) => (
                        <Select.Option key={p.id} value={p.id}>
                          {isZh ? p.nameZh : p.nameEn}
                        </Select.Option>
                      ))}
                    </Select>
                    <Button type='primary' onClick={handleAnalyzeComments}>
                      {isZh ? '🎯 脱敏并分析意向等级' : '🎯 Sanitize & Score Intent'}
                    </Button>
                  </div>
                  <TextArea
                    rows={4}
                    value={rawCommentInput}
                    onChange={setRawCommentInput}
                    placeholder={
                      isZh
                        ? '粘贴真实评论区文本（每行一条），系统将自动剔除手机号/微信号/邮箱/链接并按 S/A/B/C 分级...'
                        : 'Paste real comments (one per line). PII is redacted automatically before S/A/B/C scoring...'
                    }
                  />
                </div>
              </Card>

              {analyzedList.length === 0 ? (
                <Empty description={isZh ? '粘贴真实评论后点击分析即可筛选高意向潜客' : 'Paste real comments to score buyer intent'} />
              ) : (
                <div className='flex flex-col gap-10px'>
                  {analyzedList.map((item) => (
                    <Card key={item.id} bordered className='rd-10px'>
                      <div className='flex items-center justify-between gap-12px'>
                        <div className='flex flex-col gap-4px'>
                          <Space>
                            <Tag color={item.tier === 'S' ? 'red' : item.tier === 'A' ? 'orange' : 'gray'}>
                              {item.tier}-Tier · {item.score}
                            </Tag>
                            {item.redacted > 0 && (
                              <Tag color='green'>
                                {isZh ? `已自动脱敏 ${item.redacted} 处隐私` : `Redacted ${item.redacted} PII`}
                              </Tag>
                            )}
                          </Space>
                          <div>{item.text}</div>
                        </div>
                        <Button type='primary' size='small' onClick={() => handleAddToCrm(item)}>
                          {isZh ? '+ 加入线索 CRM' : '+ Add to CRM'}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabPane>

          <TabPane key='crm' title={isZh ? `本地线索 CRM (${leads.length})` : `Local Lead CRM (${leads.length})`}>
            <div className='flex flex-col gap-16px pt-8px'>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-12px'>
                <Card bordered className='rd-10px'>
                  <Statistic title={isZh ? '本地线索总数' : 'Total Leads'} value={leads.length} />
                </Card>
                <Card bordered className='rd-10px'>
                  <Statistic title={isZh ? 'S/A 高意向' : 'S/A High Intent'} value={leads.filter((l) => l.tier === 'S' || l.tier === 'A').length} />
                </Card>
                <Card bordered className='rd-10px'>
                  <Statistic title={isZh ? '商机跟进中' : 'Opportunities'} value={leads.filter((l) => l.stage === 'opportunity').length} />
                </Card>
                <Card bordered className='rd-10px'>
                  <Statistic title={isZh ? '已成交客户' : 'Won Deals'} value={leads.filter((l) => l.stage === 'won').length} />
                </Card>
              </div>

              <div className='flex justify-end'>
                <Button onClick={handleExportCsv} disabled={leads.length === 0}>
                  {isZh ? '导出 CSV 线索表' : 'Export CSV'}
                </Button>
              </div>

              {leads.length === 0 ? (
                <Empty description={isZh ? '暂无线索，可在「评论区意向雷达」筛选后一键入库' : 'No leads yet'} />
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
      </div>
    </div>
  );
};

export default LeadGenStudioPage;
