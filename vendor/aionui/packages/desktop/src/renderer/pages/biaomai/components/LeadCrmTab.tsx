/**
 * @license
 * Copyright 2026 BiaoMai Lingshu Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button, Empty, Space, Tag } from '@arco-design/web-react';
import { IconDownload, IconRefresh } from '@arco-design/web-react/icon';
import { ALL_PLATFORMS, type LeadStage, type LocalLead, type LocalPost } from '../types';

interface LeadCrmTabProps {
  isZh: boolean;
  leads: LocalLead[];
  posts: LocalPost[];
  stageLabel: Record<LeadStage, string>;
  onExportCsv: () => void;
  onAdvanceLead: (id: string) => void;
  onSyncPostClicks: (post: LocalPost) => void;
  onRespinPost: (promptText: string, platformId: string) => void;
}

export const LeadCrmTab: React.FC<LeadCrmTabProps> = ({
  isZh,
  leads,
  posts,
  stageLabel,
  onExportCsv,
  onAdvanceLead,
  onSyncPostClicks,
  onRespinPost,
}) => (
  <div className='flex flex-col gap-18px'>
    <div className='grid grid-cols-2 md:grid-cols-4 gap-12px'>
      {[
        { label: isZh ? '本地线索总数' : 'Total Leads', value: leads.length },
        { label: isZh ? 'S/A 高意向' : 'S/A High Intent', value: leads.filter((l) => l.tier === 'S' || l.tier === 'A').length },
        { label: isZh ? '商机跟进中' : 'Opportunities', value: leads.filter((l) => l.stage === 'opportunity').length },
        { label: isZh ? '已成交转化' : 'Won Deals', value: leads.filter((l) => l.stage === 'won').length },
      ].map((kpi) => (
        <div key={kpi.label} className='p-16px rd-12px bg-1 border border-solid border-[var(--color-border-2)] shadow-[0_1px_2px_rgba(15,23,42,0.04)]'>
          <div className='text-12px text-t-secondary'>{kpi.label}</div>
          <div className='text-24px font-700 text-t-primary mt-4px'>{kpi.value}</div>
        </div>
      ))}
    </div>

    <div className='p-20px rd-14px bg-1 border border-solid border-[var(--color-border-2)] shadow-[0_1px_3px_rgba(15,23,42,0.05)] flex flex-col gap-12px'>
      <div className='flex justify-between items-center flex-wrap gap-8px'>
        <div className='text-15px font-600 text-t-primary'>{isZh ? '线索推进漏斗' : 'Lead Pipeline'}</div>
        <Button type='outline' icon={<IconDownload />} onClick={onExportCsv} disabled={leads.length === 0}>
          {isZh ? '导出 CSV 线索表' : 'Export CSV'}
        </Button>
      </div>

      {leads.length === 0 ? (
        <Empty description={isZh ? '暂无线索，请在「03 社媒雷达」或「04 企业寻客」一键入库' : 'No leads yet'} />
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
                <Button size='small' type='outline' onClick={() => onAdvanceLead(lead.id)}>
                  {isZh ? '推进下一阶段' : 'Advance'}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>

    <div className='p-20px rd-14px bg-1 border border-solid border-[var(--color-border-2)] shadow-[0_1px_3px_rgba(15,23,42,0.05)] flex flex-col gap-12px'>
      <div>
        <div className='text-15px font-600 text-t-primary'>{isZh ? '渠道与内容 ROI 归因复盘' : 'Channel & Content ROI Attribution'}</div>
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
              <div key={post.id} className='p-12px rd-10px bg-2 border border-solid border-[var(--color-border-2)] flex items-center justify-between gap-12px flex-wrap'>
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
                  <Button size='mini' type='outline' icon={<IconRefresh />} onClick={() => onSyncPostClicks(post)}>
                    {isZh ? '同步点击' : 'Sync Clicks'}
                  </Button>
                  <Button
                    size='mini'
                    type='primary'
                    style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
                    onClick={() => onRespinPost(`${post.title}\n${post.body}`, post.platformId)}
                  >
                    {isZh ? '按此爆款裂变' : 'Re-spin Post'}
                  </Button>
                </Space>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);
