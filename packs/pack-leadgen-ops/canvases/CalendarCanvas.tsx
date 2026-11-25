import React, { useState } from 'react';
import type { Locale, RegionProfile } from '@biaomai/plugin-sdk';

export type CalendarPostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'auth_expired';

export interface ScheduledPostItem {
  id: string;
  title: string;
  platformId: string;
  scheduledAt: string;
  status: CalendarPostStatus;
  shortLinkId: string;
}

export interface CalendarCanvasProps {
  locale: Locale;
  profile: RegionProfile;
  posts: ScheduledPostItem[];
  onRequestPublishApproval: (post: ScheduledPostItem) => void;
}

const STATUS_LABELS: Record<CalendarPostStatus, Record<Locale, string>> = {
  draft: { 'zh-CN': '草稿', 'en-US': 'Draft' },
  scheduled: { 'zh-CN': '已排期', 'en-US': 'Scheduled' },
  publishing: { 'zh-CN': '发布中', 'en-US': 'Publishing' },
  published: { 'zh-CN': '已发布', 'en-US': 'Published' },
  auth_expired: { 'zh-CN': '授权过期', 'en-US': 'Auth Expired' },
};

export const CalendarCanvas: React.FC<CalendarCanvasProps> = ({
  locale,
  profile,
  posts,
  onRequestPublishApproval,
}) => {
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const isZh = locale === 'zh-CN';

  const visiblePosts =
    filterPlatform === 'all' ? posts : posts.filter((p) => p.platformId === filterPlatform);

  return (
    <div className="bm-canvas-body">
      <div className="bm-canvas-toolbar">
        <div className="bm-pill-group">
          <button
            type="button"
            className={`bm-chip ${filterPlatform === 'all' ? 'bm-chip-active' : ''}`}
            onClick={() => setFilterPlatform('all')}
          >
            {isZh ? `全部渠道 (${profile.platforms.length})` : `All Channels (${profile.platforms.length})`}
          </button>
          {profile.platforms.slice(0, 4).map((p) => (
            <button
              key={p.id}
              type="button"
              className={`bm-chip ${filterPlatform === p.id ? 'bm-chip-active' : ''}`}
              onClick={() => setFilterPlatform(p.id)}
            >
              {p.name[locale]}
            </button>
          ))}
        </div>

        <div className="bm-pill-group">
          <button
            type="button"
            className={`bm-chip ${viewMode === 'week' ? 'bm-chip-active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            {isZh ? '周视图' : 'Week'}
          </button>
          <button
            type="button"
            className={`bm-chip ${viewMode === 'month' ? 'bm-chip-active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            {isZh ? '月视图' : 'Month'}
          </button>
        </div>
      </div>

      <div className="bm-calendar-list">
        {visiblePosts.map((post) => {
          const plat = profile.platforms.find((p) => p.id === post.platformId);
          return (
            <div key={post.id} className="bm-card bm-calendar-item">
              <div className="bm-card-header">
                <span className="bm-badge bm-badge-info">{plat ? plat.name[locale] : post.platformId}</span>
                <span className={`bm-badge bm-status-${post.status}`}>{STATUS_LABELS[post.status][locale]}</span>
              </div>
              <div className="bm-card-title">{post.title}</div>
              <div className="bm-card-meta">
                <span className="bm-mono">{post.scheduledAt}</span>
                <span className="bm-mono">UTM: {post.shortLinkId}</span>
              </div>
              {post.status !== 'published' && (
                <div className="bm-card-actions">
                  <button
                    type="button"
                    className="bm-btn-primary"
                    onClick={() => onRequestPublishApproval(post)}
                  >
                    {isZh ? '提交人工确认发布' : 'Request Human Publish Approval'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
