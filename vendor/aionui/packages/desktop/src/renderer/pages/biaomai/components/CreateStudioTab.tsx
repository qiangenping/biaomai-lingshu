/**
 * @license
 * Copyright 2026 OpenGrowth Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Button, Input, Progress, Select, Space, Tag } from '@arco-design/web-react';
import {
  IconArrowRight,
  IconEdit,
  IconImage,
  IconSend,
  IconThunderbolt,
  IconVideoCamera,
  IconHeart,
  IconMessage,
  IconShareAlt,
} from '@arco-design/web-react/icon';
import { ALL_PLATFORMS, type LocalPost, type MediaPlatform } from '../types';

const { TextArea } = Input;

interface CreateStudioTabProps {
  isZh: boolean;
  createPlatform: string;
  setCreatePlatform: (v: string) => void;
  targetLang: string;
  setTargetLang: (v: string) => void;
  topicInput: string;
  setTopicInput: (v: string) => void;
  creatingAll: boolean;
  creatingCopy: boolean;
  creatingImg: boolean;
  creatingVideo: boolean;
  videoTaskProgress: number;
  videoTaskStatus: string;
  draftTitle: string;
  setDraftTitle: (v: string) => void;
  draftBody: string;
  setDraftBody: (v: string) => void;
  draftImageUrl: string;
  draftVideoUrl: string;
  draftMotionUrl?: string;
  draftMotionHtml?: string;
  onOpenMotionWindow?: () => void;
  draftShortLink: string;
  setDraftShortLink: (v: string) => void;
  scheduledTime: string;
  setScheduledTime: (v: string) => void;
  selectedCreatePlatform: MediaPlatform;
  recentPosts: LocalPost[];
  onLoadHistoryPost: (post: LocalPost) => void;
  onGenerateAll: () => void;
  onAiGenerateCopy: () => void;
  onAiGenerateImage: () => void;
  onGenerateOpenMotion: () => void;
  onSaveToSchedule: () => void;
  onPublishNowInBrowser: () => void;
}

export const CreateStudioTab: React.FC<CreateStudioTabProps> = ({
  isZh,
  createPlatform,
  setCreatePlatform,
  targetLang,
  setTargetLang,
  topicInput,
  setTopicInput,
  creatingAll,
  creatingCopy,
  creatingImg,
  creatingVideo,
  videoTaskProgress,
  videoTaskStatus,
  draftTitle,
  setDraftTitle,
  draftBody,
  setDraftBody,
  draftImageUrl,
  draftVideoUrl,
  draftMotionUrl,
  draftMotionHtml,
  onOpenMotionWindow,
  draftShortLink,
  setDraftShortLink,
  scheduledTime,
  setScheduledTime,
  selectedCreatePlatform,
  recentPosts,
  onLoadHistoryPost,
  onGenerateAll,
  onAiGenerateCopy,
  onAiGenerateImage,
  onGenerateOpenMotion,
  onSaveToSchedule,
  onPublishNowInBrowser,
}) => {
  const [previewTab, setPreviewTab] = useState<'cover' | 'motion'>('motion');
  const hasMotion = Boolean(draftMotionHtml || draftMotionUrl || draftVideoUrl);
  const showMotion = hasMotion && (previewTab === 'motion' || !draftImageUrl);

  return (
    <div className='flex-1 flex flex-row gap-20px items-stretch w-full min-h-[calc(100vh-136px)]'>
      {/* Left: Ultra-Simple 1-Click Composer */}
      <div className='flex-1 min-w-0 w-full p-24px rd-14px bg-1 border border-solid border-[var(--color-border-2)] flex flex-col justify-between gap-16px'>
        <div className='flex flex-col gap-16px flex-1'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='text-16px font-700 text-t-primary'>
                {isZh ? 'AI 一键内容工坊' : 'AI 1-Click Content Studio'}
              </div>
              <div className='text-12px text-t-secondary mt-2px'>
                {isZh ? '输入一句话卖点，一键生成「标题正文 + 品牌封面 + OpenMotion 动效」，哪不满意点哪微调' : 'Enter your pitch once to generate copy, cover visual, and OpenMotion animation in one click'}
              </div>
            </div>
            <Tag color='arcoblue'>{selectedCreatePlatform.aspect}</Tag>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-12px'>
            <div className='flex flex-col gap-4px'>
              <label className='text-12px font-500 text-t-secondary'>{isZh ? '目标发布平台' : 'Target Channel'}</label>
              <Select value={createPlatform} onChange={setCreatePlatform}>
                {ALL_PLATFORMS.map((p) => (
                  <Select.Option key={p.id} value={p.id}>
                    {isZh ? `${p.nameZh} · ${p.aspect}` : `${p.nameEn} · ${p.aspect}`}
                  </Select.Option>
                ))}
              </Select>
            </div>
            <div className='flex flex-col gap-4px'>
              <label className='text-12px font-500 text-t-secondary'>{isZh ? '内容生成语种' : 'Output Language'}</label>
              <Select value={targetLang} onChange={setTargetLang}>
                <Select.Option value='zh-CN'>简体中文 (zh-CN)</Select.Option>
                <Select.Option value='en-US'>English (Global)</Select.Option>
                <Select.Option value='ja-JP'>日本語 (ja-JP)</Select.Option>
                <Select.Option value='es-ES'>Español (es-ES)</Select.Option>
              </Select>
            </div>
          </div>

          <div className='flex flex-col gap-6px flex-1'>
            <div className='flex items-center justify-between gap-8px'>
              <label className='text-12px font-500 text-t-secondary'>
                {isZh ? '一句话产品卖点 / 客户痛点' : 'Product Pitch & Target ICP Pain Points'}
              </label>
              <Button
                size='mini'
                type='outline'
                onClick={() => {
                  const samplePitch = isZh
                    ? 'OpenGrowth 开源 AI 获客工作台：零 Docker 本地运行，一键生成 17 平台图文与动效，内置 AI 浏览器自动提取评论意向与 B2B 客户邮箱，替代每月 $500+ 碎片化获客 SaaS。'
                    : 'OpenGrowth: local-first, zero-Docker AI growth workbench replacing $500+/mo fragmented SaaS—1-click multilingual content, built-in AI browser, social intent radar, B2B prospector & Kanban CRM.';
                  setTopicInput(samplePitch);
                  if (!draftTitle.trim()) {
                    setDraftTitle(
                      isZh
                        ? '为什么出海与 B2B 团队正在放弃碎片化获客 SaaS？'
                        : 'Stop paying $500/mo for 6 disconnected lead-gen tools'
                    );
                  }
                  if (!draftBody.trim()) {
                    setDraftBody(
                      isZh
                        ? '用一套 100% 本地运行的开源桌面端，串联「内容创作 → 17 渠道分发 → 内置 AI 浏览器意向雷达 → B2B 寻客与看板 CRM」，数据与 Cookie 完全留在本地硬盘。'
                        : 'Run your entire inbound + outbound pipeline locally on your desktop: generate multilingual copy + OpenMotion visuals, capture live buyer intent in the built-in AI browser, enrich B2B leads with MX verification, and sync directly to Kanban CRM.'
                    );
                  }
                }}
              >
                {isZh ? '✨ 一键填入示例' : '✨ Try Sample Pitch'}
              </Button>
            </div>
            <TextArea
              rows={5}
              value={topicInput}
              onChange={setTopicInput}
              placeholder={
                isZh
                  ? '例如：标书查重、废标检查、暗标检查，帮招投标团队 3 分钟排查废标风险...'
                  : 'Describe your product pitch & buyer pain points...'
              }
              style={{ flex: 1, minHeight: 130 }}
            />
          </div>

          {/* Single Primary 1-Click Action */}
          <div className='flex flex-col gap-10px'>
            <Button
              type='primary'
              long
              icon={<IconThunderbolt />}
              loading={creatingAll || creatingCopy}
              onClick={onGenerateAll}
              style={{ height: 42, fontSize: 14, fontWeight: 600 }}
            >
              {isZh ? '一键生成全套内容（文案 + 封面 + 动效）' : '1-Click Generate All (Copy + Cover + Motion)'}
            </Button>

            {/* Lightweight Per-Part Tweak Row */}
            <div className='flex items-center justify-between flex-wrap gap-8px'>
              <span className='text-12px text-t-secondary'>
                {isZh ? '局部微调（哪不好改哪）：' : 'Tweak individually:'}
              </span>
              <Space size='mini' wrap>
                <Button size='small' type='secondary' icon={<IconEdit />} loading={creatingCopy} onClick={onAiGenerateCopy}>
                  {isZh ? '重生成文案' : 'Rewrite Copy'}
                </Button>
                <Button size='small' type='secondary' icon={<IconImage />} loading={creatingImg} onClick={() => { setPreviewTab('cover'); onAiGenerateImage(); }}>
                  {isZh ? '换封面' : 'New Cover'}
                </Button>
                <Button size='small' type='secondary' icon={<IconVideoCamera />} loading={creatingVideo} onClick={() => { setPreviewTab('motion'); onGenerateOpenMotion(); }}>
                  {isZh ? '换动效' : 'New Motion'}
                </Button>
              </Space>
            </div>
          </div>

          {(creatingVideo || videoTaskStatus) && (
            <div className='p-10px rd-10px bg-2 border border-solid border-[var(--color-border-2)] flex flex-col gap-6px'>
              <div className='flex items-center justify-between text-12px'>
                <span className='font-600 text-t-primary truncate'>{videoTaskStatus}</span>
                <span className='text-t-secondary shrink-0'>{videoTaskProgress}%</span>
              </div>
              <Progress percent={videoTaskProgress} size='small' showText={false} color='#4F46E5' />
            </div>
          )}

          {/* Recent Drafts / History Strip */}
          {recentPosts.length > 0 && (
            <div className='flex flex-col gap-6px'>
              <div className='text-12px font-600 text-t-secondary'>
                {isZh ? `最近创作记录 (${recentPosts.length}) · 点击回填编辑` : `Recent Drafts (${recentPosts.length})`}
              </div>
              <div className='flex items-center gap-6px flex-wrap'>
                {recentPosts.slice(0, 4).map((post) => (
                  <button
                    key={post.id}
                    type='button'
                    onClick={() => onLoadHistoryPost(post)}
                    className='h-26px px-10px rd-6px border-none bg-fill-2 hover:bg-fill-3 text-12px text-t-primary cursor-pointer max-w-220px truncate transition-colors'
                  >
                    {post.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Publish / Schedule Bar */}
        <div className='flex flex-col gap-12px pt-10px border-t border-solid border-[var(--color-border-2)]'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-12px'>
            <div className='flex flex-col gap-4px'>
              <label className='text-12px font-500 text-t-secondary'>{isZh ? '归因短链 / UTM（可选）' : 'UTM / Short-Link'}</label>
              <Input value={draftShortLink} onChange={setDraftShortLink} placeholder='https://...' />
            </div>
            <div className='flex flex-col gap-4px'>
              <label className='text-12px font-500 text-t-secondary'>{isZh ? '计划发布时间' : 'Schedule Time'}</label>
              <Input value={scheduledTime} onChange={setScheduledTime} placeholder='YYYY-MM-DD HH:mm' />
            </div>
          </div>

          <div className='flex items-center justify-end gap-10px flex-wrap'>
            <Button type='secondary' onClick={onSaveToSchedule}>
              <span className='flex items-center gap-6px'>
                {isZh ? '加入排期日历' : 'Save to Schedule'}
                <IconArrowRight />
              </span>
            </Button>
            <Button type='primary' icon={<IconSend />} onClick={onPublishNowInBrowser}>
              {isZh ? '立即去 AI 浏览器发布' : 'Publish in AI Browser'}
            </Button>
          </div>
        </div>
      </div>

      {/* Right: Full-Height Phone Preview with Inline Editing & Cover/Motion Switch */}
      <div className='shrink-0 flex' style={{ width: 350 }}>
        <div
          className='w-full h-full shadow-xl flex flex-col'
          style={{ padding: 10, borderRadius: 30, background: '#0F172A', border: '2px solid #334155' }}
        >
          <div className='flex items-center justify-between px-14px pb-8px pt-2px text-10px font-600' style={{ color: 'rgba(255,255,255,0.8)' }}>
            <span>9:41</span>
            <div style={{ width: 76, height: 16, borderRadius: 9999, background: '#000000' }} />
            <span>5G</span>
          </div>

          <div className='rd-22px bg-1 overflow-hidden flex flex-col flex-1'>
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
              <Space size='mini'>
                {draftImageUrl && hasMotion && (
                  <button
                    type='button'
                    onClick={() => setPreviewTab((p) => (p === 'motion' ? 'cover' : 'motion'))}
                    className='px-6px py-2px rd-4px border-none bg-[rgba(79,70,229,0.1)] text-[#4F46E5] text-10px font-600 cursor-pointer'
                  >
                    {showMotion ? (isZh ? '切封面图' : 'Cover') : (isZh ? '切动效' : 'Motion')}
                  </button>
                )}
                <span className='text-10px px-6px py-1px rd-4px bg-fill-2 text-t-secondary'>{selectedCreatePlatform.aspect}</span>
              </Space>
            </div>

            {showMotion && (draftMotionHtml || draftMotionUrl) ? (
              <div className='relative w-full h-240px bg-[#090d16]'>
                <iframe
                  srcDoc={draftMotionHtml || undefined}
                  src={!draftMotionHtml ? draftMotionUrl : undefined}
                  title='OpenMotion Preview'
                  className='w-full h-full border-none'
                />
                {onOpenMotionWindow && (
                  <button
                    type='button'
                    onClick={onOpenMotionWindow}
                    className='absolute right-8px bottom-8px px-10px py-4px rd-6px border-none bg-[#4F46E5] text-white text-11px font-600 cursor-pointer'
                  >
                    {isZh ? '放大预览' : 'Expand'}
                  </button>
                )}
              </div>
            ) : draftVideoUrl ? (
              <video src={draftVideoUrl} controls className='w-full h-220px object-cover bg-black' />
            ) : draftImageUrl ? (
              <img src={draftImageUrl} alt='AI Cover' className='w-full h-220px object-cover' />
            ) : (
              <div className='h-220px bg-2 flex flex-col items-center justify-center gap-6px text-12px text-t-secondary border-b border-solid border-[var(--color-border-2)]'>
                <IconImage style={{ fontSize: 26, opacity: 0.45 }} />
                <span className='font-500'>{isZh ? '点左侧「一键生成」即时预览封面与动效' : 'Click 1-Click Generate to preview'}</span>
              </div>
            )}

            <div className='p-14px flex flex-col gap-8px flex-1'>
              <input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder={isZh ? '点击可直接修改标题...' : 'Headline...'}
                className='w-full border-none outline-none bg-transparent text-14px font-700 text-t-primary'
              />
              <textarea
                rows={6}
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                placeholder={isZh ? '正文与 CTA 钩子（生成后可直接点此微调）...' : 'Body copy & CTA...'}
                className='w-full flex-1 resize-none border-none outline-none bg-transparent text-12px leading-relaxed text-t-secondary'
              />
              {draftShortLink && (
                <div className='px-8px py-3px rd-6px bg-[rgba(79,70,229,0.08)] text-[#4F46E5] text-11px truncate'>
                  {draftShortLink}
                </div>
              )}
            </div>

            <div className='px-12px py-8px border-t border-solid border-[var(--color-border-2)] flex items-center justify-between text-t-tertiary text-12px'>
              <span className='flex items-center gap-4px'><IconHeart /> 1.2k</span>
              <span className='flex items-center gap-4px'><IconMessage /> 86</span>
              <span className='flex items-center gap-4px'><IconShareAlt /> {isZh ? '转发' : 'Share'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
