/**
 * @license
 * Copyright 2026 BiaoMai Lingshu Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button, Empty, Input, Select, Space, Tag } from '@arco-design/web-react';
import { IconSearch } from '@arco-design/web-react/icon';
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
  onExtractLiveComments: () => void;
  onExtractCompetitorFormula: () => void;
  onSendToCreate: (promptText: string, platformId?: string) => void;
  onAnalyzePasted: () => void;
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
  onExtractLiveComments,
  onExtractCompetitorFormula,
  onSendToCreate,
  onAnalyzePasted,
  onEnrichWithLlm,
  onPrefillReply,
  onAddToCrm,
}) => (
  <div className='flex flex-col gap-18px'>
    <div className='p-20px rd-14px bg-1 border border-solid border-[var(--color-border-2)] shadow-[0_1px_3px_rgba(15,23,42,0.05)] flex flex-col gap-12px'>
      <div className='flex items-center justify-between flex-wrap gap-10px'>
        <Space wrap>
          <Select
            value={selectedPartition}
            onChange={setSelectedPartition}
            placeholder={isZh ? '选择隔离浏览器账号' : 'Select isolated browser account'}
            style={{ width: 250 }}
          >
            {accounts.map((a) => (
              <Select.Option key={a.partition} value={a.partition}>{a.label} ({a.platformId})</Select.Option>
            ))}
          </Select>
          <Button type='primary' icon={<IconSearch />} onClick={onExtractLiveComments} style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>
            {isZh ? '读取隔离浏览器当前页评论' : 'Extract Live Browser Comments'}
          </Button>
          <Button type='outline' loading={extractingFormula} onClick={onExtractCompetitorFormula}>
            {isZh ? '提取竞品爆款结构' : 'Extract Competitor Formula'}
          </Button>
        </Space>
        <Tag color='green'>{isZh ? '强制 PII 隐私脱敏 · 停在发送键前人工确认' : 'Mandatory PII Sanitizer · Human-in-the-Loop'}</Tag>
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
            style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
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

      <div className='flex items-center gap-8px flex-wrap'>
        <Select value={radarPlatform} onChange={setRadarPlatform} style={{ width: 160 }}>
          {ALL_PLATFORMS.map((p) => (
            <Select.Option key={p.id} value={p.id}>{isZh ? p.nameZh : p.nameEn}</Select.Option>
          ))}
        </Select>
        <Button type='outline' onClick={onAnalyzePasted}>{isZh ? '分析下方粘贴评论' : 'Analyze Pasted Comments'}</Button>
        {analyzedList.length > 0 && (
          <Button type='outline' loading={scoringWithLlm} onClick={onEnrichWithLlm}>
            {isZh ? '大模型语义精排与定制回复' : 'LLM Semantic Intent Scoring'}
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
          <div key={item.id} className='p-16px rd-12px bg-1 border border-solid border-[var(--color-border-2)] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col gap-10px'>
            <div className='flex items-center justify-between gap-12px flex-wrap'>
              <Space>
                <Tag color={item.tier === 'S' ? 'red' : item.tier === 'A' ? 'orange' : 'gray'}>{item.tier}-Tier · {item.score}</Tag>
                {item.redacted > 0 && <Tag color='green'>{isZh ? `已脱敏 ${item.redacted} 处隐私` : `Redacted ${item.redacted} PII`}</Tag>}
              </Space>
              <Space>
                {item.draftReply && (
                  <Button size='small' type='outline' onClick={() => onPrefillReply(item.draftReply)}>
                    {isZh ? '填入浏览器回复框' : 'Prefill Browser'}
                  </Button>
                )}
                <Button size='small' type='primary' onClick={() => onAddToCrm(item)} style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>
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
