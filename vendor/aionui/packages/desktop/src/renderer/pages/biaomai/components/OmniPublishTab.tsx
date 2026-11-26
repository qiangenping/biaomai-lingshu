/**
 * @license
 * Copyright 2026 BiaoMai Lingshu Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button, Empty, Input, Select, Space, Tag } from '@arco-design/web-react';
import { ALL_PLATFORMS, type LocalAccount, type LocalPost, type MediaPlatform } from '../types';

interface OmniPublishTabProps {
  isZh: boolean;
  regionFilter: 'all' | 'cn' | 'global';
  setRegionFilter: (v: 'all' | 'cn' | 'global') => void;
  visiblePlatforms: MediaPlatform[];
  accounts: LocalAccount[];
  posts: LocalPost[];
  accPlatform: string;
  setAccPlatform: (v: string) => void;
  accLabel: string;
  setAccLabel: (v: string) => void;
  onOpenIsolatedWindow: (partition: string, url: string, label: string) => void;
  onAddAccount: () => void;
  onConfirmPublish: (post: LocalPost) => void;
}

export const OmniPublishTab: React.FC<OmniPublishTabProps> = ({
  isZh,
  regionFilter,
  setRegionFilter,
  visiblePlatforms,
  accounts,
  posts,
  accPlatform,
  setAccPlatform,
  accLabel,
  setAccLabel,
  onOpenIsolatedWindow,
  onAddAccount,
  onConfirmPublish,
}) => (
  <div className='flex flex-col gap-18px'>
    <div className='p-20px rd-14px bg-1 border border-solid border-[var(--color-border-2)] shadow-[0_1px_3px_rgba(15,23,42,0.05)] flex flex-col gap-14px'>
      <div className='flex items-center justify-between flex-wrap gap-10px'>
        <div>
          <div className='text-15px font-600'>{isZh ? '全球 17 大媒介矩阵（本地隔离浏览器直连）' : '17 Global & Domestic Channels'}</div>
          <div className='text-12px text-t-secondary mt-2px'>
            {isZh ? '每个账号独立 Cookie 分区，免服务器、免开发者资质即可登录发布' : 'Isolated Cookie partitions per account, zero server setup required'}
          </div>
        </div>
        <Space>
          <Button size='small' type={regionFilter === 'all' ? 'primary' : 'secondary'} onClick={() => setRegionFilter('all')}>{isZh ? '全部 (17)' : 'All (17)'}</Button>
          <Button size='small' type={regionFilter === 'cn' ? 'primary' : 'secondary'} onClick={() => setRegionFilter('cn')}>{isZh ? '国内 (9)' : 'CN (9)'}</Button>
          <Button size='small' type={regionFilter === 'global' ? 'primary' : 'secondary'} onClick={() => setRegionFilter('global')}>{isZh ? '海外 (8)' : 'Global (8)'}</Button>
        </Space>
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-10px'>
        {visiblePlatforms.map((p) => {
          const acc = accounts.find((a) => a.platformId === p.id);
          const partition = acc?.partition || `persist:bm-acc-${p.id}-default`;
          return (
            <div
              key={p.id}
              className='p-12px rd-12px bg-2 border border-solid border-[var(--color-border-2)] flex flex-col justify-between gap-10px hover:border-[#4F46E5] transition-colors'
            >
              <div className='flex items-center justify-between'>
                <span
                  className='inline-flex items-center justify-center size-26px rd-7px text-white text-11px font-700'
                  style={{ background: p.brandColor }}
                >
                  {p.badge}
                </span>
                <span className='text-10px font-600 text-t-tertiary'>{p.region === 'cn' ? 'CN' : 'GL'}</span>
              </div>
              <div>
                <div className='text-13px font-600 text-t-primary'>{isZh ? p.nameZh : p.nameEn}</div>
                <div className='text-11px text-t-secondary truncate mt-2px'>{acc ? acc.label : p.aspect}</div>
              </div>
              <Button size='mini' type='secondary' long onClick={() => onOpenIsolatedWindow(partition, p.creatorUrl, acc?.label || p.nameZh)}>
                {isZh ? '打开后台' : 'Launch'}
              </Button>
            </div>
          );
        })}
      </div>
    </div>

    <div className='grid grid-cols-1 md:grid-cols-2 gap-18px'>
      <div className='p-20px rd-14px bg-1 border border-solid border-[var(--color-border-2)] shadow-[0_1px_3px_rgba(15,23,42,0.05)] flex flex-col gap-12px'>
        <div className='text-15px font-600'>{isZh ? '多账号隔离容器管理' : 'Isolated Account Containers'}</div>
        <div className='flex gap-8px'>
          <Select value={accPlatform} onChange={setAccPlatform} style={{ width: 140 }}>
            {ALL_PLATFORMS.map((p) => (
              <Select.Option key={p.id} value={p.id}>{isZh ? p.nameZh : p.nameEn}</Select.Option>
            ))}
          </Select>
          <Input placeholder={isZh ? '账号备注（如：主号）' : 'Account label'} value={accLabel} onChange={setAccLabel} />
          <Button type='primary' onClick={onAddAccount} style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>{isZh ? '添加' : 'Add'}</Button>
        </div>
        {accounts.length === 0 ? (
          <Empty description={isZh ? '暂无自定义隔离账号' : 'No accounts yet'} />
        ) : (
          <div className='flex flex-col gap-8px'>
            {accounts.map((a) => {
              const plat = ALL_PLATFORMS.find((p) => p.id === a.platformId);
              return (
                <div key={a.id} className='flex items-center justify-between p-10px rd-10px bg-2 border border-solid border-[var(--color-border-2)]'>
                  <div>
                    <div className='text-13px font-600'>{a.label} · {plat ? (isZh ? plat.nameZh : plat.nameEn) : a.platformId}</div>
                    <div className='text-11px text-t-secondary'>{a.partition}</div>
                  </div>
                  <Button size='mini' type='secondary' onClick={() => plat && onOpenIsolatedWindow(a.partition, plat.creatorUrl, a.label)}>
                    {isZh ? '打开窗口' : 'Open'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className='p-20px rd-14px bg-1 border border-solid border-[var(--color-border-2)] shadow-[0_1px_3px_rgba(15,23,42,0.05)] flex flex-col gap-12px'>
        <div className='text-15px font-600'>{isZh ? '排期日历与人工确认发布队列' : 'Schedule Queue & Approval'}</div>
        {posts.length === 0 ? (
          <Empty description={isZh ? '请在「01 内容创作」生成草稿并加入排期' : 'Create content in step 01 first'} />
        ) : (
          <div className='flex flex-col gap-8px'>
            {posts.map((post) => (
              <div key={post.id} className='flex items-center justify-between p-12px rd-10px bg-2 border border-solid border-[var(--color-border-2)]'>
                <div className='min-w-0 pr-8px'>
                  <div className='text-13px font-600 truncate'>{post.title}</div>
                  <Space size='mini' className='mt-4px'>
                    <Tag size='small' color='arcoblue'>{post.platformId}</Tag>
                    <Tag size='small' color={post.status === 'published' ? 'green' : 'orange'}>{post.status}</Tag>
                    <span className='text-11px text-t-secondary'>{post.scheduledAt}</span>
                  </Space>
                </div>
                {post.status !== 'published' && (
                  <Button size='small' type='primary' onClick={() => onConfirmPublish(post)} style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>
                    {isZh ? '确认发布' : 'Publish'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);
