/**
 * @license
 * Copyright 2026 OpenGrowth Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import dns from 'node:dns/promises';
import net from 'node:net';

const EXCLUDED_DOMAINS = new Set([
  'so.com',
  'qihoo.com',
  '360.cn',
  '360.com',
  'baidu.com',
  'zhidao.baidu.com',
  'baike.baidu.com',
  'tieba.baidu.com',
  'map.baidu.com',
  'aiqicha.baidu.com',
  'tianyancha.com',
  'qcc.com',
  'qixin.com',
  'shuidi.cn',
  'zhihu.com',
  'bilibili.com',
  'douyin.com',
  'weibo.com',
  'qq.com',
  '163.com',
  '11467.com',
  'b2b168.com',
  'huangye88.com',
  '58.com',
  'gov.cn',
  'ccgp.gov.cn',
]);

const NOISE_PHONES = new Set(['4000000360', '4006693600', '10086', '10010', '10000']);

const HEADERS_PC = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
};

const HEADERS_MOBILE = {
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
};

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts[0] === 10 || parts[0] === 127 || parts[0] === 0) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    return false;
  }
  return ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80');
}

export async function isPublicHttpUrl(rawUrl: string): Promise<boolean> {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    if (!u.hostname || u.username || u.password) return false;
    const res = await dns.lookup(u.hostname, { all: true });
    return res.length > 0 && res.every((r) => !isPrivateIp(r.address));
  } catch {
    return false;
  }
}

export function extractCnContactsFromText(
  rawText: string,
  excludeEmails: string[] = [],
  excludePhones: string[] = []
): { phones: string[]; emails: string[] } {
  const clean = rawText
    .replace(/<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ');

  const blockedEmails = new Set(excludeEmails.map((e) => e.trim().toLowerCase()).filter(Boolean));
  const blockedPhones = new Set([...NOISE_PHONES, ...excludePhones.map((p) => p.replace(/\D/g, ''))]);

  const mobiles = clean.match(/(?<!\d)1[3-9]\d{9}(?!\d)/g) || [];
  const hotlines = clean.match(/(?<!\d)(?:400|800)[-\s]?\d{3,4}[-\s]?\d{3,4}(?!\d)/g) || [];
  const landlines = clean.match(/(?<!\d)0\d{2,3}[-\s]?\d{7,8}(?!\d)/g) || [];

  const phoneSet = new Set<string>();
  for (const p of [...mobiles, ...hotlines, ...landlines]) {
    const digits = p.replace(/\D/g, '');
    if (blockedPhones.has(digits)) continue;
    phoneSet.add(p.trim());
  }

  const rawEmails = clean.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];
  const emailSet = new Set<string>();
  for (const e of rawEmails) {
    const lower = e.toLowerCase();
    if (blockedEmails.has(lower)) continue;
    if (/\.(png|jpg|jpeg|gif|svg|webp|css|js)$/i.test(lower)) continue;
    if (/(example\.com|sentry\.io|w3\.org|so\.com|baidu\.com)/i.test(lower)) continue;
    emailSet.add(e);
  }

  return { phones: Array.from(phoneSet).slice(0, 6), emails: Array.from(emailSet).slice(0, 5) };
}

function isExcludedDomain(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  for (const d of EXCLUDED_DOMAINS) {
    if (lower === d || lower.endsWith(`.${d}`)) return true;
  }
  return false;
}

export async function lookupCnCompany(
  companyName: string,
  excludeEmails: string[] = [],
  excludePhones: string[] = []
): Promise<{
  ok: boolean;
  companyName: string;
  website: string;
  phones: string[];
  emails: string[];
  source: string;
  error?: string;
}> {
  const name = companyName.trim();
  if (!name) {
    return { ok: false, companyName: '', website: '', phones: [], emails: [], source: '', error: '公司名称不能为空' };
  }

  let website = '';
  const allPhones = new Set<string>();
  const allEmails = new Set<string>();
  const sources: string[] = [];

  // 1. 360 Search (so.com) for official website + public snippet contacts
  try {
    const soUrl = `https://www.so.com/s?q=${encodeURIComponent(name)}`;
    const res = await fetch(soUrl, { headers: HEADERS_PC, signal: AbortSignal.timeout(7000) });
    if (res.ok) {
      const html = await res.text();
      sources.push('360搜索');
      const contacts = extractCnContactsFromText(html, excludeEmails, excludePhones);
      contacts.phones.forEach((p) => allPhones.add(p));
      contacts.emails.forEach((e) => allEmails.add(e));

      const citeMatches = html.match(/<cite[^>]*>([^<]+)<\/cite>/gi) || [];
      for (const cite of citeMatches) {
        const text = cite.replace(/<[^>]+>/g, '').trim().split(/\s+/)[0];
        const candidate = /^https?:\/\//i.test(text) ? text : `https://${text}`;
        try {
          const u = new URL(candidate);
          if (!isExcludedDomain(u.hostname) && u.hostname.includes('.')) {
            website = `${u.protocol}//${u.hostname}`;
            break;
          }
        } catch {
          // ignore malformed cite
        }
      }
    }
  } catch {
    // continue to next source
  }

  // 2. Baidu Mobile (m.baidu.com) for Aiqicha / business card snippets
  try {
    const bdUrl = `https://m.baidu.com/s?word=${encodeURIComponent(`${name} 联系方式 官网`)}`;
    const res = await fetch(bdUrl, { headers: HEADERS_MOBILE, signal: AbortSignal.timeout(7000) });
    if (res.ok) {
      const html = await res.text();
      sources.push('百度移动端');
      const contacts = extractCnContactsFromText(html, excludeEmails, excludePhones);
      contacts.phones.forEach((p) => allPhones.add(p));
      contacts.emails.forEach((e) => allEmails.add(e));
    }
  } catch {
    // continue
  }

  // 3. Official Website Deep Probe (/, /contact, /about, /lxwm) with SSRF guard
  if (website && (await isPublicHttpUrl(website))) {
    const probePaths = [website, `${website}/contact`, `${website}/about`, `${website}/lxwm`];
    for (const target of probePaths) {
      if (allPhones.size >= 3 && allEmails.size >= 2) break;
      try {
        const res = await fetch(target, { headers: HEADERS_PC, signal: AbortSignal.timeout(6000) });
        if (!res.ok) continue;
        const html = await res.text();
        sources.push('企业官网');
        const contacts = extractCnContactsFromText(html, excludeEmails, excludePhones);
        contacts.phones.forEach((p) => allPhones.add(p));
        contacts.emails.forEach((e) => allEmails.add(e));
      } catch {
        // ignore subpage failure
      }
    }
  }

  return {
    ok: true,
    companyName: name,
    website,
    phones: Array.from(allPhones).slice(0, 6),
    emails: Array.from(allEmails).slice(0, 5),
    source: Array.from(new Set(sources)).join(' + ') || '本地探测',
  };
}
