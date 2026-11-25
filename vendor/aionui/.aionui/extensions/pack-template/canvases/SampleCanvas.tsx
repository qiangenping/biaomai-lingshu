import React from 'react';
import type { Locale } from '@biaomai/plugin-sdk';

export interface SampleCanvasProps {
  locale: Locale;
}

export const SampleCanvas: React.FC<SampleCanvasProps> = ({ locale }) => {
  const isZh = locale === 'zh-CN';
  return (
    <div className="bm-canvas-body">
      <div className="bm-card">
        <h3>{isZh ? '自定义行业包示例画布' : 'Custom Industry Pack Sample Canvas'}</h3>
        <p className="bm-muted">
          {isZh
            ? '此画布通过 CanvasRegistry 动态挂载。复制 packs/pack-template 即可 5 分钟扩展本地办公、招投标审标或企业 ERP/CRM 画布，微内核零改动。'
            : 'Mounted dynamically via CanvasRegistry. Duplicate packs/pack-template to build Local Office, Bidding Review, or ERP/CRM canvases in 5 minutes with zero micro-kernel edits.'}
        </p>
      </div>
    </div>
  );
};
