import { expect, it } from 'vitest';
import { crawlerProspects, mergeProspects } from '../../../vendor/aionui/packages/desktop/src/renderer/pages/biaomai/prospect-import';

it('imports directory companies once and preserves sent and replied states on reimport', () => {
  const org = { '@type': 'Organization', name: 'Acme', url: '/acme' };
  const html = '<script type="application/ld+json">' + JSON.stringify({ '@graph': [org, org] }) + '</script>';
  const rows = crawlerProspects({ results: [{ html }, { success: false, html }] }, 'https://example.org/', 'Retail', 'Canada');
  expect(rows).toHaveLength(1);
  expect(rows[0].website).toBe('https://example.org/acme');
  const existing = { ...rows[0], id: 'stable', replied: true, outreachSent: true };
  expect(mergeProspects([existing], [{ ...rows[0], email: 'sales@example.org' }])).toEqual([{ ...existing, email: 'sales@example.org' }]);
});
