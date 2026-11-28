/**
 * @license
 * Copyright 2026 OpenGrowth Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tooltip } from '@arco-design/web-react';
import {
  IconApps,
  IconCompass,
  IconDesktop,
  IconDown,
  IconEdit,
  IconRight,
  IconSearch,
  IconSend,
  IconUserGroup,
} from '@arco-design/web-react/icon';
import { Rocket } from '@icon-park/react';
import classNames from 'classnames';
import type { SiderTooltipProps } from '@renderer/utils/ui/siderTooltip';

interface SiderLeadGenEntryProps {
  isMobile: boolean;
  isActive: boolean;
  collapsed: boolean;
  siderTooltipProps: SiderTooltipProps;
  onClick: () => void;
}

const SiderLeadGenEntry: React.FC<SiderLeadGenEntryProps> = ({
  isMobile,
  isActive,
  collapsed,
  siderTooltipProps,
  onClick,
}) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isZh = (i18n.language || 'zh-CN').startsWith('zh');
  const label = isZh ? '全球获客工作台' : 'Lead-Gen Studio';
  const [expanded, setExpanded] = useState(true);

  const currentTab = new URLSearchParams(location.search).get('tab') || 'create';

  const subItems = [
    { id: 'create', label: isZh ? '内容创作' : 'Create Studio', icon: <IconEdit /> },
    { id: 'publish', label: isZh ? '渠道分发' : 'Omni-Publish', icon: <IconSend /> },
    { id: 'browser', label: isZh ? 'AI 浏览器' : 'AI Browser', icon: <IconDesktop /> },
    { id: 'engage', label: isZh ? '社媒雷达' : 'Intent Radar', icon: <IconSearch /> },
    { id: 'outbound', label: isZh ? '企业寻客' : 'Global & CN B2B', icon: <IconCompass /> },
    { id: 'crm', label: isZh ? '线索 CRM' : 'Lead CRM', icon: <IconUserGroup /> },
    { id: 'packs', label: isZh ? '行业插件' : 'Packs Market', icon: <IconApps /> },
  ];

  if (collapsed) {
    return (
      <Tooltip {...siderTooltipProps} content={label} position='right'>
        <div
          className={classNames(
            'w-full h-34px flex items-center justify-center cursor-pointer transition-colors rd-8px text-t-primary',
            isActive ? 'bg-fill-3' : 'hover:bg-fill-3 active:bg-fill-4'
          )}
          onClick={onClick}
        >
          <Rocket theme='outline' size='20' fill='currentColor' className='block leading-none shrink-0' style={{ lineHeight: 0 }} />
        </div>
      </Tooltip>
    );
  }

  return (
    <div className='flex flex-col gap-2px w-full'>
      <div
        className={classNames(
          'box-border group h-34px w-full flex items-center justify-between ps-10px pe-8px rd-0.5rem cursor-pointer shrink-0 transition-all text-t-primary',
          isMobile && 'sider-action-btn-mobile',
          isActive && !expanded ? 'bg-fill-3' : 'hover:bg-fill-3 active:bg-fill-4'
        )}
        onClick={() => {
          setExpanded((prev) => !prev);
          if (!isActive) onClick();
        }}
      >
        <span className='flex items-center gap-8px min-w-0'>
          <span className='size-22px flex items-center justify-center shrink-0 text-t-primary'>
            <Rocket theme='outline' size='16' fill='currentColor' className='block leading-none' style={{ lineHeight: 0 }} />
          </span>
          <span className='collapsed-hidden text-t-primary text-14px font-[500] leading-24px truncate'>{label}</span>
        </span>
        <span className='text-11px text-t-tertiary flex items-center shrink-0'>
          {expanded ? <IconDown /> : <IconRight />}
        </span>
      </div>

      {expanded && (
        <div className='flex flex-col gap-2px ps-16px pe-4px py-2px'>
          {subItems.map((item) => {
            const activeSub = isActive && currentTab === item.id;
            return (
              <div
                key={item.id}
                onClick={() => void navigate(`/leadgen?tab=${item.id}`)}
                className={classNames(
                  'h-30px px-10px rd-7px cursor-pointer flex items-center gap-8px text-13px transition-colors',
                  activeSub
                    ? 'bg-[rgba(79,70,229,0.1)] text-[#4F46E5] font-600'
                    : 'text-t-secondary hover:bg-fill-2 hover:text-t-primary'
                )}
              >
                <span className='text-14px flex items-center'>{item.icon}</span>
                <span className='truncate'>{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SiderLeadGenEntry;
