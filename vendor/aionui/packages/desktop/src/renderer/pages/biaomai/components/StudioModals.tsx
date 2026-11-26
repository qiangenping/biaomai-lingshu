/**
 * @license
 * Copyright 2026 BiaoMai Lingshu Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Alert, Button, Input, Message, Modal, Select, Space } from '@arco-design/web-react';
import { type StudioSettings } from '../types';

interface StudioModalsProps {
  isZh: boolean;
  settingsModalOpen: boolean;
  setSettingsModalOpen: (v: boolean) => void;
  settings: StudioSettings;
  setSettings: (v: StudioSettings) => void;
  mcpTestMsg: string;
  onTestAiToEarnMcp: () => void;
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

export const StudioModals: React.FC<StudioModalsProps> = ({
  isZh,
  settingsModalOpen,
  setSettingsModalOpen,
  settings,
  setSettings,
  mcpTestMsg,
  onTestAiToEarnMcp,
  cronModalOpen,
  setCronModalOpen,
  cronEnabled,
  setCronEnabled,
  checkingImap,
  onCheckImapReplies,
  onTriggerCronTest,
  guideModalOpen,
  setGuideModalOpen,
}) => (
  <>
    <Modal
      title={isZh ? '大模型、AiToEarn MCP 与外贸邮箱配置（本地持久化）' : 'LLM, MCP & Outbound Mail Settings'}
      visible={settingsModalOpen}
      onCancel={() => setSettingsModalOpen(false)}
      onOk={() => {
        setSettingsModalOpen(false);
        Message.success(isZh ? '配置已保存到本地' : 'Settings saved locally');
      }}
      style={{ width: 600 }}
    >
      <div className='flex flex-col gap-12px'>
        <Alert type='info' content={isZh ? '全部密钥仅保存在您的本机，零上传；填好模型 Key 即可开启真实 AI 文案、多语出海翻译与生图。' : 'All keys stay strictly on your local machine.'} />
        <div className='font-600'>{isZh ? '1. 对话与文案大模型（OpenAI 兼容接口）' : '1. LLM Provider'}</div>
        <Input addBefore='Base URL' value={settings.llmBaseUrl} onChange={(v) => setSettings({ ...settings, llmBaseUrl: v })} />
        <Input addBefore='Model' value={settings.llmModel} onChange={(v) => setSettings({ ...settings, llmModel: v })} />
        <Input.Password addBefore='API Key' value={settings.llmApiKey} onChange={(v) => setSettings({ ...settings, llmApiKey: v })} />

        <div className='font-600 mt-4px'>{isZh ? '2. AI 生图接口（可选，留空复用上方 Key）' : '2. Image Provider (Optional)'}</div>
        <Input addBefore='Image URL' value={settings.imageBaseUrl} onChange={(v) => setSettings({ ...settings, imageBaseUrl: v })} />
        <Input addBefore='Image Model' value={settings.imageModel} onChange={(v) => setSettings({ ...settings, imageModel: v })} />
        <Input.Password addBefore='Image Key' value={settings.imageApiKey} onChange={(v) => setSettings({ ...settings, imageApiKey: v })} />

        <div className='font-600 mt-4px'>{isZh ? '3. AiToEarn 云端 / 私有化 MCP（可选）' : '3. AiToEarn MCP (Optional)'}</div>
        <Select value={settings.region} onChange={(v) => setSettings({ ...settings, region: v })}>
          <Select.Option value='cn'>国内版 (https://aitoearn.cn/api/unified/mcp)</Select.Option>
          <Select.Option value='global'>国际版 (https://aitoearn.ai/api/unified/mcp)</Select.Option>
          <Select.Option value='self-hosted'>自建端点 ({settings.customMcpUrl})</Select.Option>
        </Select>
        {settings.region === 'self-hosted' && (
          <Input addBefore='MCP URL' value={settings.customMcpUrl} onChange={(v) => setSettings({ ...settings, customMcpUrl: v })} />
        )}
        <Input.Password
          addBefore='x-api-key'
          value={settings.region === 'cn' ? settings.cnMcpKey : settings.globalMcpKey}
          onChange={(v) => setSettings(settings.region === 'cn' ? { ...settings, cnMcpKey: v } : { ...settings, globalMcpKey: v })}
        />
        <Space>
          <Button type='outline' onClick={onTestAiToEarnMcp}>{isZh ? '测试 AiToEarn MCP 连通性' : 'Test AiToEarn MCP'}</Button>
          {mcpTestMsg && <span>{mcpTestMsg}</span>}
        </Space>

        <div className='font-600 mt-4px'>{isZh ? '4. 开发信本地 SMTP / IMAP 收发箱 & IM Webhook' : '4. Outbound SMTP / IMAP & IM Webhook'}</div>
        <div className='grid grid-cols-2 gap-8px'>
          <Input addBefore='SMTP Host' value={settings.smtpHost || ''} onChange={(v) => setSettings({ ...settings, smtpHost: v })} placeholder='smtp.163.com / smtp.gmail.com' />
          <Input addBefore='Port' value={String(settings.smtpPort || 465)} onChange={(v) => setSettings({ ...settings, smtpPort: Number(v) || 465 })} placeholder='465' />
        </div>
        <div className='grid grid-cols-2 gap-8px'>
          <Input addBefore='IMAP Host' value={settings.imapHost || ''} onChange={(v) => setSettings({ ...settings, imapHost: v })} placeholder='imap.163.com / imap.gmail.com' />
          <Input addBefore='IMAP Port' value={String(settings.imapPort || 993)} onChange={(v) => setSettings({ ...settings, imapPort: Number(v) || 993 })} placeholder='993' />
        </div>
        <Input addBefore='Email' value={settings.smtpUser || ''} onChange={(v) => setSettings({ ...settings, smtpUser: v })} placeholder='sales@yourcompany.com' />
        <Input.Password addBefore='App Password' value={settings.smtpPass || ''} onChange={(v) => setSettings({ ...settings, smtpPass: v })} placeholder='SMTP/IMAP 授权码' />
        <Input addBefore='IM Webhook' value={settings.imWebhookUrl || ''} onChange={(v) => setSettings({ ...settings, imWebhookUrl: v })} placeholder='飞书 / 企微 / 钉钉机器人 Webhook URL' />
        <Input addBefore='Crawl4AI URL' value={settings.crawlerMcpUrl || ''} onChange={(v) => setSettings({ ...settings, crawlerMcpUrl: v })} placeholder='http://localhost:11235/crawl' />
      </div>
    </Modal>

    <Modal
      title={isZh ? '24/7 定时巡检与飞书/企微审批中心' : '24/7 Cron & IM Approval Center'}
      visible={cronModalOpen}
      onCancel={() => setCronModalOpen(false)}
      onOk={() => setCronModalOpen(false)}
      style={{ width: 540 }}
    >
      <div className='flex flex-col gap-12px'>
        <Alert type='info' content={isZh ? '开启后将在本地定时检查 IMAP 客户回信、提醒待审批开发信队列，并通过 Webhook 推送至飞书/企微/钉钉。' : 'Checks IMAP replies and pushes pending approvals to Feishu/WeCom/DingTalk.'} />
        <div className='p-12px rd-10px bg-2 border border-solid border-[var(--color-border-2)] flex items-center justify-between'>
          <div>
            <div className='text-13px font-600'>{isZh ? '每日获客巡检 & 回信自动停发' : 'Daily Digest & Auto-Stop on Reply'}</div>
            <div className='text-11px text-t-secondary'>{cronEnabled ? (isZh ? '已启用' : 'Enabled') : (isZh ? '未启用' : 'Disabled')}</div>
          </div>
          <Button size='small' type={cronEnabled ? 'primary' : 'outline'} onClick={() => setCronEnabled(!cronEnabled)}>
            {cronEnabled ? (isZh ? '暂停巡检' : 'Pause') : (isZh ? '立即开启' : 'Enable')}
          </Button>
        </div>
        <Space>
          <Button type='outline' loading={checkingImap} onClick={onCheckImapReplies}>{isZh ? '立即执行 IMAP 回信检测' : 'Check IMAP Now'}</Button>
          <Button type='primary' onClick={onTriggerCronTest} style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>{isZh ? '推送汇总到飞书/企微' : 'Push IM Digest'}</Button>
        </Space>
      </div>
    </Modal>

    <Modal
      title={isZh ? '标脉灵枢 · 全行业全球获客系统使用指南' : 'BiaoMai Lingshu · Quick Operating Guide'}
      visible={guideModalOpen}
      onCancel={() => setGuideModalOpen(false)}
      onOk={() => setGuideModalOpen(false)}
      style={{ width: 620 }}
    >
      <div className='flex flex-col gap-12px text-13px text-t-primary'>
        <Alert type='success' content={isZh ? '本工作台即最终产品主界面：所有数据 100% 保存在本机，支持各行业全球内容获客 + 主动寻客双引擎。' : 'All data stays local on your machine. Dual Inbound + Outbound lead-gen engine.'} />
        <div className='p-12px rd-10px bg-2 border border-solid border-[var(--color-border-2)]'>
          <div className='font-700 mb-4px'>{isZh ? '第 1 步：选行业 + 配置密钥' : 'Step 1: Select Industry & Configure Keys'}</div>
          <div className='text-12px text-t-secondary'>{isZh ? '在顶部选择您的行业视角（外贸/跨境/招投标/本地商户/SaaS），点击右上角「接口配置」填入大模型 Key 与企业邮箱授权码。' : 'Pick your industry preset at the top and configure LLM + SMTP keys in Settings.'}</div>
        </div>
        <div className='p-12px rd-10px bg-2 border border-solid border-[var(--color-border-2)]'>
          <div className='font-700 mb-4px'>{isZh ? '第 2 步：路径 A — 社媒内容获客 (01 → 02 → 03)' : 'Step 2: Inbound Social Growth (01 → 02 → 03)'}</div>
          <div className='text-12px text-t-secondary'>{isZh ? '01 生成多平台文案与封面 → 02 在 17 大平台隔离浏览器发布 → 03 一键提取评论区高意向买家（自动脱敏并停在发送前人工确认）。' : 'Create copy & visuals → publish across 17 isolated channels → capture buyer intent comments.'}</div>
        </div>
        <div className='p-12px rd-10px bg-2 border border-solid border-[var(--color-border-2)]'>
          <div className='font-700 mb-4px'>{isZh ? '第 3 步：路径 B — 全球与国内主动寻客 (04 → 05)' : 'Step 3: Global & CN Outbound (04 → 05)'}</div>
          <div className='text-12px text-t-secondary'>{isZh ? '国内可直接输入公司名或打开高德/百度地图挖掘；海外可打开 Google Maps/LinkedIn/黄页提取企业 → MX 验真 → AI 写 3 轮开发信并人工确认发送 → 全部线索汇入 05 CRM 漏斗成交。' : 'Lookup CN companies/maps or global directories → verify MX → draft & send cold emails → track in Lead CRM.'}</div>
        </div>
      </div>
    </Modal>
  </>
);
