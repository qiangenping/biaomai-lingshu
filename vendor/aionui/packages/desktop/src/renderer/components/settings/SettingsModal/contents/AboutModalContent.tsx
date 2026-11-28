/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Divider, Typography, Button, Switch, Message } from '@arco-design/web-react';
import { Github, Right } from '@icon-park/react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { useSettingsViewMode } from '../settingsViewContext';
import { isElectronDesktop, openExternalUrl } from '@/renderer/utils/platform';
import FeedbackReportModal from './FeedbackReportModal';
import { ipcBridge } from '@/common';
import { getIncludePrerelease, runUpdateCheck } from '@/renderer/components/settings/checkForUpdatesShared';
import { UPDATE_AVAILABLE_EVENT } from '@/renderer/components/settings/useUpdateNotificationController';
import { IS_DISCONTINUED_BUILD } from '@/renderer/utils/discontinuedBuild';
import { OPEN_MIGRATION_DIALOG_EVENT } from '@/renderer/components/settings/UpdateMigrationDialog';
import biaoMaiBrandLogo from '@renderer/assets/logos/brand/app.png';
import {
  getUpdateReadyState,
  setUpdateReadyState,
  subscribeUpdateReadyState,
  type UpdateReadyState,
} from '@/renderer/components/settings/updateReadyState';

// __APP_VERSION__ is injected by electron.vite.config.ts `define:` from the
// repo-root package.json. The previous `import packageJson from
// '../../../../../../package.json'` resolved to packages/desktop/package.json
// which is a workspace placeholder permanently pinned at "0.0.0".
declare const __APP_VERSION__: string;

type LinkItem =
  | { title: string; url: string; icon: React.ReactNode; onClick?: never }
  | { title: string; onClick: () => void; icon: React.ReactNode; url?: never };

const AboutModalContent: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language?.toLowerCase().startsWith('zh');
  const viewMode = useSettingsViewMode();
  const isPageMode = viewMode === 'page';
  const isElectron = isElectronDesktop();

  const [includePrerelease, setIncludePrerelease] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [updateReadyState, setLocalUpdateReadyState] = useState<UpdateReadyState>(() => getUpdateReadyState());
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('update.includePrerelease');
    setIncludePrerelease(saved === 'true');
  }, []);

  useEffect(() => subscribeUpdateReadyState(setLocalUpdateReadyState), []);

  const handlePrereleaseChange = (val: boolean) => {
    setIncludePrerelease(val);
    localStorage.setItem('update.includePrerelease', String(val));
  };

  const openLink = async (url: string) => {
    try {
      await openExternalUrl(url);
    } catch (error) {
      console.log('Failed to open link:', error);
    }
  };

  const checkUpdate = async () => {
    // Discontinued build: guide to the AionPro website instead of any in-app
    // version detection. Dead-branched out of normal builds by the flag.
    if (IS_DISCONTINUED_BUILD) {
      window.dispatchEvent(new CustomEvent(OPEN_MIGRATION_DIALOG_EVENT));
      return;
    }

    if (updateReadyState.ready) {
      if (updateReadyState.preparing) return;
      if (updateReadyState.filePath) {
        void ipcBridge.shell.openFile.invoke(updateReadyState.filePath);
        return;
      }
      setUpdateReadyState({ ...updateReadyState, preparing: true });
      void ipcBridge.autoUpdate.quitAndInstall.invoke().catch(() => {
        Message.error(t('update.errors.prepareInstallFailed'));
        setUpdateReadyState({ ...updateReadyState, preparing: false });
      });
      return;
    }

    if (checking) return;
    setChecking(true);
    try {
      const outcome = await runUpdateCheck({
        includePrerelease: getIncludePrerelease(),
        fallbackVersion: __APP_VERSION__,
        checkFailedLabel: t('update.checkFailed'),
      });
      if (outcome.kind === 'available') {
        // Only reveal the bottom-right card once an update is confirmed; hand
        // over the already-fetched outcome so the card skips the checking flash.
        window.dispatchEvent(new CustomEvent(UPDATE_AVAILABLE_EVENT, { detail: outcome }));
      } else if (outcome.kind === 'upToDate') {
        Message.info(t('update.alreadyLatest'));
      } else {
        Message.error(outcome.message || t('update.checkFailed'));
      }
    } finally {
      setChecking(false);
    }
  };

  const repoUrl = 'https://github.com/qiangenping/opengrowth';

  const linkItems: LinkItem[] = [
    {
      title: t('settings.helpDocumentation'),
      url: 'https://biao5fen.com',
      icon: <Right theme='outline' size='16' className='rtl-mirror' />,
    },
    {
      title: t('settings.updateLog'),
      url: `${repoUrl}/releases`,
      icon: <Right theme='outline' size='16' className='rtl-mirror' />,
    },
    {
      title: t('settings.bugReport'),
      url: `${repoUrl}/issues`,
      icon: <Right theme='outline' size='16' className='rtl-mirror' />,
    },
    {
      title: `${t('settings.contactMe')} (genpingqian@gmail.com)`,
      url: 'mailto:genpingqian@gmail.com',
      icon: <Right theme='outline' size='16' className='rtl-mirror' />,
    },
    {
      title: `${t('settings.officialWebsite')} (biao5fen.com)`,
      url: 'https://biao5fen.com',
      icon: <Right theme='outline' size='16' className='rtl-mirror' />,
    },
  ];

  return (
    <div className='flex flex-col h-full w-full'>
      {/* Content Area */}
      <div
        className={classNames(
          'flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-24px',
          isPageMode && 'px-0 overflow-visible'
        )}
      >
        <div className='flex flex-col max-w-520px mx-auto py-12px'>
          {/* App Info Section */}
          <div className='flex flex-col items-center pb-20px'>
            <div className='size-56px rd-14px overflow-hidden mb-12px border border-solid border-[var(--color-border-2)] bg-1'>
              <img src={biaoMaiBrandLogo} alt='OpenGrowth' className='size-full object-cover block' />
            </div>
            <Typography.Title heading={3} className='text-22px font-700 text-t-primary m-0 mb-6px'>
              {isZh ? 'OpenGrowth' : 'OpenGrowth'}
            </Typography.Title>
            <Typography.Text className='text-13px text-t-secondary mb-14px text-center leading-relaxed'>
              {isZh
                ? '全球全行业 AI 获客工作台 · 基于开源 AionUi 微内核深度构建'
                : 'Global AI Lead-Gen Workbench · Powered by AionUi Micro-Kernel'}
            </Typography.Text>
            <div className='flex items-center justify-center gap-8px mb-18px'>
              <span className='px-10px py-4px rd-8px text-12px bg-fill-2 text-t-primary font-600'>
                v{__APP_VERSION__} · Apache-2.0
              </span>
              <div
                className='text-t-primary cursor-pointer hover:text-[#4F46E5] transition-colors p-6px rd-8px hover:bg-fill-2 flex items-center'
                onClick={() =>
                  openLink(repoUrl).catch((error) =>
                    console.error('Failed to open link:', error)
                  )
                }
              >
                <Github theme='outline' size='18' />
              </div>
            </div>

            {/* Check Update Section */}
            {isElectron && (
              <div className='flex flex-col items-center gap-12px w-full max-w-320px bg-fill-2 p-16px rd-12px'>
                <Button
                  type='primary'
                  long
                  loading={checking || updateReadyState.preparing}
                  disabled={updateReadyState.preparing}
                  onClick={() => void checkUpdate()}
                  style={{
                    height: 36,
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: '#4F46E5',
                    boxShadow: 'none',
                    fontWeight: 500,
                    fontSize: 13,
                  }}
                >
                  {updateReadyState.preparing
                    ? t('update.preparingInstall')
                    : updateReadyState.ready
                      ? t('settings.updateReadyInstall', { version: updateReadyState.version })
                      : checking
                        ? t('settings.checkingForUpdates')
                        : t('settings.checkForUpdates')}
                </Button>
                <div className='flex items-center justify-between w-full'>
                  <Typography.Text className='text-12px text-t-secondary'>
                    {t('settings.includePrereleaseUpdates')}
                  </Typography.Text>
                  <Switch size='small' checked={includePrerelease} onChange={handlePrereleaseChange} />
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <Divider className='my-16px' />

          {/* Links Section */}
          <div className='flex flex-col gap-4px pt-8px'>
            {linkItems.map((item, index) => (
              <div
                key={index}
                className='flex items-center justify-between px-16px py-12px rd-8px hover:bg-fill-2 transition-all cursor-pointer group'
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if ('url' in item) {
                    openLink(item.url).catch((error) => console.error('Failed to open link:', error));
                  } else {
                    item.onClick();
                  }
                }}
              >
                <Typography.Text className='text-14px text-t-primary'>{item.title}</Typography.Text>
                <div className='text-t-secondary group-hover:text-t-primary transition-colors'>{item.icon}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <FeedbackReportModal visible={showFeedbackModal} onCancel={() => setShowFeedbackModal(false)} />
    </div>
  );
};

export default AboutModalContent;
