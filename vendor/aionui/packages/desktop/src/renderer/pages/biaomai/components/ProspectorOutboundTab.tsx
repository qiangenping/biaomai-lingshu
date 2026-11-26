/**
 * @license
 * Copyright 2026 BiaoMai Lingshu Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button, Empty, Input, Select, Space, Tag } from '@arco-design/web-react';
import { IconEmail, IconPlus, IconSearch, IconSend } from '@arco-design/web-react/icon';
import { nextEmailDraft, type GlobalProspect } from '../types';

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
  b2bLang: string;
  setB2bLang: (v: string) => void;
  prospects: GlobalProspect[];
  extractingB2b: boolean;
  enrichingId: string;
  draftingOutreachId: string;
  sendingEmailId: string;
  checkingImap: boolean;
  crawlingMcp: boolean;
  onOpenDirectory: (ch: 'gmaps' | 'linkedin' | 'thomasnet' | 'europages' | 'alibaba' | 'amap' | 'baidu_map') => void;
  onLookupCnCompanies: () => void;
  onExtractProspects: () => void;
  onEnrichProspect: (item: GlobalProspect) => void;
  onGenerateColdEmail: (item: GlobalProspect) => void;
  onSendColdEmail: (item: GlobalProspect) => void;
  onAddProspectToCrm: (item: GlobalProspect) => void;
  onCheckImapReplies: () => void;
  crawlTarget: string;
  setCrawlTarget: (v: string) => void;
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
  onOpenDirectory,
  onLookupCnCompanies,
  onExtractProspects,
  onEnrichProspect,
  onGenerateColdEmail,
  onSendColdEmail,
  onAddProspectToCrm,
  onCheckImapReplies,
  crawlTarget, setCrawlTarget, onRunCrawlerMcp,
  onPrefillSocialDm,
}) => (
  <div className='flex flex-col gap-18px'>
    <div className='p-20px rd-14px bg-1 border border-solid border-[var(--color-border-2)] shadow-[0_1px_3px_rgba(15,23,42,0.05)] flex flex-col gap-14px'>
      <div className='flex items-center justify-between flex-wrap gap-10px'>
        <div>
          <div className='text-15px font-600 text-t-primary'>
            {isZh ? '全球与国内企业寻客雷达（支持公司名 / 地图 / 黄页）' : 'Global & CN Enterprise Prospector'}
          </div>
          <div className='text-12px text-t-secondary mt-2px'>
            {isZh
              ? '输入国内公司名直挖官网/手机/邮箱 · 高德/百度/Google 地图抓商家 · DNS MX 验真 + 多语种开发信'
              : 'CN Company Lookup · Amap/Baidu/Google Maps Extraction · DNS MX Verification · Multilingual Cold Email'}
          </div>
        </div>
        <Space>
          <Button size='small' type={b2bMode === 'cn' ? 'primary' : 'secondary'} onClick={() => setB2bMode('cn')}>
            {isZh ? '国内企业/地图' : 'CN Company & Map'}
          </Button>
          <Button size='small' type={b2bMode === 'global' ? 'primary' : 'secondary'} onClick={() => setB2bMode('global')}>
            {isZh ? '海外外贸寻客' : 'Global B2B'}
          </Button>
        </Space>
      </div>

      {b2bMode === 'cn' && (
        <div className='p-14px rd-10px bg-2 border border-solid border-[var(--color-border-2)] flex flex-col gap-10px'>
          <div className='text-13px font-600 text-t-primary'>
            {isZh ? '输入国内公司名称批量获客（自动检索官网、爱企查/360 公开电话与官方邮箱）' : 'CN Company Name Contact Discovery'}
          </div>
          <TextArea
            rows={3}
            value={cnCompanyInput}
            onChange={setCnCompanyInput}
            placeholder={
              isZh
                ? '输入国内目标公司全称（每行一家，如：山东标脉信息技术有限公司），点击下方一键挖掘官网、手机号与商务邮箱...'
                : 'Enter Chinese company names (one per line)...'
            }
          />
          <div className='flex items-center justify-between flex-wrap gap-8px'>
            <Space wrap>
              <Button size='small' type='outline' onClick={() => onOpenDirectory('amap')}>
                {isZh ? '高德地图搜商家' : 'Amap (CN)'}
              </Button>
              <Button size='small' type='outline' onClick={() => onOpenDirectory('baidu_map')}>
                {isZh ? '百度地图搜商家' : 'Baidu Map'}
              </Button>
            </Space>
            <Button type='primary' icon={<IconSearch />} loading={lookingUpCn} onClick={onLookupCnCompanies} style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>
              {isZh ? '一键挖掘公司官网 / 电话 / 邮箱' : 'Lookup CN Companies'}
            </Button>
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-3 gap-12px'>
        <div className='flex flex-col gap-4px'>
          <label className='text-12px font-500 text-t-secondary'>{isZh ? '目标行业 / 产品关键词' : 'Target Industry / Keywords'}</label>
          <Input value={b2bIndustry} onChange={setB2bIndustry} placeholder='e.g. CNC Machining, Solar Inverter' />
        </div>
        <div className='flex flex-col gap-4px'>
          <label className='text-12px font-500 text-t-secondary'>{isZh ? '目标国家 / 城市' : 'Target Country / City'}</label>
          <Input value={b2bCountry} onChange={setB2bCountry} placeholder='e.g. Germany, USA, UAE, CN' />
        </div>
        <div className='flex flex-col gap-4px'>
          <label className='text-12px font-500 text-t-secondary'>{isZh ? '开发信目标语种' : 'Outreach Language'}</label>
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
        <Space wrap>
          <Button size='small' type='outline' onClick={() => onOpenDirectory('gmaps')}>Google Maps</Button>
          <Button size='small' type='outline' onClick={() => onOpenDirectory('linkedin')}>LinkedIn</Button>
          <Button size='small' type='outline' onClick={() => onOpenDirectory('thomasnet')}>Thomasnet</Button>
          <Button size='small' type='outline' onClick={() => onOpenDirectory('europages')}>Europages</Button>
          <Button size='small' type='outline' onClick={() => onOpenDirectory('alibaba')}>Alibaba</Button>
          <Input value={crawlTarget} onChange={setCrawlTarget} placeholder={isZh ? '企业或目录网址（默认 Europages）' : 'Company or directory URL (default Europages)'} />
          <Button size='small' type='outline' loading={crawlingMcp} onClick={onRunCrawlerMcp}>Crawl4AI</Button>
        </Space>
        <Space wrap>
          <Button type='outline' icon={<IconEmail />} loading={checkingImap} onClick={onCheckImapReplies}>
            {isZh ? 'IMAP 检测客户回信' : 'Check IMAP Replies'}
          </Button>
          <Button type='primary' icon={<IconSearch />} loading={extractingB2b} onClick={onExtractProspects} style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>
            {isZh ? '从当前浏览器页面提取线索' : 'Extract from Browser'}
          </Button>
        </Space>
      </div>
    </div>

    {prospects.length === 0 ? (
      <Empty description={isZh ? '输入国内公司名一键挖掘，或打开地图/目录页后点击「从当前浏览器页面提取线索」' : 'Lookup CN companies or extract from browser'} />
    ) : (
      <div className='flex flex-col gap-12px'>
        {prospects.map((item) => (
          <div key={item.id} className='p-16px rd-14px bg-1 border border-solid border-[var(--color-border-2)] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col gap-10px'>
            <div className='flex items-start justify-between gap-12px flex-wrap'>
              <div className='flex flex-col gap-4px min-w-0 flex-1'>
                <div className='flex items-center gap-8px flex-wrap'>
                  <span className='text-15px font-700 text-t-primary'>{item.companyName}</span>
                  <Tag size='small' color='arcoblue'>{item.country}</Tag>
                  {item.mxValid === true && <Tag size='small' color='green'>MX Valid ({item.mxHost})</Tag>}
                  {item.mxValid === false && <Tag size='small' color='orange'>No MX</Tag>}
                  {item.outreachSent && <Tag size='small' color='purple'>{isZh ? '已发送开发信' : 'Sent'}</Tag>}
                  {item.replied && <Tag size='small' color='green'>{isZh ? '已回信 (序列已暂停)' : 'Replied'}</Tag>}
                </div>
                <div className='text-12px text-t-secondary flex items-center gap-12px flex-wrap'>
                  {item.website && <span>{item.website}</span>}
                  {item.email && <span>{item.email}</span>}
                  {item.phone && <span>{item.phone}</span>}
                  {item.whatsappUrl && <Tag size='small' color='green'>WhatsApp Ready</Tag>}
                </div>
                {item.snippet && <div className='text-12px text-t-tertiary'>{item.snippet}</div>}
              </div>
              <Space wrap>
                <Button size='small' type='outline' loading={enrichingId === item.id} onClick={() => onEnrichProspect(item)}>
                  {isZh ? '抓邮箱 + MX 验真' : 'Enrich & MX Verify'}
                </Button>
                <Button size='small' type='outline' loading={draftingOutreachId === item.id} onClick={() => onGenerateColdEmail(item)}>
                  {isZh ? 'AI 写多语开发信' : 'Draft Cold Email'}
                </Button>
                <Button size='small' type='primary' icon={<IconPlus />} onClick={() => onAddProspectToCrm(item)} style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>
                  {isZh ? '入库 CRM' : 'Add CRM'}
                </Button>
              </Space>
            </div>

            {item.outreachBody && (
              <div className='p-12px rd-10px bg-2 border border-solid border-[var(--color-border-2)] flex flex-col gap-8px'>
                {item.sequence && item.sequence.length > 1 && (
                  <div className='flex items-center gap-6px flex-wrap'>
                    {item.sequence.map((step, sIdx) => (
                      <Tag key={sIdx} size='small' color={step.channel === 'whatsapp' ? 'green' : 'arcoblue'}>
                        Day {step.dayOffset} · {step.channel.toUpperCase()} {step.status === 'sent' ? '✓' : ''}
                      </Tag>
                    ))}
                  </div>
                )}
                <div className='text-12px font-600 text-t-primary'>Subject: {item.outreachSubject}</div>
                <div className='text-12px text-t-secondary whitespace-pre-wrap'>{item.outreachBody}</div>
                <div className='flex justify-end gap-8px flex-wrap'>
                  {(item.whatsappUrl || item.sequence?.some((s) => s.channel === 'whatsapp')) && (
                    <Button
                      size='mini'
                      type='outline'
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
                      size='mini'
                      type='outline'
                      onClick={() => onPrefillSocialDm(item.linkedinUrl || 'https://www.linkedin.com/', item.outreachBody || '')}
                    >
                      {isZh ? '填入 LinkedIn 备注' : 'Prefill LinkedIn'}
                    </Button>
                  )}
                  <Button
                    size='mini'
                    type='primary'
                    icon={<IconSend />}
                    loading={sendingEmailId === item.id}
                    disabled={!nextEmailDraft(item)}
                    onClick={() => onSendColdEmail(item)}
                    style={{ background: '#0F172A', borderColor: '#0F172A' }}
                  >
                    {item.replied
                      ? isZh ? '已回信（停止外发）' : 'Replied'
                      : !nextEmailDraft(item) ? (isZh ? '邮件已发完' : 'Emails sent') : (isZh ? '确认下一封邮件' : 'Review next email')}
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
