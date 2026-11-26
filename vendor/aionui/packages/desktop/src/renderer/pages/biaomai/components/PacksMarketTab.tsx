/**
 * @license
 * Copyright 2026 BiaoMai Lingshu Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button, Empty, Space, Tag } from '@arco-design/web-react';
import { IconPlus, IconRefresh } from '@arco-design/web-react/icon';
import { type InstalledPack } from '../types';

interface PacksMarketTabProps {
  isZh: boolean;
  installedPacks: InstalledPack[];
  loadingPacks: boolean;
  onRefresh: () => void;
  onInstallLocalPack: () => void;
  onUninstallPack: (packName: string) => void;
  openMotionRunning?: boolean;
  openMotionBusy?: boolean;
  onStartOpenMotion?: () => void;
  onOpenOpenMotion?: () => void;
  onStopOpenMotion?: () => void;
}

export const PacksMarketTab: React.FC<PacksMarketTabProps> = ({
  isZh,
  installedPacks,
  loadingPacks,
  onRefresh,
  onInstallLocalPack,
  onUninstallPack,
  openMotionRunning,
  openMotionBusy,
  onStartOpenMotion,
  onOpenOpenMotion,
  onStopOpenMotion,
}) => (
  <div className='flex flex-col gap-18px'>
    <div className='p-20px rd-14px bg-1 border border-solid border-[var(--color-border-2)] shadow-[0_1px_3px_rgba(15,23,42,0.05)] flex items-center justify-between flex-wrap gap-12px'>
      <div>
        <div className='text-15px font-600 text-t-primary'>
          {isZh ? '微内核热插拔行业套件与开源插件 (.bmpack)' : 'Micro-Kernel Industry Packs & OSS Plugins (.bmpack)'}
        </div>
        <div className='text-12px text-t-secondary mt-2px'>
          {isZh
            ? '内置全球开源获客插件与官方行业套件，支持本地 .bmpack 即时加载与 Apache-2.0 / MIT 许可校验'
            : 'Built-in global OSS plugins & official industry packs with Apache-2.0 / MIT license enforcement'}
        </div>
      </div>
      <Space>
        <Button type='outline' icon={<IconRefresh />} loading={loadingPacks} onClick={onRefresh}>
          {isZh ? '刷新列表' : 'Refresh'}
        </Button>
        <Button type='primary' icon={<IconPlus />} onClick={onInstallLocalPack} style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>
          {isZh ? '安装本地 .bmpack 插件' : 'Install Local .bmpack'}
        </Button>
      </Space>
    </div>

    {installedPacks.length === 0 ? (
      <Empty description={isZh ? '暂未发现已加载插件，点击右上角选择本地 .bmpack 目录安装' : 'No packs installed yet'} />
    ) : (
      <div className='grid grid-cols-1 md:grid-cols-2 gap-14px'>
        {installedPacks.map((pack) => {
          const title =
            typeof pack.displayName === 'string'
              ? pack.displayName
              : (isZh ? pack.displayName?.['zh-CN'] : pack.displayName?.['en-US']) || pack.name;
          const desc =
            typeof pack.description === 'string'
              ? pack.description
              : (isZh ? pack.description?.['zh-CN'] : pack.description?.['en-US']) || '';
          const isOssPlugin = pack.name.startsWith('plugin-oss-');
          const permKeys = Object.entries(pack.permissions || {})
            .filter(([, v]) => Boolean(v))
            .map(([k]) => k);
          return (
            <div key={pack.name} className='p-18px rd-14px bg-1 border border-solid border-[var(--color-border-2)] shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col justify-between gap-12px'>
              <div className='flex flex-col gap-6px'>
                <div className='flex items-center justify-between gap-8px'>
                  <span className='text-14px font-700 text-t-primary'>{title}</span>
                  <Space size='mini'>
                    <Tag size='small' color={isOssPlugin ? 'purple' : 'arcoblue'}>
                      {isOssPlugin ? (isZh ? '开源插件' : 'OSS Plugin') : (isZh ? '行业套件' : 'Industry Pack')}
                    </Tag>
                    <Tag size='small' color='green'>{pack.license}</Tag>
                  </Space>
                </div>
                <div className='text-12px text-t-secondary'>{desc}</div>
                <Space size='mini' wrap className='mt-4px'>
                  <Tag size='small'>v{pack.version}</Tag>
                  <Tag size='small'>{isZh ? `助手 ${pack.assistantsCount}` : `Assistants ${pack.assistantsCount}`}</Tag>
                  <Tag size='small'>{isZh ? `技能 ${pack.skillsCount}` : `Skills ${pack.skillsCount}`}</Tag>
                  {permKeys.slice(0, 3).map((perm) => (
                    <Tag key={perm} size='small' color='orange'>{perm}</Tag>
                  ))}
                </Space>
              </div>
              <div className='flex justify-between items-center gap-8px flex-wrap'>
                {pack.name === 'plugin-oss-openmotion' ? (
                  <Space size='mini'>
                    {openMotionRunning ? (
                      <>
                        <Button size='small' type='primary' onClick={onOpenOpenMotion}>
                          {isZh ? '打开 OpenMotion Studio' : 'Open Studio'}
                        </Button>
                        <Button size='small' type='secondary' loading={openMotionBusy} onClick={onStopOpenMotion}>
                          {isZh ? '停止' : 'Stop'}
                        </Button>
                      </>
                    ) : (
                      <Button size='small' type='primary' loading={openMotionBusy} onClick={onStartOpenMotion}>
                        {isZh ? '启动本地完整版 Studio' : 'Start Local Studio'}
                      </Button>
                    )}
                  </Space>
                ) : (
                  <span />
                )}
                <Button size='small' status='danger' type='outline' onClick={() => onUninstallPack(pack.name)}>
                  {isZh ? '卸载' : 'Uninstall'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);
