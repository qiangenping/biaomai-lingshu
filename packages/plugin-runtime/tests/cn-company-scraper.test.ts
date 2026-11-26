import { describe, expect, it } from 'vitest';
import { extractCnContactsFromText } from '../../../vendor/aionui/packages/desktop/src/process/bridge/cnCompanyScraper.js';

describe('CN Company Contact Extractor (ported from biaomai-operation)', () => {
  it('extracts Chinese mobile, 400 hotline, landline, and email while blocking self-contacts', () => {
    const sampleHtml = `
      <div>
        <script>var a = "13800138000";</script>
        <p>联系我们：张经理 13912345678，全国热线 400-888-9900，座机 0531-88997766</p>
        <p>商务邮箱：sales@biaomai-demo.cn，勿扰自用：self@company.com，噪音客服：4000000360</p>
      </div>
    `;
    const res = extractCnContactsFromText(sampleHtml, ['self@company.com'], ['13800138000']);
    expect(res.phones).toContain('13912345678');
    expect(res.phones).toContain('400-888-9900');
    expect(res.phones).toContain('0531-88997766');
    expect(res.phones).not.toContain('4000000360');
    expect(res.emails).toEqual(['sales@biaomai-demo.cn']);
  });
});
