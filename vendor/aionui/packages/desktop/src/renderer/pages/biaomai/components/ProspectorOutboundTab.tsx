/**
 * @license
 * Copyright 2026 BiaoMai Lingshu Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button, Empty, Input, Select, Space, Tag } from '@arco-design/web-react';
import {
  IconCompass,
  IconEmail,
  IconLocation,
  IconPlus,
  IconSearch,
  IconSend,
} from '@arco-design/web-react/icon';
import { type GlobalProspect } from '../types';

const { TextArea } = Input;

interface ProspectorOutboundTabProps {
  isZh: boolean;
  b2bMode: 'global' | 'cn';
  setB2bMode: (v: 'global' | 'cn') => void;
  cnCompanyInput: string;
  setCnCompanyInput: (v: string) => void;
  lookingUpCn: boolean;
  b2bIndustry: string;
  setB2bIndustry: (v: string) => void;
  b2bCountry: string;
  setB2bCountry: (v: string) => void;
  b2bLang: 'en-US' | 'de-DE' | 'es-ES' | 'ja-JP' | 'ar-SA';
  setB2bLang: (v: 'en-US' | 'de-DE' | 'es-ES' | 'ja-JP' | 'ar-SA') => void;
  prospects: GlobalProspect[];
  extractingB2b: boolean;
  enrichingId: string;
  draftingOutreachId: string;
  sendingEmailId: string;
  checkingImap: boolean;
  crawlingMcp: boolean;
  crawlTarget: string;
  setCrawlTarget: (v: string) => void;
  onOpenDirectory: (ch: 'gmaps' | 'linkedin' | 'thomasnet' | 'europages' | 'alibaba' | 'amap' | 'baidu_map') => void;
  onLookupCnCompanies: () => void;
  onExtractProspects: () => void;
  onEnrichProspect: (item: GlobalProspect) => void;
  onGenerateColdEmail: (item: GlobalProspect) => void;
  onSendColdEmail: (item: GlobalProspect) => void;
  onAddProspectToCrm: (item: GlobalProspect) => void;
  onCheckImapReplies: () => void;
  onRunCrawlerMcp: () => void;
  onPrefillSocialDm: (url: string, text: string) => void;
}

export const ProspectorOutboundTab: React.FC<ProspectorOutboundTabProps> = ({
  isZh,
  b2bMode,
  setB2bMode,
  cnCompanyInput,
  setCnCompanyInput,
  lookingUpCn,
  b2bIndustry,
  setB2bIndustry,
  b2bCountry,
  setB2bCountry,
  b2bLang,
  setB2bLang,
  prospects,
  extractingB2b,
  enrichingId,
  draftingOutreachId,
  sendingEmailId,
  checkingImap,
  crawlingMcp,
  crawlTarget,
  setCrawlTarget,
  onOpenDirectory,
  onLookupCnCompanies,
  onExtractProspects,
  onEnrichProspect,
  onGenerateColdEmail,
  onSendColdEmail,
  onAddProspectToCrm,
  onCheckImapReplies,
  onRunCrawlerMcp,
  onPrefillSocialDm,
}) => (
  <div className='flex flex-col gap-20px'>
    <div className='p-24px rd-14px bg-1 border border-solid border-[var(--color-border-2)] shadow-[0_1px_4px_rgba(15,23,42,0.05)] flex flex-col gap-18px'>
      {/* Mode Header */}
      <div className='flex items-center justify-between flex-wrap gap-12px'>
        <div>
          <div className='text-16px font-700 text-t-primary tracking-tight'>
            {isZh ? '全球与国内企业寻客工作台' : 'Global & CN Enterprise Prospector'}
          </div>
          <div className='text-13px text-t-secondary mt-4px'>
            {isZh
              ? '支持国内公司名与高德/百度地图挖掘，以及海外 Google Maps / LinkedIn / 黄页寻客与多语开发信'
              : 'CN company & map lookup, plus global B2B directories, MX verification, and cold email sequences'}
          </div>
        </div>

        <div className='inline-flex p-3px rd-10px bg-2 border border-solid border-[var(--color-border-2)] gap-4px'>
          <button
            type='button'
            onClick={() => setB2bMode('cn')}
            className={`h-30px px-14px rd-7px border-none cursor-pointer text-13px font-600 transition-all ${
              b2bMode === 'cn' ? 'bg-1 text-t-primary shadow-sm' : 'bg-transparent text-t-secondary hover:text-t-primary'
            }`}
          >
            {isZh ? '国内企业与地图' : 'CN Company & Map'}
          </button>
          <button
            type='button'
            onClick={() => setB2bMode('global')}
            className={`h-30px px-14px rd-7px border-none cursor-pointer text-13px font-600 transition-all ${
              b2bMode === 'global' ? 'bg-1 text-t-primary shadow-sm' : 'bg-transparent text-t-secondary hover:text-t-primary'
            }`}
          >
            {isZh ? '海外 B2B 外贸' : 'Global B2B'}
          </button>
        </div>
      </div>

      {/* Mode 1: Domestic CN Company Lookup + Amap/Baidu Map */}
      {b2bMode === 'cn' ? (
        <div className='flex flex-col gap-14px'>
          <div className='flex flex-col gap-6px'>
            <label className='text-13px font-600 text-t-primary'>
              {isZh ? '批量输入国内目标公司名称（每行一家）' : 'Chinese Company Names (One per line)'}
            </label>
            <TextArea
              rows={4}
              value={cnCompanyInput}
              onChange={setCnCompanyInput}
              placeholder={
                isZh
                  ? '例如：\n山东标脉信息技术有限公司\n浪潮集团有限公司\n系统将自动探测企业独立官网、公开手机号、400热线及商务邮箱...'
                  : 'Enter Chinese company names, one per line...'
              }
            />
          </div>

          <div className='flex items-center justify-between flex-wrap gap-10px pt-4px'>
            <Space size='small' wrap>
              <Button type='secondary' icon={<IconLocation />} onClick={() => onOpenDirectory('amap')}>
                {isZh ? '高德地图搜商家' : 'Amap'}
              </Button>
              <Button type='secondary' icon={<IconCompass />} onClick={() => onOpenDirectory('baidu_map')}>
                {isZh ? '百度地图搜商家' : 'Baidu Map'}
              </Button>
              <Button type='secondary' icon={<IconSearch />} loading={extractingB2b} onClick={onExtractProspects}>
                {isZh ? '提取地图/网页商家' : 'Extract from Map'}
              </Button>
            </Space>
            <Button
              type='primary'
              icon={<IconSearch />}
              loading={lookingUpCn}
              onClick={onLookupCnCompanies}
              style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
            >
              {isZh ? '一键挖掘官网 / 电话 / 邮箱' : 'Lookup CN Companies'}
            </Button>
          </div>
        </div>
      ) : (
        /* Mode 2: Global B2B & Foreign-Trade Prospector */
        <div className='flex flex-col gap-16px'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-14px'>
            <div className='flex flex-col gap-6px'>
              <label className='text-13px font-500 text-t-primary'>{isZh ? '目标行业 / 产品关键词' : 'Target Industry'}</label>
              <Input value={b2bIndustry} onChange={setB2bIndustry} placeholder='e.g. CNC Machining, Solar Inverter' />
            </div>
            <div className='flex flex-col gap-6px'>
              <label className='text-13px font-500 text-t-primary'>{isZh ? '目标国家 / 城市' : 'Target Country'}</label>
              <Input value={b2bCountry} onChange={setB2bCountry} placeholder='e.g. Germany, USA, UAE' />
            </div>
            <div className='flex flex-col gap-6px'>
              <label className='text-13px font-500 text-t-primary'>{isZh ? '开发信目标语种' : 'Outreach Language'}</label>
              <Select allowCreate showSearch value={b2bLang} onChange={setB2bLang}>
                <Select.Option value='en-US'>English (Global B2B)</Select.Option>
                <Select.Option value='de-DE'>Deutsch (DACH)</Select.Option>
                <Select.Option value='es-ES'>Español (LATAM / Spain)</Select.Option>
                <Select.Option value='ja-JP'>日本語 (Japan)</Select.Option>
                <Select.Option value='ar-SA'>العربية (Middle East)</Select.Option>
              </Select>
            </div>
          </div>

          <div className='flex items-center justify-between flex-wrap gap-10px'>
            <Space size='small' wrap>
              <Button type='secondary' size='small' onClick={() => onOpenDirectory('gmaps')}>Google Maps</Button>
              <Button type='secondary' size='small' onClick={() => onOpenDirectory('linkedin')}>LinkedIn</Button>
              <Button type='secondary' size='small' onClick={() => onOpenDirectory('thomasnet')}>Thomasnet</Button>
              <Button type='secondary' size='small' onClick={() => onOpenDirectory('europages')}>Europages</Button>
              <Button type='secondary' size='small' onClick={() => onOpenDirectory('alibaba')}>Alibaba</Button>
            </Space>
            <Space size='small' wrap>
              <Button type='outline' icon={<IconEmail />} loading={checkingImap} onClick={onCheckImapReplies}>
                {isZh ? 'IMAP 检测回信' : 'Check IMAP'}
              </Button>
              <Button
                type='primary'
                icon={<IconSearch />}
                loading={extractingB2b}
                onClick={onExtractProspects}
                style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
              >
                {isZh ? '从当前浏览器提取线索' : 'Extract Prospects'}
              </Button>
            </Space>
          </div>

          <div className='flex items-center gap-8px pt-4px border-t border-solid border-[var(--color-border-2)]'>
            <Input
              value={crawlTarget}
              onChange={setCrawlTarget}
              placeholder={isZh ? '可选：输入目标黄页或目录网址调用本地 Crawl4AI 批量抓取...' : 'Optional: Directory URL for local Crawl4AI...'}
            />
            <Button type='outline' loading={crawlingMcp} onClick={onRunCrawlerMcp}>
              Crawl4AI
            </Button>
          </div>
        </div>
      )}
    </div>

    {prospects.length === 0 ? (
      <Empty
        description={
          isZh
            ? b2bMode === 'cn'
              ? '输入国内公司名称点击挖掘，或打开高德/百度地图搜索商家后提取'
              : '选择全球目录打开隔离浏览器搜索，然后点击「从当前浏览器提取线索」'
            : 'Lookup companies or extract from browser'
        }
      />
    ) : (
      <div className='flex flex-col gap-12px'>
        {prospects.map((item) => (
          <div key={item.id} className='p-18px rd-14px bg-1 border border-solid border-[var(--color-border-2)] shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col gap-12px'>
            <div className='flex items-start justify-between gap-12px flex-wrap'>
              <div className='flex flex-col gap-6px min-w-0 flex-1'>
                <div className='flex items-center gap-8px flex-wrap'>
                  <span className='text-15px font-700 text-t-primary'>{item.companyName}</span>
                  <Tag size='small' color='arcoblue'>{item.country}</Tag>
                  {item.mxValid === true && <Tag size='small' color='green'>MX Valid ({item.mxHost})</Tag>}
                  {item.mxValid === false && <Tag size='small' color='orange'>No MX</Tag>}
                  {item.outreachSent && <Tag size='small' color='purple'>{isZh ? '已发送开发信' : 'Sent'}</Tag>}
                  {item.replied && <Tag size='small' color='green'>{isZh ? '已回信 (序列已暂停)' : 'Replied'}</Tag>}
                </div>
                <div className='text-13px text-t-secondary flex items-center gap-14px flex-wrap'>
                  {item.website && <span>{item.website}</span>}
                  {item.email && <span>{item.email}</span>}
                  {item.phone && <span>{item.phone}</span>}
                  {item.whatsappUrl && <Tag size='small' color='green'>WhatsApp Ready</Tag>}
                </div>
                {item.snippet && <div className='text-12px text-t-tertiary'>{item.snippet}</div>}
              </div>
              <Space size='small' wrap>
                <Button size='small' type='secondary' loading={enrichingId === item.id} onClick={() => onEnrichProspect(item)}>
                  {isZh ? '抓邮箱 + MX 验真' : 'Enrich & MX'}
                </Button>
                <Button size='small' type='secondary' loading={draftingOutreachId === item.id} onClick={() => onGenerateColdEmail(item)}>
                  {isZh ? 'AI 写多语开发信' : 'Draft Email'}
                </Button>
                <Button
                  size='small'
                  type='primary'
                  icon={<IconPlus />}
                  onClick={() => onAddProspectToCrm(item)}
                  style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
                >
                  {isZh ? '入库 CRM' : 'Add CRM'}
                </Button>
              </Space>
            </div>

            {item.outreachBody && (
              <div className='p-14px rd-10px bg-2 border border-solid border-[var(--color-border-2)] flex flex-col gap-8px'>
                {item.sequence && item.sequence.length > 1 && (
                  <div className='flex items-center gap-6px flex-wrap'>
                    {item.sequence.map((step, sIdx) => (
                      <Tag key={sIdx} size='small' color={step.channel === 'whatsapp' ? 'green' : 'arcoblue'}>
                        Day {step.dayOffset} · {step.channel.toUpperCase()}
                      </Tag>
                    ))}
                  </div>
                )}
                <div className='text-13px font-600 text-t-primary'>Subject: {item.outreachSubject}</div>
                <div className='text-13px leading-relaxed text-t-secondary whitespace-pre-wrap'>{item.outreachBody}</div>
                <div className='flex justify-end gap-8px flex-wrap'>
                  {(item.whatsappUrl || item.sequence?.some((s) => s.channel === 'whatsapp')) && (
                    <Button
                      size='small'
                      type='secondary'
                      onClick={() =>
                        onPrefillSocialDm(
                          item.whatsappUrl || 'https://web.whatsapp.com/',
                          item.sequence?.find((s) => s.channel === 'whatsapp')?.body || item.outreachBody || ''
                        )
                      }
                    >
                      {isZh ? '填入 WhatsApp 话术' : 'Prefill WhatsApp'}
                    </Button>
                  )}
                  {item.linkedinUrl && (
                    <Button
                      size='small'
                      type='secondary'
                      onClick={() => onPrefillSocialDm(item.linkedinUrl || 'https://www.linkedin.com/', item.outreachBody || '')}
                    >
                      {isZh ? '填入 LinkedIn 备注' : 'Prefill LinkedIn'}
                    </Button>
                  )}
                  <Button
                    size='small'
                    type='primary'
                    icon={<IconSend />}
                    loading={sendingEmailId === item.id}
                    disabled={Boolean(item.replied)}
                    onClick={() => onSendColdEmail(item)}
                    style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
                  >
                    {item.replied
                      ? isZh ? '已回信（停止外发）' : 'Replied'
                      : isZh ? '人工确认并通过 SMTP 发送' : 'Confirm & Send SMTP'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);
