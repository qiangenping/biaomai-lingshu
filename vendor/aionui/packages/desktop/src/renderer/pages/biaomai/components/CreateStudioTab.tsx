/**
 * @license
 * Copyright 2026 BiaoMai Lingshu Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button, Input, Progress, Select } from '@arco-design/web-react';
import {
  IconArrowRight,
  IconEdit,
  IconHeart,
  IconImage,
  IconMessage,
  IconShareAlt,
  IconVideoCamera,
} from '@arco-design/web-react/icon';
import { ALL_PLATFORMS, type MediaPlatform } from '../types';

const { TextArea } = Input;

interface CreateStudioTabProps {
  isZh: boolean;
  createPlatform: string;
  setCreatePlatform: (v: string) => void;
  targetLang: 'zh-CN' | 'en-US' | 'ja-JP' | 'es-ES';
  setTargetLang: (v: 'zh-CN' | 'en-US' | 'ja-JP' | 'es-ES') => void;
  topicInput: string;
  setTopicInput: (v: string) => void;
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
  draftShortLink: string;
  setDraftShortLink: (v: string) => void;
  scheduledTime: string;
  setScheduledTime: (v: string) => void;
  selectedCreatePlatform: MediaPlatform;
  onAiGenerateCopy: () => void;
  onAiGenerateImage: () => void;
  onAiGenerateVideo: () => void;
  onSaveToSchedule: () => void;
}

export const CreateStudioTab: React.FC<CreateStudioTabProps> = ({
  isZh,
  createPlatform,
  setCreatePlatform,
  targetLang,
  setTargetLang,
  topicInput,
  setTopicInput,
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
  draftShortLink,
  setDraftShortLink,
  scheduledTime,
  setScheduledTime,
  selectedCreatePlatform,
  onAiGenerateCopy,
  onAiGenerateImage,
  onAiGenerateVideo,
  onSaveToSchedule,
}) => (
  <div className='grid grid-cols-1 lg:grid-cols-12 gap-18px items-start'>
    <div className='lg:col-span-7 p-20px rd-14px bg-1 border border-solid border-[var(--color-border-2)] shadow-[0_1px_3px_rgba(15,23,42,0.05)] flex flex-col gap-14px'>
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

      <div className='flex flex-col gap-4px'>
        <label className='text-12px font-500 text-t-secondary'>
          {isZh ? '产品卖点与目标客户痛点' : 'Product Pitch & Target ICP Pain Points'}
        </label>
        <TextArea
          rows={3}
          value={topicInput}
          onChange={setTopicInput}
          placeholder={
            isZh
              ? '输入产品卖点、目标客户痛点或要推广的主题，AI 将按所选平台生成高转化文案...'
              : 'Describe your product pitch & buyer pain points...'
          }
        />
      </div>

      <div className='grid grid-cols-3 gap-8px'>
        <Button type='primary' icon={<IconEdit />} loading={creatingCopy} onClick={onAiGenerateCopy} style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>
          {isZh ? 'AI 生成文案' : 'Generate Copy'}
        </Button>
        <Button type='secondary' icon={<IconImage />} loading={creatingImg} onClick={onAiGenerateImage}>
          {isZh ? '生成封面配图' : 'Cover Visual'}
        </Button>
        <Button type='secondary' icon={<IconVideoCamera />} loading={creatingVideo} onClick={onAiGenerateVideo}>
          {isZh ? (targetLang !== 'zh-CN' ? 'AI 视频 + 配音' : 'AI 短视频') : 'AI Video'}
        </Button>
      </div>

      {(creatingVideo || videoTaskStatus) && (
        <div className='p-10px rd-10px bg-2 border border-solid border-[var(--color-border-2)] flex flex-col gap-6px'>
          <div className='flex items-center justify-between text-12px'>
            <span className='font-600 text-t-primary'>{videoTaskStatus}</span>
            <span className='text-t-secondary'>{videoTaskProgress}%</span>
          </div>
          <Progress percent={videoTaskProgress} size='small' showText={false} color='#4F46E5' />
        </div>
      )}

      <div className='h-1px bg-[var(--color-border-2)]' />

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

      <div className='flex justify-end pt-2px'>
        <Button type='primary' onClick={onSaveToSchedule} style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>
          <span className='flex items-center gap-6px'>
            {isZh ? '保存草稿并进入排期分发' : 'Save & Continue to Publish'}
            <IconArrowRight />
          </span>
        </Button>
      </div>
    </div>

    <div className='lg:col-span-5 flex justify-center'>
      <div className='w-full max-w-330px p-10px rd-30px bg-[#0F172A] shadow-2xl border-2 border-solid border-[#334155]'>
        <div className='flex items-center justify-between px-14px pb-8px pt-2px text-white/75 text-10px font-600'>
          <span>9:41</span>
          <div className='w-76px h-16px rd-full bg-black' />
          <span>5G</span>
        </div>

        <div className='rd-22px bg-1 overflow-hidden flex flex-col'>
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
            <span className='text-10px px-6px py-1px rd-4px bg-fill-2 text-t-secondary'>{selectedCreatePlatform.aspect}</span>
          </div>

          {draftVideoUrl ? (
            <video src={draftVideoUrl} controls className='w-full h-170px object-cover bg-black' />
          ) : draftImageUrl ? (
            <img src={draftImageUrl} alt='AI Cover' className='w-full h-170px object-cover' />
          ) : (
            <div className='h-148px bg-2 flex flex-col items-center justify-center gap-4px text-12px text-t-secondary border-b border-solid border-[var(--color-border-2)]'>
              <IconImage style={{ fontSize: 22, opacity: 0.45 }} />
              <span className='font-500'>{isZh ? '封面视觉预览' : 'Cover Preview'}</span>
            </div>
          )}

          <div className='p-12px flex flex-col gap-6px'>
            <input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder={isZh ? '点击输入或由 AI 生成标题...' : 'Headline...'}
              className='w-full border-none outline-none bg-transparent text-14px font-700 text-t-primary'
            />
            <textarea
              rows={4}
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              placeholder={isZh ? '正文与 CTA 钩子（生成后可直接在此编辑）...' : 'Body copy & CTA...'}
              className='w-full resize-none border-none outline-none bg-transparent text-12px leading-relaxed text-t-secondary'
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
