/**
 * @license
 * Copyright 2026 BiaoMai Lingshu Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button, Empty, Input, Select, Space, Tag } from '@arco-design/web-react';
import { IconDesktop, IconSearch, IconThunderbolt } from '@arco-design/web-react/icon';
import { ALL_PLATFORMS, type AnalyzedComment, type LocalAccount } from '../types';

const { TextArea } = Input;

interface IntentRadarTabProps {
  isZh: boolean;
  accounts: LocalAccount[];
  selectedPartition: string;
  setSelectedPartition: (v: string) => void;
  radarPlatform: string;
  setRadarPlatform: (v: string) => void;
  rawCommentInput: string;
  setRawCommentInput: (v: string) => void;
  analyzedList: AnalyzedComment[];
  extractingFormula: boolean;
  scoringWithLlm: boolean;
  extractedFormula: { title: string; url: string; excerpt: string } | null;
  onOpenInAiBrowser: (platformId: string) => void;
  onExtractLiveComments: () => void;
  onExtractCompetitorFormula: () => void;
  onSendToCreate: (promptText: string, platformId?: string) => void;
  onAnalyzePasted: () => void;
  onLoadSampleComments: () => void;
  onEnrichWithLlm: () => void;
  onPrefillReply: (replyText: string) => void;
  onAddToCrm: (item: AnalyzedComment) => void;
}

export const IntentRadarTab: React.FC<IntentRadarTabProps> = ({
  isZh,
  accounts,
  selectedPartition,
  setSelectedPartition,
  radarPlatform,
  setRadarPlatform,
  rawCommentInput,
  setRawCommentInput,
  analyzedList,
  extractingFormula,
  scoringWithLlm,
  extractedFormula,
  onOpenInAiBrowser,
  onExtractLiveComments,
  onExtractCompetitorFormula,
  onSendToCreate,
  onAnalyzePasted,
  onLoadSampleComments,
  onEnrichWithLlm,
  onPrefillReply,
  onAddToCrm,
}) => {
  const accountOptions = [
    ...ALL_PLATFORMS.slice(0, 6).map((p) => ({
      label: `${isZh ? p.nameZh : p.nameEn} (${isZh ? '默认隔离区' : 'Default'})`,
      value: `persist:bm-acc-${p.id}-default`,
    })),
    ...accounts.map((a) => ({ label: `${a.label} (${a.platformId})`, value: a.partition })),
  ];

  return (
    <div className='flex flex-col gap-16px'>
      {/* Top Action Card: 1-Click Open Built-in AI Browser + Live Extract */}
      <div className='p-20px rd-14px bg-1 border border-solid border-[var(--color-border-2)] flex flex-col gap-14px'>
        <div className='flex items-center justify-between flex-wrap gap-10px'>
          <div>
            <div className='text-15px font-700 text-t-primary'>
              {isZh ? '社媒意向雷达 · 评论区高意向捕获' : 'Social Intent Radar'}
            </div>
            <div className='text-12px text-t-secondary mt-2px'>
              {isZh
                ? '第一步：点击「去 AI 浏览器逛帖子」并抓评论；第二步：大模型精排与定制回复；第三步：一键入库 CRM'
                : 'Step 1: Open AI Browser & extract comments → Step 2: LLM score & draft reply → Step 3: Save to CRM'}
            </div>
          </div>
          <Tag color='green'>{isZh ? '强制 PII 隐私脱敏 · 停在发送前人工确认' : 'PII Sanitizer · Human-in-the-Loop'}</Tag>
        </div>

        <div className='flex items-center gap-8px flex-wrap'>
          <Select value={radarPlatform} onChange={setRadarPlatform} style={{ width: 150 }}>
            {ALL_PLATFORMS.map((p) => (
              <Select.Option key={p.id} value={p.id}>{isZh ? p.nameZh : p.nameEn}</Select.Option>
            ))}
          </Select>
          <Button type='primary' icon={<IconDesktop />} onClick={() => onOpenInAiBrowser(radarPlatform)}>
            {isZh ? '1. 去 AI 浏览器逛帖子并抓评论' : '1. Open in AI Browser'}
          </Button>
          <Select
            value={selectedPartition || `persist:bm-acc-${radarPlatform}-default`}
            onChange={setSelectedPartition}
            style={{ width: 205 }}
            options={accountOptions}
          />
          <Button type='secondary' icon={<IconSearch />} onClick={onExtractLiveComments}>
            {isZh ? '读取独立窗口评论' : 'Extract Window Comments'}
          </Button>
          <Button type='secondary' loading={extractingFormula} onClick={onExtractCompetitorFormula}>
            {isZh ? '提取竞品爆款结构' : 'Extract Formula'}
          </Button>
        </div>

        {extractedFormula && (
          <div className='p-12px rd-10px bg-2 border border-solid border-[var(--color-border-2)] flex items-center justify-between gap-12px flex-wrap'>
            <div className='min-w-0 flex-1'>
              <div className='text-13px font-600 text-t-primary truncate'>{extractedFormula.title}</div>
              <div className='text-12px text-t-secondary line-clamp-2 mt-2px'>{extractedFormula.excerpt}</div>
            </div>
            <Button
              size='small'
              type='primary'
              onClick={() =>
                onSendToCreate(
                  `${isZh ? '参考以下竞品爆款结构进行合规原创改写' : 'Rewrite based on competitor formula'}：\n标题：${extractedFormula.title}\n结构要点：${extractedFormula.excerpt}`,
                  radarPlatform
                )
              }
            >
              {isZh ? '送入 01 创作工坊改写' : 'Rewrite in Create Studio'}
            </Button>
          </div>
        )}

        <div className='h-1px bg-[var(--color-border-2)]' />

        <div className='flex items-center justify-between flex-wrap gap-8px'>
          <span className='text-12px font-600 text-t-secondary'>
            {isZh ? '离线粘贴评论区文本（每行一条，自动脱敏并评分）' : 'Or paste comments offline (one per line)'}
          </span>
          <Space size='mini' wrap>
            <Button size='small' type='secondary' icon={<IconThunderbolt />} onClick={onLoadSampleComments}>
              {isZh ? '一键填入示例评论测试' : 'Load Sample Comments'}
            </Button>
            <Button size='small' type='secondary' onClick={onAnalyzePasted}>
              {isZh ? '分析下方评论' : 'Analyze Pasted'}
            </Button>
            {analyzedList.length > 0 && (
              <Button size='small' type='primary' loading={scoringWithLlm} onClick={onEnrichWithLlm}>
                {isZh ? '大模型语义精排与定制回复' : 'LLM Semantic Scoring'}
              </Button>
            )}
          </Space>
        </div>

        <TextArea
          rows={3}
          value={rawCommentInput}
          onChange={setRawCommentInput}
          placeholder={isZh ? '在此粘贴真实评论区文本（每行一条），或点上方「一键填入示例评论测试」立即体验全流程...' : 'Paste comments here...'}
        />
      </div>

      {analyzedList.length === 0 ? (
        <Empty description={isZh ? '点击上方「去 AI 浏览器逛帖子并抓评论」或「一键填入示例评论测试」开始捕获高意向客户' : 'Open AI Browser or load sample comments to start'} />
      ) : (
        <div className='flex flex-col gap-10px'>
          {analyzedList.map((item) => (
            <div key={item.id} className='p-16px rd-12px bg-1 border border-solid border-[var(--color-border-2)] flex flex-col gap-10px'>
              <div className='flex items-center justify-between gap-12px flex-wrap'>
                <Space wrap>
                  {item.author && <span className='text-13px font-700 text-t-primary'>{item.author}</span>}
                  <Tag color={item.tier === 'S' ? 'red' : item.tier === 'A' ? 'orange' : 'gray'}>
                    {item.tier}-Tier · {item.score}
                  </Tag>
                  {item.redacted > 0 && (
                    <Tag color='green'>{isZh ? `已脱敏 ${item.redacted} 处隐私` : `Redacted ${item.redacted} PII`}</Tag>
                  )}
                </Space>
                <Space size='mini'>
                  {item.draftReply && (
                    <Button size='small' type='secondary' onClick={() => onPrefillReply(item.draftReply)}>
                      {isZh ? '回填至回复框' : 'Prefill Reply'}
                    </Button>
                  )}
                  <Button size='small' type='primary' onClick={() => onAddToCrm(item)}>
                    {isZh ? '+ 加入线索 CRM' : '+ Add to CRM'}
                  </Button>
                </Space>
              </div>
              <div className='text-14px font-500 text-t-primary'>{item.text}</div>
              {item.draftReply && (
                <div className='p-10px rd-8px bg-2 text-12px text-t-secondary border border-solid border-[var(--color-border-2)]'>
                  {isZh ? 'AI 高转化回复草稿：' : 'AI Reply Draft: '}{item.draftReply}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
