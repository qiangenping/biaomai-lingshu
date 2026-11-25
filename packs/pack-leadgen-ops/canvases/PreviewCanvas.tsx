import React, { useState } from 'react';
import type { Locale, RegionProfile } from '@biaomai/plugin-sdk';

export interface DraftPreviewData {
  id: string;
  platformId: string;
  title: string;
  body: string;
  hashtags: string[];
  ctaHook: string;
  shortLinkUrl: string;
  aspect: string;
}

export interface PreviewCanvasProps {
  locale: Locale;
  profile: RegionProfile;
  draft: DraftPreviewData;
  onDraftChange: (next: DraftPreviewData) => void;
  onAddToCalendar: (draft: DraftPreviewData) => void;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  locale,
  profile,
  draft,
  onDraftChange,
  onAddToCalendar,
}) => {
  const [regenerating, setRegenerating] = useState(false);
  const isZh = locale === 'zh-CN';

  const handleRegenerateVisual = () => {
    setRegenerating(true);
    setTimeout(() => setRegenerating(false), 400);
  };

  const activePlatform =
    profile.platforms.find((p) => p.id === draft.platformId) ?? profile.platforms[0];

  return (
    <div className="bm-canvas-body">
      <div className="bm-canvas-toolbar">
        <div className="bm-pill-group">
          {profile.platforms.slice(0, 5).map((p) => (
            <button
              key={p.id}
              type="button"
              className={`bm-chip ${draft.platformId === p.id ? 'bm-chip-active' : ''}`}
              onClick={() => onDraftChange({ ...draft, platformId: p.id, aspect: p.aspect })}
            >
              {p.name[locale]} · {p.aspect}
            </button>
          ))}
        </div>
      </div>

      <div className="bm-phone-stage">
        <div className="bm-phone-frame">
          <div className="bm-phone-status">
            <span>{activePlatform ? activePlatform.name[locale] : draft.platformId}</span>
            <span className="bm-mono">{draft.aspect}</span>
          </div>

          <div className="bm-phone-media">
            <div className="bm-media-placeholder">
              <span>{regenerating ? (isZh ? 'AI 重绘中...' : 'Regenerating...') : (isZh ? '多模态获客封面 / 视频帧' : 'AI Lead-Gen Visual / Video Frame')}</span>
              <button type="button" className="bm-btn-ghost" onClick={handleRegenerateVisual}>
                {isZh ? '✨ 重绘此图' : '✨ Regenerate Visual'}
              </button>
            </div>
          </div>

          <div className="bm-phone-editor">
            <label className="bm-field-label">{isZh ? '获客标题' : 'Lead-Gen Headline'}</label>
            <input
              className="bm-input"
              value={draft.title}
              onChange={(e) => onDraftChange({ ...draft, title: e.target.value })}
            />

            <label className="bm-field-label">{isZh ? '正文与痛点钩子' : 'Body & Pain-Point Hook'}</label>
            <textarea
              className="bm-textarea"
              rows={4}
              value={draft.body}
              onChange={(e) => onDraftChange({ ...draft, body: e.target.value })}
            />

            <div className="bm-cta-box">
              <span className="bm-badge bm-badge-info">CTA + UTM</span>
              <span className="bm-mono">{draft.ctaHook} · {draft.shortLinkUrl}</span>
            </div>

            <div className="bm-tag-row">
              {draft.hashtags.map((tag) => (
                <span key={tag} className="bm-tag">#{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bm-canvas-footer">
        <span className="bm-muted">
          {isZh ? '由 aitoearn-ai 多模态引擎与 short-link 归因驱动' : 'Powered by aitoearn-ai multimodal engine & short-link attribution'}
        </span>
        <button
          type="button"
          className="bm-btn-primary"
          onClick={() => onAddToCalendar(draft)}
        >
          {isZh ? '加入排期日历 →' : 'Add to Calendar →'}
        </button>
      </div>
    </div>
  );
};
