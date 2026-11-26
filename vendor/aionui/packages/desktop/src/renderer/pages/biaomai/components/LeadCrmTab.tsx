/**
 * @license
 * Copyright 2026 BiaoMai Lingshu Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Button, Drawer, Empty, Input, InputNumber, Modal, Select, Space, Tag } from '@arco-design/web-react';
import {
  IconApps,
  IconArrowLeft,
  IconArrowRight,
  IconCheckCircle,
  IconDelete,
  IconDownload,
  IconEdit,
  IconLaunch,
  IconList,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSettings,
  IconUpload,
} from '@arco-design/web-react/icon';
import {
  ALL_PLATFORMS,
  type LeadStage,
  type LocalLead,
  type LocalPost,
  type StudioSettings,
} from '../types';

interface LeadCrmTabProps {
  isZh: boolean;
  leads: LocalLead[];
  posts: LocalPost[];
  stageLabel: Record<LeadStage, string>;
  settings: StudioSettings;
  setSettings: React.Dispatch<React.SetStateAction<StudioSettings>>;
  onExportCsv: () => void;
  onAddLead: (lead: Omit<LocalLead, 'id' | 'createdAt'>) => void;
  onUpdateLead: (id: string, patch: Partial<LocalLead>) => void;
  onDeleteLead: (id: string) => void;
  onSyncExternalCrm: () => Promise<void>;
  onOpenExternalCrm: () => void;
  syncingCrm: boolean;
  onSyncPostClicks: (post: LocalPost) => void;
  onRespinPost: (promptText: string, platformId: string) => void;
}

const STAGES: LeadStage[] = ['new', 'engaged', 'qualified', 'opportunity', 'won'];

const STAGE_COLORS: Record<LeadStage, string> = {
  new: '#64748B',
  engaged: '#2563EB',
  qualified: '#7C3AED',
  opportunity: '#D97706',
  won: '#059669',
};

const TIER_COLORS: Record<LocalLead['tier'], string> = {
  S: 'red',
  A: 'orange',
  B: 'arcoblue',
  C: 'gray',
};

export const LeadCrmTab: React.FC<LeadCrmTabProps> = ({
  isZh,
  leads,
  posts,
  stageLabel,
  settings,
  setSettings,
  onExportCsv,
  onAddLead,
  onUpdateLead,
  onDeleteLead,
  onSyncExternalCrm,
  onOpenExternalCrm,
  syncingCrm,
  onSyncPostClicks,
  onRespinPost,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'roi'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | LocalLead['tier']>('all');
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [crmModalOpen, setCrmModalOpen] = useState(false);

  const [draftLead, setDraftLead] = useState<Omit<LocalLead, 'id' | 'createdAt'>>({
    platformId: 'global-b2b',
    nickname: '',
    company: '',
    email: '',
    phone: '',
    notes: '',
    sanitizedComment: '',
    tier: 'A',
    score: 80,
    stage: 'new',
    dealValue: 0,
  });

  const filteredLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return leads.filter((lead) => {
      if (tierFilter !== 'all' && lead.tier !== tierFilter) return false;
      if (!q) return true;
      return (
        lead.nickname.toLowerCase().includes(q) ||
        (lead.company || '').toLowerCase().includes(q) ||
        (lead.email || '').toLowerCase().includes(q) ||
        lead.sanitizedComment.toLowerCase().includes(q) ||
        lead.platformId.toLowerCase().includes(q)
      );
    });
  }, [leads, searchQuery, tierFilter]);

  const activeLead = useMemo(
    () => leads.find((l) => l.id === editingLeadId) || null,
    [leads, editingLeadId]
  );

  const totalPipelineValue = useMemo(
    () => leads.reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0),
    [leads]
  );

  const crmProvider = settings.crmProvider || 'twenty';
  const crmConfigured = Boolean(settings.crmBaseUrl?.trim());
  const providerLabel =
    crmProvider === 'twenty'
      ? 'Twenty CRM (twentyhq/twenty)'
      : crmProvider === 'atomic'
        ? 'Atomic CRM (marmelab/atomic-crm)'
        : isZh
          ? '自定义 REST Webhook'
          : 'Custom REST Webhook';

  const moveStage = (lead: LocalLead, delta: -1 | 1) => {
    const idx = STAGES.indexOf(lead.stage);
    const nextIdx = Math.max(0, Math.min(STAGES.length - 1, idx + delta));
    if (nextIdx !== idx) {
      onUpdateLead(lead.id, { stage: STAGES[nextIdx] });
    }
  };

  return (
    <div className='flex flex-col gap-16px'>
      {/* KPI Overview */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-12px'>
        {[
          { label: isZh ? '线索总池' : 'Total Leads', value: String(leads.length) },
          {
            label: isZh ? 'S / A 高意向' : 'S/A High Intent',
            value: String(leads.filter((l) => l.tier === 'S' || l.tier === 'A').length),
          },
          {
            label: isZh ? '管道预估金额' : 'Pipeline Value',
            value: `¥${totalPipelineValue.toLocaleString()}`,
          },
          {
            label: isZh ? '已成交转化' : 'Won Deals',
            value: String(leads.filter((l) => l.stage === 'won').length),
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className='p-16px rd-12px bg-1 border border-solid border-[var(--color-border-2)] shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
          >
            <div className='text-12px font-500 text-t-secondary'>{kpi.label}</div>
            <div className='text-22px font-700 text-t-primary mt-4px'>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Open-Source CRM Connector Bar */}
      <div className='p-16px rd-14px bg-1 border border-solid border-[var(--color-border-2)] shadow-[0_1px_3px_rgba(15,23,42,0.05)] flex items-center justify-between flex-wrap gap-12px'>
        <div className='flex flex-col gap-3px'>
          <div className='flex items-center gap-8px flex-wrap'>
            <span className='text-14px font-700 text-t-primary'>
              {isZh ? '开源 CRM 双向连接器' : 'Open-Source CRM Connector'}
            </span>
            <Tag size='small' color={crmConfigured ? 'green' : 'arcoblue'}>
              {providerLabel}
            </Tag>
            {crmConfigured ? (
              <Tag size='small' color='green' icon={<IconCheckCircle />}>
                {settings.crmBaseUrl}
              </Tag>
            ) : (
              <Tag size='small' color='orange'>
                {isZh ? '未连接实例（当前使用本地 CRM）' : 'Not Connected (Local Mode)'}
              </Tag>
            )}
          </div>
          <div className='text-12px text-t-secondary'>
            {isZh
              ? '支持接入 GitHub 热门开源 Twenty CRM (REST/GraphQL) 或 Atomic CRM (MIT)，一键推送线索并同步商机管道'
              : 'Connect self-hosted Twenty CRM or Atomic CRM (MIT) via REST API to sync leads and deals'}
          </div>
        </div>
        <Space wrap>
          <Button size='small' type='outline' icon={<IconSettings />} onClick={() => setCrmModalOpen(true)}>
            {isZh ? '配置开源 CRM' : 'Configure CRM'}
          </Button>
          {crmConfigured && (
            <Button size='small' type='outline' icon={<IconLaunch />} onClick={onOpenExternalCrm}>
              {isZh ? '打开 CRM 面板' : 'Open CRM'}
            </Button>
          )}
          <Button
            size='small'
            type='primary'
            icon={<IconUpload />}
            loading={syncingCrm}
            disabled={leads.length === 0}
            onClick={() => void onSyncExternalCrm()}
            style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
          >
            {isZh ? `推送至 ${crmProvider === 'twenty' ? 'Twenty' : crmProvider === 'atomic' ? 'Atomic' : 'Webhook'}` : 'Sync to CRM'}
          </Button>
        </Space>
      </div>

      {/* Pipeline Toolbar */}
      <div className='p-20px rd-14px bg-1 border border-solid border-[var(--color-border-2)] shadow-[0_1px_3px_rgba(15,23,42,0.05)] flex flex-col gap-16px'>
        <div className='flex items-center justify-between flex-wrap gap-12px'>
          <div className='inline-flex p-3px rd-10px bg-2 border border-solid border-[var(--color-border-2)] gap-4px'>
            <Button
              size='small'
              type={viewMode === 'kanban' ? 'primary' : 'text'}
              icon={<IconApps />}
              onClick={() => setViewMode('kanban')}
              style={viewMode === 'kanban' ? { background: '#0F172A', borderColor: '#0F172A', borderRadius: 8 } : { borderRadius: 8 }}
            >
              {isZh ? '看板管道' : 'Kanban'}
            </Button>
            <Button
              size='small'
              type={viewMode === 'table' ? 'primary' : 'text'}
              icon={<IconList />}
              onClick={() => setViewMode('table')}
              style={viewMode === 'table' ? { background: '#0F172A', borderColor: '#0F172A', borderRadius: 8 } : { borderRadius: 8 }}
            >
              {isZh ? '数据列表' : 'Table'}
            </Button>
            <Button
              size='small'
              type={viewMode === 'roi' ? 'primary' : 'text'}
              icon={<IconRefresh />}
              onClick={() => setViewMode('roi')}
              style={viewMode === 'roi' ? { background: '#0F172A', borderColor: '#0F172A', borderRadius: 8 } : { borderRadius: 8 }}
            >
              {isZh ? 'ROI 归因' : 'ROI'}
            </Button>
          </div>

          <Space wrap>
            <Input
              allowClear
              prefix={<IconSearch />}
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={isZh ? '搜索客户/公司/邮箱...' : 'Search name, company, email...'}
              style={{ width: 210 }}
            />
            <Select
              value={tierFilter}
              onChange={(v) => setTierFilter(v as 'all' | LocalLead['tier'])}
              style={{ width: 110 }}
              options={[
                { label: isZh ? '全部分级' : 'All Tiers', value: 'all' },
                { label: 'S-Tier', value: 'S' },
                { label: 'A-Tier', value: 'A' },
                { label: 'B-Tier', value: 'B' },
                { label: 'C-Tier', value: 'C' },
              ]}
            />
            <Button
              type='primary'
              icon={<IconPlus />}
              onClick={() => setCreateOpen(true)}
              style={{ background: '#0F172A', borderColor: '#0F172A' }}
            >
              {isZh ? '新建线索' : 'New Lead'}
            </Button>
            <Button type='outline' icon={<IconDownload />} onClick={onExportCsv} disabled={leads.length === 0}>
              {isZh ? '导出 CSV' : 'Export CSV'}
            </Button>
          </Space>
        </div>

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <div className='grid grid-cols-1 md:grid-cols-5 gap-12px overflow-x-auto'>
            {STAGES.map((stage) => {
              const items = filteredLeads.filter((l) => l.stage === stage);
              const stageSum = items.reduce((s, l) => s + (Number(l.dealValue) || 0), 0);
              return (
                <div
                  key={stage}
                  className='p-12px rd-12px bg-2 border border-solid border-[var(--color-border-2)] flex flex-col gap-10px min-h-240px'
                >
                  <div className='flex items-center justify-between gap-6px pb-6px border-b border-solid border-[var(--color-border-2)]'>
                    <div className='flex items-center gap-6px'>
                      <span
                        className='w-8px h-8px rd-full inline-block'
                        style={{ background: STAGE_COLORS[stage] }}
                      />
                      <span className='text-13px font-700 text-t-primary'>{stageLabel[stage]}</span>
                    </div>
                    <Tag size='small'>{items.length}</Tag>
                  </div>
                  {stageSum > 0 && (
                    <div className='text-11px font-600 text-t-secondary'>¥{stageSum.toLocaleString()}</div>
                  )}
                  {items.length === 0 ? (
                    <div className='text-12px text-t-secondary opacity-70 py-18px text-center'>
                      {isZh ? '暂无线索' : 'Empty'}
                    </div>
                  ) : (
                    <div className='flex flex-col gap-8px'>
                      {items.map((lead) => (
                        <div
                          key={lead.id}
                          className='p-12px rd-10px bg-1 border border-solid border-[var(--color-border-2)] shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex flex-col gap-6px cursor-pointer hover:border-[rgb(var(--primary-5))]'
                          onClick={() => setEditingLeadId(lead.id)}
                        >
                          <div className='flex items-center justify-between gap-4px'>
                            <span className='text-13px font-700 text-t-primary truncate'>{lead.nickname}</span>
                            <Tag size='small' color={TIER_COLORS[lead.tier]}>
                              {lead.tier}
                            </Tag>
                          </div>
                          {(lead.company || lead.email) && (
                            <div className='text-11px text-t-secondary truncate'>
                              {[lead.company, lead.email].filter(Boolean).join(' · ')}
                            </div>
                          )}
                          <div className='text-12px text-t-secondary line-clamp-2'>{lead.sanitizedComment}</div>
                          <div className='flex items-center justify-between pt-4px mt-2px border-t border-solid border-[var(--color-border-2)]'>
                            <span className='text-11px font-600 text-t-primary'>
                              {lead.dealValue > 0 ? `¥${lead.dealValue.toLocaleString()}` : lead.platformId}
                            </span>
                            <Space size='mini' onClick={(e) => e.stopPropagation()}>
                              <Button
                                size='mini'
                                type='text'
                                icon={<IconArrowLeft />}
                                disabled={stage === 'new'}
                                onClick={() => moveStage(lead, -1)}
                              />
                              <Button
                                size='mini'
                                type='text'
                                icon={<IconArrowRight />}
                                disabled={stage === 'won'}
                                onClick={() => moveStage(lead, 1)}
                              />
                            </Space>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          filteredLeads.length === 0 ? (
            <Empty description={isZh ? '暂无线索，点击「新建线索」或从「03 社媒雷达 / 04 企业寻客」一键入库' : 'No leads yet'} />
          ) : (
            <div className='flex flex-col gap-8px'>
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className='p-14px rd-12px bg-2 border border-solid border-[var(--color-border-2)] flex items-center justify-between gap-12px flex-wrap'
                >
                  <div className='flex flex-col gap-4px min-w-0 flex-1'>
                    <Space wrap>
                      <span className='text-14px font-700 text-t-primary'>{lead.nickname}</span>
                      {lead.company && <Tag size='small'>{lead.company}</Tag>}
                      <Tag size='small' color='arcoblue'>{lead.platformId}</Tag>
                      <Tag size='small' color={TIER_COLORS[lead.tier]}>{lead.tier}-Tier</Tag>
                      <Tag size='small' color={lead.stage === 'won' ? 'green' : 'purple'}>{stageLabel[lead.stage]}</Tag>
                      {lead.dealValue > 0 && <Tag size='small' color='gold'>¥{lead.dealValue.toLocaleString()}</Tag>}
                    </Space>
                    <div className='text-12px text-t-secondary truncate'>
                      {[lead.email, lead.phone, lead.sanitizedComment].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <Space>
                    <Button size='small' type='outline' icon={<IconEdit />} onClick={() => setEditingLeadId(lead.id)}>
                      {isZh ? '详情' : 'Edit'}
                    </Button>
                    {lead.stage !== 'won' && (
                      <Button size='small' type='primary' onClick={() => moveStage(lead, 1)}>
                        {isZh ? '推进阶段' : 'Advance'}
                      </Button>
                    )}
                  </Space>
                </div>
              ))}
            </div>
          )
        )}

        {/* ROI Attribution View */}
        {viewMode === 'roi' && (
          posts.length === 0 ? (
            <Empty description={isZh ? '暂无内容归因记录，请先在「01 内容创作 / 02 渠道分发」创建并发布内容' : 'No posts to attribute yet'} />
          ) : (
            <div className='flex flex-col gap-8px'>
              {posts.map((post) => {
                const plat = ALL_PLATFORMS.find((p) => p.id === post.platformId);
                const attrLeads = leads.filter((l) => l.platformId === post.platformId).length;
                const clicks = post.clicks ?? 0;
                const cvr = clicks > 0 ? `${Math.round((attrLeads / clicks) * 100)}%` : `${attrLeads} leads`;
                return (
                  <div
                    key={post.id}
                    className='p-12px rd-10px bg-2 border border-solid border-[var(--color-border-2)] flex items-center justify-between gap-12px flex-wrap'
                  >
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
          )
        )}
      </div>

      {/* Lead Detail Drawer */}
      <Drawer
        width={420}
        title={isZh ? '线索详情与跟进记录' : 'Lead Details & Follow-up'}
        visible={Boolean(activeLead)}
        onCancel={() => setEditingLeadId(null)}
        footer={
          activeLead ? (
            <div className='flex justify-between w-full'>
              <Button
                status='danger'
                type='outline'
                icon={<IconDelete />}
                onClick={() => {
                  onDeleteLead(activeLead.id);
                  setEditingLeadId(null);
                }}
              >
                {isZh ? '删除线索' : 'Delete'}
              </Button>
              <Button type='primary' onClick={() => setEditingLeadId(null)}>
                {isZh ? '完成' : 'Done'}
              </Button>
            </div>
          ) : null
        }
      >
        {activeLead && (
          <div className='flex flex-col gap-12px'>
            <div>
              <div className='text-12px font-600 text-t-secondary mb-4px'>{isZh ? '联系人 / 客户名称' : 'Contact Name'}</div>
              <Input value={activeLead.nickname} onChange={(v) => onUpdateLead(activeLead.id, { nickname: v })} />
            </div>
            <div>
              <div className='text-12px font-600 text-t-secondary mb-4px'>{isZh ? '所属公司' : 'Company'}</div>
              <Input value={activeLead.company || ''} onChange={(v) => onUpdateLead(activeLead.id, { company: v })} />
            </div>
            <div className='grid grid-cols-2 gap-10px'>
              <div>
                <div className='text-12px font-600 text-t-secondary mb-4px'>{isZh ? '邮箱' : 'Email'}</div>
                <Input value={activeLead.email || ''} onChange={(v) => onUpdateLead(activeLead.id, { email: v })} />
              </div>
              <div>
                <div className='text-12px font-600 text-t-secondary mb-4px'>{isZh ? '电话 / 微信' : 'Phone'}</div>
                <Input value={activeLead.phone || ''} onChange={(v) => onUpdateLead(activeLead.id, { phone: v })} />
              </div>
            </div>
            <div className='grid grid-cols-3 gap-10px'>
              <div>
                <div className='text-12px font-600 text-t-secondary mb-4px'>{isZh ? '意向分级' : 'Tier'}</div>
                <Select
                  value={activeLead.tier}
                  onChange={(v) => onUpdateLead(activeLead.id, { tier: v as LocalLead['tier'] })}
                  options={['S', 'A', 'B', 'C'].map((t) => ({ label: `${t}-Tier`, value: t }))}
                />
              </div>
              <div>
                <div className='text-12px font-600 text-t-secondary mb-4px'>{isZh ? '当前阶段' : 'Stage'}</div>
                <Select
                  value={activeLead.stage}
                  onChange={(v) => onUpdateLead(activeLead.id, { stage: v as LeadStage })}
                  options={STAGES.map((s) => ({ label: stageLabel[s], value: s }))}
                />
              </div>
              <div>
                <div className='text-12px font-600 text-t-secondary mb-4px'>{isZh ? '预估金额 (¥)' : 'Deal Value'}</div>
                <InputNumber
                  min={0}
                  value={activeLead.dealValue}
                  onChange={(v) => onUpdateLead(activeLead.id, { dealValue: Number(v) || 0 })}
                />
              </div>
            </div>
            <div>
              <div className='text-12px font-600 text-t-secondary mb-4px'>{isZh ? '询盘原话 / 线索摘要' : 'Inquiry Summary'}</div>
              <Input.TextArea
                autoSize={{ minRows: 2, maxRows: 4 }}
                value={activeLead.sanitizedComment}
                onChange={(v) => onUpdateLead(activeLead.id, { sanitizedComment: v })}
              />
            </div>
            <div>
              <div className='text-12px font-600 text-t-secondary mb-4px'>{isZh ? '跟进备注' : 'Follow-up Notes'}</div>
              <Input.TextArea
                autoSize={{ minRows: 3, maxRows: 6 }}
                value={activeLead.notes || ''}
                onChange={(v) => onUpdateLead(activeLead.id, { notes: v })}
                placeholder={isZh ? '记录电话沟通结果、报价进度、下次跟进时间...' : 'Add call notes, quote status, next follow-up...'}
              />
            </div>
          </div>
        )}
      </Drawer>

      {/* Create Lead Modal */}
      <Modal
        title={isZh ? '新建 CRM 线索' : 'New CRM Lead'}
        visible={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => {
          if (!draftLead.nickname.trim()) return;
          onAddLead(draftLead);
          setDraftLead({
            platformId: 'global-b2b',
            nickname: '',
            company: '',
            email: '',
            phone: '',
            notes: '',
            sanitizedComment: '',
            tier: 'A',
            score: 80,
            stage: 'new',
            dealValue: 0,
          });
          setCreateOpen(false);
        }}
      >
        <div className='flex flex-col gap-12px'>
          <Input
            placeholder={isZh ? '客户姓名 / 昵称 *' : 'Contact name *'}
            value={draftLead.nickname}
            onChange={(v) => setDraftLead((p) => ({ ...p, nickname: v }))}
          />
          <Input
            placeholder={isZh ? '公司名称' : 'Company name'}
            value={draftLead.company}
            onChange={(v) => setDraftLead((p) => ({ ...p, company: v }))}
          />
          <div className='grid grid-cols-2 gap-10px'>
            <Input
              placeholder={isZh ? '邮箱' : 'Email'}
              value={draftLead.email}
              onChange={(v) => setDraftLead((p) => ({ ...p, email: v }))}
            />
            <Input
              placeholder={isZh ? '电话 / 微信' : 'Phone'}
              value={draftLead.phone}
              onChange={(v) => setDraftLead((p) => ({ ...p, phone: v }))}
            />
          </div>
          <div className='grid grid-cols-3 gap-10px'>
            <Select
              value={draftLead.tier}
              onChange={(v) => setDraftLead((p) => ({ ...p, tier: v as LocalLead['tier'] }))}
              options={['S', 'A', 'B', 'C'].map((t) => ({ label: `${t}-Tier`, value: t }))}
            />
            <Select
              value={draftLead.stage}
              onChange={(v) => setDraftLead((p) => ({ ...p, stage: v as LeadStage }))}
              options={STAGES.map((s) => ({ label: stageLabel[s], value: s }))}
            />
            <InputNumber
              min={0}
              placeholder={isZh ? '预估金额' : 'Deal value'}
              value={draftLead.dealValue}
              onChange={(v) => setDraftLead((p) => ({ ...p, dealValue: Number(v) || 0 }))}
            />
          </div>
          <Input.TextArea
            autoSize={{ minRows: 2, maxRows: 4 }}
            placeholder={isZh ? '需求描述 / 备注' : 'Inquiry summary / notes'}
            value={draftLead.sanitizedComment}
            onChange={(v) => setDraftLead((p) => ({ ...p, sanitizedComment: v }))}
          />
        </div>
      </Modal>

      {/* Open-Source CRM Config Modal */}
      <Modal
        title={isZh ? '接入开源 CRM（Twenty / Atomic CRM）' : 'Connect Open-Source CRM'}
        visible={crmModalOpen}
        onCancel={() => setCrmModalOpen(false)}
        onOk={() => setCrmModalOpen(false)}
      >
        <div className='flex flex-col gap-12px'>
          <div>
            <div className='text-12px font-600 text-t-secondary mb-4px'>{isZh ? '选择开源 CRM 类型' : 'CRM Provider'}</div>
            <Select
              value={crmProvider}
              onChange={(v) => setSettings((p) => ({ ...p, crmProvider: v as 'twenty' | 'atomic' | 'webhook' }))}
              options={[
                { label: 'Twenty CRM (twentyhq/twenty · REST /rest/people)', value: 'twenty' },
                { label: 'Atomic CRM (marmelab/atomic-crm · MIT · Supabase REST)', value: 'atomic' },
                { label: isZh ? '通用 REST Webhook（飞书多维表格 / EspoCRM / 自建）' : 'Generic REST Webhook', value: 'webhook' },
              ]}
            />
          </div>
          <div>
            <div className='text-12px font-600 text-t-secondary mb-4px'>{isZh ? 'CRM 服务地址 (Base URL)' : 'CRM Base URL'}</div>
            <Input
              value={settings.crmBaseUrl || ''}
              onChange={(v) => setSettings((p) => ({ ...p, crmBaseUrl: v }))}
              placeholder={crmProvider === 'twenty' ? 'http://localhost:3000' : 'https://your-crm-host.com'}
            />
          </div>
          <div>
            <div className='text-12px font-600 text-t-secondary mb-4px'>API Key / Bearer Token</div>
            <Input.Password
              value={settings.crmApiKey || ''}
              onChange={(v) => setSettings((p) => ({ ...p, crmApiKey: v }))}
              placeholder='Bearer token from Twenty Settings -> Developers -> API Keys'
            />
          </div>
          <div className='p-10px rd-8px bg-2 text-12px text-t-secondary'>
            {isZh
              ? '本地一键部署 Twenty CRM：git clone https://github.com/twentyhq/twenty && cd twenty && docker compose up -d'
              : 'Self-host Twenty CRM: git clone https://github.com/twentyhq/twenty && cd twenty && docker compose up -d'}
          </div>
        </div>
      </Modal>
    </div>
  );
};
