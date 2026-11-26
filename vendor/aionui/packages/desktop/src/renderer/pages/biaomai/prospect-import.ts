import type { GlobalProspect } from './types';

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function field(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}
function website(value: unknown, base: string) {
  if (!field(value)) return '';
  try {
    const url = new URL(field(value), base);
    return /^https?:$/.test(url.protocol) ? url.href : '';
  } catch { return ''; }
}

// Accept explicit company rows and schema.org entities. Generic navigation links
// and directory page titles do not identify a prospective customer.
export function crawlerProspects(data: unknown, source: string, industry: string, country: string) {
  const rows: GlobalProspect[] = [];
  function visit(value: unknown, page: string, structured: boolean) {
    if (Array.isArray(value)) {
      value.forEach(item => visit(item, page, structured));
      return;
    }
    if (!record(value)) return;
    const types = [value['@type']].flat();
    const companyName = field(value.companyName) || field(value.name);
    if (companyName && (structured || types.some(t => ['Organization', 'Corporation', 'LocalBusiness', 'Store', 'ProfessionalService'].includes(String(t))))) {
      rows.push({ id: crypto.randomUUID(), companyName, industry, country,
        website: website(value.website || value.url, page), email: field(value.email).replace(/^mailto:/i, ''),
        phone: field(value.phone || value.telephone), snippet: field(value.description), sourceUrl: page });
    }
    for (const key of ['@graph', 'itemListElement', 'item', 'mainEntity']) {
      if (value[key]) visit(value[key], page, false);
    }
  }
  if (!record(data)) return rows;
  for (const page of Array.isArray(data.results) ? data.results : [data]) {
    if (!record(page) || page.success === false) continue;
    const url = website(page.url, source) || source;
    const parse = (raw: string, structured: boolean) => {
      try { visit(JSON.parse(raw), url, structured); } catch { /* Ignore malformed source metadata. */ }
    };
    if (typeof page.extracted_content === 'string') parse(page.extracted_content, true);
    else visit(page.extracted_content, url, true);
    for (const script of field(page.html).matchAll(/<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi)) parse(script[1], false);
  }
  return mergeProspects([], rows);
}

export function mergeProspects(previous: GlobalProspect[], incoming: GlobalProspect[]) {
  const key = (p: GlobalProspect) => JSON.stringify([p.country, p.companyName].map(v => v.trim().normalize('NFKC').toLowerCase()));
  const byCompany = new Map(previous.map(p => [key(p), p]));
  const added: string[] = [];
  for (const p of incoming) {
    const id = key(p);
    const existing = byCompany.get(id);
    if (!existing) added.push(id);
    byCompany.set(id, existing ? { ...existing, website: existing.website || p.website,
      phone: existing.phone || p.phone, email: existing.email || p.email } : p);
  }
  return [...added.map(id => byCompany.get(id)!), ...previous.map(p => byCompany.get(key(p))!)];
}
