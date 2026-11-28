/**
 * @license
 * Copyright 2026 OpenGrowth Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Alert, Button, Input, Message, Modal, Space } from '@arco-design/web-react';
import { type StudioSettings } from '../types';

interface StudioModalsProps {
  isZh: boolean;
  settingsModalOpen: boolean;
  setSettingsModalOpen: (v: boolean) => void;
  settings: StudioSettings;
  setSettings: (v: StudioSettings) => void;
  cronModalOpen: boolean;
  setCronModalOpen: (v: boolean) => void;
  cronEnabled: boolean;
  setCronEnabled: (v: boolean) => void;
  checkingImap: boolean;
  onCheckImapReplies: () => void;
  onTriggerCronTest: () => void;
  guideModalOpen: boolean;
  setGuideModalOpen: (v: boolean) => void;
}

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className='text-12px font-600 text-t-secondary mb-4px'>{children}</div>
);

export const StudioModals: React.FC<StudioModalsProps> = ({
  isZh,
  settingsModalOpen,
  setSettingsModalOpen,
  settings,
  setSettings,
  cronModalOpen,
  setCronModalOpen,
  cronEnabled,
  setCronEnabled,
  checkingImap,
  onCheckImapReplies,
  onTriggerCronTest,
  guideModalOpen,
  setGuideModalOpen,
}) => {
  const [settingsTab, setSettingsTab] = useState<'llm' | 'mail' | 'integrations'>('llm');

  return (
    <>
      <Modal
        title={isZh ? '接口与本地密钥配置' : 'API & Local Keys Settings'}
        visible={settingsModalOpen}
        onCancel={() => setSettingsModalOpen(false)}
        onOk={() => {
          setSettingsModalOpen(false);
          Message.success(isZh ? '配置已保存到本机' : 'Settings saved locally');
        }}
        okText={isZh ? '保存配置' : 'Save'}
        cancelText={isZh ? '取消' : 'Cancel'}
        style={{ width: 600 }}
      >
        <div className='flex flex-col gap-16px'>
          <div className='p-10px rd-8px bg-[rgba(79,70,229,0.06)] text-12px text-t-primary leading-relaxed'>
            {isZh
              ? '全部密钥仅保存在本机，零上传。工作台已自动同步你在系统「设置 → 模型」中配置的大模型，也可在此单独覆盖。'
              : 'All keys stay strictly on your local machine. System models from Settings are auto-synced here.'}
          </div>

          {/* Clean Segmented Tabs */}
          <div className='inline-flex p-4px rd-10px bg-2 border border-solid border-[var(--color-border-2)] gap-4px w-fit'>
            {[
              { id: 'llm' as const, label: isZh ? '大模型与生图' : 'LLM & Image' },
              { id: 'mail' as const, label: isZh ? '外贸邮箱 (SMTP/IMAP)' : 'SMTP / IMAP' },
              { id: 'integrations' as const, label: isZh ? '通知与本地爬虫' : 'Webhook & Crawler' },
            ].map((tab) => (
              <button
                key={tab.id}
                type='button'
                onClick={() => setSettingsTab(tab.id)}
                className='h-30px px-14px rd-7px border-none text-12px font-600 cursor-pointer transition-colors'
                style={
                  settingsTab === tab.id
                    ? { backgroundColor: '#4F46E5', color: '#FFFFFF' }
                    : { backgroundColor: 'transparent', color: 'var(--color-text-2)' }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {settingsTab === 'llm' && (
            <div className='flex flex-col gap-14px'>
              <div className='p-14px rd-10px bg-2 border border-solid border-[var(--color-border-2)] flex flex-col gap-10px'>
                <div className='flex items-center justify-between gap-8px'>
                  <div className='text-13px font-700 text-t-primary'>
                    {isZh ? '对话与文案大模型（OpenAI 兼容接口）' : 'LLM Provider (OpenAI Compatible)'}
                  </div>
                  {(settings.llmApiKey || settings.llmModel) && (
                    <Button
                      size='mini'
                      status='danger'
                      type='secondary'
                      onClick={() =>
                        setSettings({
                          ...settings,
                          llmApiKey: '',
                          llmModel: '',
                          llmManualOverride: false,
                        })
                      }
                    >
                      {isZh ? '清空密钥' : 'Clear Key'}
                    </Button>
                  )}
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-10px'>
                  <div>
                    <FieldLabel>Base URL</FieldLabel>
                    <Input value={settings.llmBaseUrl} onChange={(v) => setSettings({ ...settings, llmBaseUrl: v, llmManualOverride: true })} placeholder='https://api.deepseek.com/v1' />
                  </div>
                  <div>
                    <FieldLabel>Model</FieldLabel>
                    <Input value={settings.llmModel} onChange={(v) => setSettings({ ...settings, llmModel: v, llmManualOverride: true })} placeholder='deepseek-chat' />
                  </div>
                </div>
                <div>
                  <FieldLabel>API Key</FieldLabel>
                  <Input.Password value={settings.llmApiKey} onChange={(v) => setSettings({ ...settings, llmApiKey: v, llmManualOverride: Boolean(v.trim()) })} placeholder='sk-...' />
                </div>
              </div>

              <div className='p-14px rd-10px bg-2 border border-solid border-[var(--color-border-2)] flex flex-col gap-10px'>
                <div className='flex items-center justify-between'>
                  <span className='text-13px font-700 text-t-primary'>
                    {isZh ? '独立 AI 生图接口（可选）' : 'Image Generation API (Optional)'}
                  </span>
                  <span className='text-11px text-t-secondary'>
                    {isZh ? '留空则自动生成品牌视觉封面' : 'Falls back to local brand cover'}
                  </span>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-10px'>
                  <div>
                    <FieldLabel>Image Base URL</FieldLabel>
                    <Input value={settings.imageBaseUrl} onChange={(v) => setSettings({ ...settings, imageBaseUrl: v })} placeholder='https://api.openai.com/v1' />
                  </div>
                  <div>
                    <FieldLabel>Image Model</FieldLabel>
                    <Input value={settings.imageModel} onChange={(v) => setSettings({ ...settings, imageModel: v })} placeholder='gpt-image-1' />
                  </div>
                </div>
                <div>
                  <FieldLabel>Image API Key</FieldLabel>
                  <Input.Password value={settings.imageApiKey} onChange={(v) => setSettings({ ...settings, imageApiKey: v })} placeholder='sk-...' />
                </div>
              </div>
            </div>
          )}

          {settingsTab === 'mail' && (
            <div className='p-14px rd-10px bg-2 border border-solid border-[var(--color-border-2)] flex flex-col gap-10px'>
              <div className='text-13px font-700 text-t-primary'>
                {isZh ? '开发信 SMTP 发信与 IMAP 回信检测' : 'Outbound SMTP & IMAP Reply Tracking'}
              </div>
              <div className='grid grid-cols-3 gap-10px'>
                <div className='col-span-2'>
                  <FieldLabel>SMTP Host</FieldLabel>
                  <Input value={settings.smtpHost || ''} onChange={(v) => setSettings({ ...settings, smtpHost: v })} placeholder='smtp.163.com / smtp.gmail.com' />
                </div>
                <div>
                  <FieldLabel>SMTP Port</FieldLabel>
                  <Input value={String(settings.smtpPort || 465)} onChange={(v) => setSettings({ ...settings, smtpPort: Number(v) || 465 })} placeholder='465' />
                </div>
              </div>
              <div className='grid grid-cols-3 gap-10px'>
                <div className='col-span-2'>
                  <FieldLabel>IMAP Host</FieldLabel>
                  <Input value={settings.imapHost || ''} onChange={(v) => setSettings({ ...settings, imapHost: v })} placeholder='imap.163.com / imap.gmail.com' />
                </div>
                <div>
                  <FieldLabel>IMAP Port</FieldLabel>
                  <Input value={String(settings.imapPort || 993)} onChange={(v) => setSettings({ ...settings, imapPort: Number(v) || 993 })} placeholder='993' />
                </div>
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-10px'>
                <div>
                  <FieldLabel>{isZh ? '发件邮箱账号' : 'Email Account'}</FieldLabel>
                  <Input value={settings.smtpUser || ''} onChange={(v) => setSettings({ ...settings, smtpUser: v })} placeholder='sales@yourcompany.com' />
                </div>
                <div>
                  <FieldLabel>{isZh ? '邮箱授权码 / 密码' : 'App Password'}</FieldLabel>
                  <Input.Password value={settings.smtpPass || ''} onChange={(v) => setSettings({ ...settings, smtpPass: v })} placeholder='SMTP / IMAP 授权码' />
                </div>
              </div>
            </div>
          )}

          {settingsTab === 'integrations' && (
            <div className='p-14px rd-10px bg-2 border border-solid border-[var(--color-border-2)] flex flex-col gap-10px'>
              <div className='text-13px font-700 text-t-primary'>
                {isZh ? 'IM 机器人推送 & 本地 Crawl4AI 爬虫（可选）' : 'IM Webhook & Local Crawl4AI (Optional)'}
              </div>
              <div>
                <FieldLabel>{isZh ? '飞书 / 企微 / 钉钉 Webhook URL' : 'IM Bot Webhook URL'}</FieldLabel>
                <Input value={settings.imWebhookUrl || ''} onChange={(v) => setSettings({ ...settings, imWebhookUrl: v })} placeholder='https://open.feishu.cn/open-apis/bot/v2/hook/...' />
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-10px'>
                <div>
                  <FieldLabel>Crawl4AI URL</FieldLabel>
                  <Input value={settings.crawlerMcpUrl || ''} onChange={(v) => setSettings({ ...settings, crawlerMcpUrl: v })} placeholder='http://localhost:11235/crawl' />
                </div>
                <div>
                  <FieldLabel>Crawl4AI Token</FieldLabel>
                  <Input.Password value={settings.crawlerToken || ''} onChange={(v) => setSettings({ ...settings, crawlerToken: v })} placeholder='Optional Bearer Token' />
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        title={isZh ? '定时巡检与飞书/企微审批中心' : 'Daily Checks & IM Approval Center'}
        visible={cronModalOpen}
        onCancel={() => setCronModalOpen(false)}
        onOk={() => setCronModalOpen(false)}
        style={{ width: 540 }}
      >
        <div className='flex flex-col gap-12px'>
          <Alert type='info' content={isZh ? '工作台页面打开期间，每天检查 IMAP 客户回信、提醒待审批开发信队列，并通过 Webhook 推送至飞书/企微/钉钉。' : 'While this workspace is open, checks IMAP replies daily and pushes pending approvals to Feishu/WeCom/DingTalk.'} />
          <div className='p-12px rd-10px bg-2 border border-solid border-[var(--color-border-2)] flex items-center justify-between'>
            <div>
              <div className='text-13px font-600'>{isZh ? '每日获客巡检 & 回信自动停发' : 'Daily Digest & Auto-Stop on Reply'}</div>
              <div className='text-11px text-t-secondary'>{cronEnabled ? (isZh ? '已启用' : 'Enabled') : (isZh ? '未启用' : 'Disabled')}</div>
            </div>
            <Button size='small' type={cronEnabled ? 'primary' : 'secondary'} onClick={() => setCronEnabled(!cronEnabled)}>
              {cronEnabled ? (isZh ? '暂停巡检' : 'Pause') : (isZh ? '立即开启' : 'Enable')}
            </Button>
          </div>
          <Space>
            <Button type='secondary' loading={checkingImap} onClick={onCheckImapReplies}>{isZh ? '立即执行 IMAP 回信检测' : 'Check IMAP Now'}</Button>
            <Button type='primary' onClick={onTriggerCronTest} style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>{isZh ? '推送汇总到飞书/企微' : 'Push IM Digest'}</Button>
          </Space>
        </div>
      </Modal>

      <Modal
        title={isZh ? 'OpenGrowth · 全行业全球获客系统使用指南' : 'OpenGrowth · Quick Operating Guide'}
        visible={guideModalOpen}
        onCancel={() => setGuideModalOpen(false)}
        onOk={() => setGuideModalOpen(false)}
        style={{ width: 620 }}
      >
        <div className='flex flex-col gap-12px text-13px text-t-primary'>
          <Alert type='success' content={isZh ? '全本地开源架构：所有数据与密钥 100% 留在您的本机，无需任何第三方云端中转。' : '100% local open-source architecture with zero third-party cloud lock-in.'} />
          <div className='p-12px rd-10px bg-2 border border-solid border-[var(--color-border-2)]'>
            <div className='font-700 mb-4px'>{isZh ? '第 1 步：一键创作与发布' : 'Step 1: 1-Click Create & Publish'}</div>
            <div className='text-12px text-t-secondary'>{isZh ? '在「内容创作」输入一句话卖点 → 点「一键生成全套内容（文案+封面+动效）」→ 点「立即去 AI 浏览器发布」，右侧点「一键回填」即可人工确认发出。' : 'Enter your pitch → 1-Click Generate All → Publish directly in the built-in AI Browser.'}</div>
          </div>
          <div className='p-12px rd-10px bg-2 border border-solid border-[var(--color-border-2)]'>
            <div className='font-700 mb-4px'>{isZh ? '第 2 步：内置 AI 浏览器 + 社媒雷达' : 'Step 2: AI Browser & Social Intent Radar'}</div>
            <div className='text-12px text-t-secondary'>{isZh ? '在「AI 浏览器」逛小红书/抖音/知乎/LinkedIn 帖子，右侧一键抓取真实昵称与评论送入「社媒雷达」→ 大模型精排与定制回复 → 一键入库 CRM。' : 'Browse social posts in the built-in AI Browser → extract comments to Radar → score & add to CRM.'}</div>
          </div>
          <div className='p-12px rd-10px bg-2 border border-solid border-[var(--color-border-2)]'>
            <div className='font-700 mb-4px'>{isZh ? '第 3 步：企业寻客 → 线索 CRM 与开源同步' : 'Step 3: B2B Prospector → Lead CRM'}</div>
            <div className='text-12px text-t-secondary'>{isZh ? '国内批量查公司官网/电话/邮箱或海外地图黄页提取 → 汇入「线索 CRM」5 阶段看板跟进，并支持一键同步至自建 Twenty / Atomic 开源 CRM。' : 'Extract CN/Global companies → manage in 5-stage Kanban CRM & sync to Twenty/Atomic CRM.'}</div>
          </div>
        </div>
      </Modal>
    </>
  );
};
