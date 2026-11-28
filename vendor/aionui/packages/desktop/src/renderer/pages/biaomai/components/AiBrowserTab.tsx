/**
 * @license
 * Copyright 2026 OpenGrowth Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Input, Message, Select, Tag } from '@arco-design/web-react';
import {
  IconArrowLeft,
  IconArrowRight,
  IconCompass,
  IconEdit,
  IconLaunch,
  IconRefresh,
  IconSearch,
  IconSend,
} from '@arco-design/web-react/icon';
import {
  type AnalyzedComment,
  type GlobalProspect,
  type LocalAccount,
  type LocalPost,
  sanitizePii,
  scoreComment,
} from '../types';

interface WebviewLike extends HTMLElement {
  src: string;
  partition: string;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  getURL: () => string;
  getTitle: () => string;
  executeJavaScript: (code: string) => Promise<unknown>;
}

interface AiBrowserTabProps {
  isZh: boolean;
  browserUrl: string;
  setBrowserUrl: (v: string) => void;
  browserPartition: string;
  setBrowserPartition: (v: string) => void;
  accounts: LocalAccount[];
  latestDraft: { title: string; body: string } | null;
  latestPost: LocalPost | null;
  onOpenExternalWindow: (partition: string, url: string, label: string) => void;
  onExtractedComments: (comments: AnalyzedComment[], sourceUrl: string) => void;
  onExtractedFormula: (formula: { title: string; url: string; excerpt: string }) => void;
  onExtractedProspects: (prospects: GlobalProspect[]) => void;
  onMarkPostPublished?: (postId: string) => void;
}

const BOOKMARKS = [
  { labelZh: '小红书创作', labelEn: 'RedNote', url: 'https://creator.xiaohongshu.com/', partition: 'persist:bm-acc-xiaohongshu-default' },
  { labelZh: '小红书发现', labelEn: 'XHS Explore', url: 'https://www.xiaohongshu.com/explore', partition: 'persist:bm-acc-xiaohongshu-default' },
  { labelZh: '抖音创作', labelEn: 'Douyin', url: 'https://creator.douyin.com/', partition: 'persist:bm-acc-douyin-default' },
  { labelZh: '知乎创作', labelEn: 'Zhihu', url: 'https://www.zhihu.com/creator', partition: 'persist:bm-acc-zhihu-default' },
  { labelZh: '高德地图', labelEn: 'Amap', url: 'https://www.amap.com/', partition: 'persist:bm-b2b-global-radar' },
  { labelZh: '百度地图', labelEn: 'Baidu Map', url: 'https://map.baidu.com/', partition: 'persist:bm-b2b-global-radar' },
  { labelZh: 'Google Maps', labelEn: 'Google Maps', url: 'https://www.google.com/maps', partition: 'persist:bm-b2b-global-radar' },
  { labelZh: 'LinkedIn', labelEn: 'LinkedIn', url: 'https://www.linkedin.com/feed/', partition: 'persist:bm-b2b-global-radar' },
];

export const AiBrowserTab: React.FC<AiBrowserTabProps> = ({
  isZh,
  browserUrl,
  setBrowserUrl,
  browserPartition,
  setBrowserPartition,
  accounts,
  latestDraft,
  latestPost,
  onOpenExternalWindow,
  onExtractedComments,
  onExtractedFormula,
  onExtractedProspects,
  onMarkPostPublished,
}) => {
  const webviewRef = useRef<WebviewLike | null>(null);
  const [urlInput, setUrlInput] = useState(browserUrl);
  const [currentTitle, setCurrentTitle] = useState('');
  const [busyAction, setBusyAction] = useState<string>('');
  const [lastResultMsg, setLastResultMsg] = useState<string>('');
  const [customReply, setCustomReply] = useState('');

  useEffect(() => {
    setUrlInput(browserUrl);
  }, [browserUrl]);

  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;
    const onNav = () => {
      try {
        const u = wv.getURL();
        if (u) setUrlInput(u);
        setCurrentTitle(wv.getTitle() || '');
      } catch {
        // ignore before dom-ready
      }
    };
    wv.addEventListener('did-navigate', onNav);
    wv.addEventListener('did-navigate-in-page', onNav);
    wv.addEventListener('dom-ready', onNav);
    return () => {
      wv.removeEventListener('did-navigate', onNav);
      wv.removeEventListener('did-navigate-in-page', onNav);
      wv.removeEventListener('dom-ready', onNav);
    };
  }, [browserPartition]);

  const navigateTo = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    setBrowserUrl(normalized);
    setUrlInput(normalized);
  };

  const runOnWebview = async <T,>(actionKey: string, script: string): Promise<T | null> => {
    const wv = webviewRef.current;
    if (!wv || typeof wv.executeJavaScript !== 'function') {
      Message.warning(isZh ? '内置 AI 浏览器仅在桌面端可用' : 'Built-in AI Browser requires desktop app');
      return null;
    }
    setBusyAction(actionKey);
    try {
      return (await wv.executeJavaScript(script)) as T;
    } catch (err) {
      Message.error(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setBusyAction('');
    }
  };

  const handleExtractComments = async () => {
    const res = await runOnWebview<{ url: string; comments: Array<{ id: string; author: string; text: string }> }>(
      'comments',
      `(() => {
        const out = [];
        const seen = new Set();
        const pushItem = (author, text, idx) => {
          const clean = (text || '').replace(/\\s+/g, ' ').trim();
          if (clean.length < 3 || clean.length > 280 || seen.has(clean)) return;
          seen.add(clean);
          out.push({ id: 'wv_' + idx + '_' + Date.now(), author: (author || '').trim().slice(0, 40), text: clean });
        };
        const items = Array.from(document.querySelectorAll('.comment-item, [data-e2e="comment-item"], .CommentItemV2, ytd-comment-thread-renderer, .comments-comment-item, .reply-item'));
        for (let i = 0; i < items.length && out.length < 30; i++) {
          const c = items[i];
          const r = c.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const aEl = c.querySelector('.author-wrapper .name, .user-name, [data-e2e="comment-username"], #author-text, .UserLink-link, .comments-post-meta__name-text, a[href*="user"]');
          const tEl = c.querySelector('.content, .note-text, [data-e2e="comment-text"], .CommentContent, #content-text, p');
          pushItem(aEl?.innerText || '', tEl?.innerText || c.innerText || '', i);
        }
        if (out.length === 0) {
          const nodes = Array.from(document.querySelectorAll('[class*="comment"], [data-e2e*="comment"], [class*="reply"], article p, li p'));
          for (let i = 0; i < nodes.length && out.length < 30; i++) {
            const el = nodes[i];
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            pushItem('', el.innerText || '', i);
          }
        }
        return { url: location.href, comments: out };
      })();`
    );
    if (!res || res.comments.length === 0) {
      return Message.warning(isZh ? '当前页面未检测到可见评论，请先打开具体帖子评论区' : 'No visible comments found on this page');
    }
    const analyzed: AnalyzedComment[] = res.comments
      .map((item) => {
        const clean = sanitizePii(item.text);
        return {
          id: item.id,
          author: item.author || undefined,
          sourceUrl: res.url,
          text: clean.text,
          redacted: clean.redacted,
          ...scoreComment(clean.text),
        };
      })
      .sort((a, b) => b.score - a.score);
    onExtractedComments(analyzed, res.url);
    setLastResultMsg(isZh ? `已提取 ${analyzed.length} 条评论并同步至「社媒雷达」` : `Extracted ${analyzed.length} comments`);
  };

  const handleExtractFormula = async () => {
    const res = await runOnWebview<{ url: string; title: string; excerpt: string }>(
      'formula',
      `(() => {
        const h1 = (document.querySelector('h1, [class*="title"]')?.innerText || '').trim();
        const paragraphs = Array.from(document.querySelectorAll('article, main, [class*="desc"], [class*="content"], p'))
          .map((el) => (el.innerText || '').trim())
          .filter((t) => t.length >= 15 && t.length <= 600)
          .slice(0, 6);
        return { url: location.href, title: h1 || document.title || 'Untitled', excerpt: paragraphs.join('\\n') };
      })();`
    );
    if (!res || !res.excerpt) {
      return Message.warning(isZh ? '未提取到足够正文，请打开帖子详情页后重试' : 'No post content extracted');
    }
    onExtractedFormula(res);
    setLastResultMsg(isZh ? `已提取爆款结构「${res.title.slice(0, 18)}」并送入「内容创作」` : 'Extracted formula');
  };

  const handleExtractProspects = async () => {
    const res = await runOnWebview<{ url: string; prospects: Array<{ id: string; companyName: string; website: string; email: string; phone: string; snippet: string; sourceUrl: string }> }>(
      'prospects',
      `(() => {
        const url = location.href;
        const out = [];
        const seen = new Set();
        const emailRe = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}/;
        const phoneRe = /\\+?\\d[\\d\\s\\-().]{6,18}\\d/;
        const cards = Array.from(document.querySelectorAll('[role="article"], li.poibox, .poibox, #cardslist li, .search-item, .poi-item, li.reusable-search__result-container, .entity-result__item, article, .result, .company-card'));
        for (let i = 0; i < cards.length && out.length < 25; i++) {
          const card = cards[i];
          const text = (card.innerText || '').trim();
          if (text.length < 6) continue;
          const lines = text.split('\\n').map(l => l.trim()).filter(Boolean);
          const name = (card.querySelector('h1,h2,h3,h4,.fontHeadlineSmall,a[aria-label]')?.textContent || card.getAttribute('aria-label') || lines[0] || '').trim();
          if (!name || name.length > 100 || seen.has(name.toLowerCase())) continue;
          seen.add(name.toLowerCase());
          const links = Array.from(card.querySelectorAll('a[href]')).map(a => a.href).filter(h => /^https?:\\/\\//i.test(h) && !h.includes('google.com/maps') && !h.includes('linkedin.com/search'));
          const emailMatch = text.match(emailRe);
          const phoneMatch = text.match(phoneRe);
          out.push({ id: 'wv_b2b_' + i + '_' + Date.now(), companyName: name, website: links[0] || '', email: emailMatch ? emailMatch[0] : '', phone: phoneMatch ? phoneMatch[0].trim() : '', snippet: lines.slice(0, 3).join(' · ').slice(0, 180), sourceUrl: url });
        }
        return { url, prospects: out };
      })();`
    );
    if (!res || res.prospects.length === 0) {
      return Message.warning(isZh ? '未检测到结构化商家列表，请先在地图或黄页搜索结果页重试' : 'No company list found');
    }
    const rows: GlobalProspect[] = res.prospects.map((p) => ({
      ...p,
      industry: 'AI Browser',
      country: 'Global',
    }));
    onExtractedProspects(rows);
    setLastResultMsg(isZh ? `已提取 ${rows.length} 家企业并同步至「企业寻客」` : `Extracted ${rows.length} companies`);
  };

  const handlePrefillActivePost = async () => {
    const title = latestPost?.title || latestDraft?.title || '';
    const body = latestPost?.body || latestDraft?.body || customReply.trim();
    if (!title && !body) {
      return Message.warning(isZh ? '暂无可回填草稿，请先在「内容创作」生成内容或在下方输入回复' : 'No draft to fill');
    }
    void navigator.clipboard?.writeText(`${title}\n\n${body}`.trim());
    const filled = await runOnWebview<boolean>(
      'prefill',
      `(() => {
        let ok = false;
        const titleInput = document.querySelector('input[placeholder*="标题"], input[placeholder*="title" i], textarea[placeholder*="标题"]');
        if (titleInput && ${JSON.stringify(title)}) {
          titleInput.focus();
          titleInput.value = ${JSON.stringify(title)};
          titleInput.dispatchEvent(new Event('input', { bubbles: true }));
          ok = true;
        }
        const bodyInput = document.querySelector('[contenteditable="true"], textarea[placeholder*="正文"], textarea[placeholder*="内容"], textarea[placeholder*="评论"], textarea');
        if (bodyInput && bodyInput !== titleInput && ${JSON.stringify(body)}) {
          bodyInput.focus();
          if (bodyInput.isContentEditable) bodyInput.textContent = ${JSON.stringify(body)};
          else bodyInput.value = ${JSON.stringify(body)};
          bodyInput.dispatchEvent(new Event('input', { bubbles: true }));
          bodyInput.style.outline = '2px solid #10B981';
          setTimeout(() => { bodyInput.style.outline = ''; }, 2000);
          ok = true;
        }
        return ok;
      })();`
    );
    if (filled) {
      Message.success(isZh ? '已自动回填至页面编辑框并复制到剪贴板（请人工确认后发布）' : 'Prefilled & copied');
      setLastResultMsg(isZh ? '草稿已回填到当前网页（停在发布键前）' : 'Draft prefilled');
    } else {
      Message.info(isZh ? '已复制草稿到剪贴板，请直接粘贴到页面输入框' : 'Copied draft to clipboard');
      setLastResultMsg(isZh ? '已复制到剪贴板，按 Cmd+V 即可粘贴' : 'Copied to clipboard');
    }
  };

  const partitionOptions = [
    { label: isZh ? '小红书默认隔离区' : 'RedNote Default', value: 'persist:bm-acc-xiaohongshu-default' },
    { label: isZh ? '抖音默认隔离区' : 'Douyin Default', value: 'persist:bm-acc-douyin-default' },
    { label: isZh ? '知乎默认隔离区' : 'Zhihu Default', value: 'persist:bm-acc-zhihu-default' },
    { label: isZh ? 'B2B 寻客隔离区' : 'B2B Radar Default', value: 'persist:bm-b2b-global-radar' },
    ...accounts.map((a) => ({ label: `${a.label} (${a.platformId})`, value: a.partition })),
  ];

  return (
    <div className='flex-1 flex flex-col gap-12px min-h-[calc(100vh-132px)] w-full'>
      {/* Top Browser Toolbar */}
      <div className='p-12px rd-12px bg-1 border border-solid border-[var(--color-border-2)] flex flex-col gap-10px'>
        <div className='flex items-center gap-8px flex-wrap'>
          <Button size='small' type='secondary' icon={<IconArrowLeft />} onClick={() => webviewRef.current?.canGoBack?.() && webviewRef.current.goBack()} />
          <Button size='small' type='secondary' icon={<IconArrowRight />} onClick={() => webviewRef.current?.canGoForward?.() && webviewRef.current.goForward()} />
          <Button size='small' type='secondary' icon={<IconRefresh />} onClick={() => webviewRef.current?.reload?.()} />
          <div className='flex-1 min-w-220px'>
            <Input
              value={urlInput}
              onChange={setUrlInput}
              onPressEnter={() => navigateTo(urlInput)}
              placeholder='https://...'
            />
          </div>
          <Button size='small' type='primary' onClick={() => navigateTo(urlInput)}>
            {isZh ? '访问' : 'Go'}
          </Button>
          <Select
            value={browserPartition}
            onChange={setBrowserPartition}
            style={{ width: 175 }}
            options={partitionOptions}
          />
          <Button
            size='small'
            type='secondary'
            icon={<IconLaunch />}
            onClick={() => onOpenExternalWindow(browserPartition, urlInput || browserUrl, currentTitle || 'AI Browser')}
          >
            {isZh ? '独立窗口' : 'Pop Out'}
          </Button>
        </div>

        <div className='flex items-center gap-6px flex-wrap'>
          {BOOKMARKS.map((bm) => (
            <button
              key={bm.url}
              type='button'
              onClick={() => {
                setBrowserPartition(bm.partition);
                navigateTo(bm.url);
              }}
              className='h-26px px-10px rd-6px border-none bg-fill-2 hover:bg-fill-3 text-12px font-500 text-t-primary cursor-pointer transition-colors'
            >
              {isZh ? bm.labelZh : bm.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split: Embedded Webview + Right AI Copilot */}
      <div className='flex-1 flex flex-col lg:flex-row gap-14px items-stretch min-h-540px w-full'>
        <div className='flex-1 min-w-0 rd-12px overflow-hidden border border-solid border-[var(--color-border-2)] bg-1 flex flex-col'>
          {React.createElement('webview', {
            ref: (el: HTMLElement | null) => {
              webviewRef.current = el as WebviewLike | null;
            },
            src: browserUrl,
            partition: browserPartition,
            allowpopups: 'true',
            style: { width: '100%', height: '100%', minHeight: 540, flex: 1 },
          })}
        </div>

        {/* Right AI Copilot Panel */}
        <div className='w-full lg:w-310px shrink-0 p-16px rd-12px bg-1 border border-solid border-[var(--color-border-2)] flex flex-col gap-12px'>
          <div className='flex items-center justify-between'>
            <span className='text-14px font-700 text-t-primary'>{isZh ? 'AI 浏览器副驾驶' : 'AI Browser Copilot'}</span>
            <Tag size='small' color='green'>{isZh ? '合规隔离' : 'Isolated'}</Tag>
          </div>
          <div className='text-12px text-t-secondary leading-relaxed'>
            {isZh
              ? '在此登录任意社媒、地图或黄页，点击下方按钮即可让 AI 实时读取页面或自动回填草稿（停在发送前）。'
              : 'Log into any social channel or directory here, then extract leads/comments or prefill drafts with one click.'}
          </div>

          <div className='flex flex-col gap-8px'>
            <Button type='primary' long icon={<IconSearch />} loading={busyAction === 'comments'} onClick={() => void handleExtractComments()}>
              {isZh ? '抓取本页评论 → 社媒雷达' : 'Extract Comments → Radar'}
            </Button>
            <Button type='secondary' long icon={<IconEdit />} loading={busyAction === 'formula'} onClick={() => void handleExtractFormula()}>
              {isZh ? '提取竞品爆款 → 内容创作' : 'Extract Formula → Create'}
            </Button>
            <Button type='secondary' long icon={<IconCompass />} loading={busyAction === 'prospects'} onClick={() => void handleExtractProspects()}>
              {isZh ? '提取本页企业 → 企业寻客' : 'Extract Companies → B2B'}
            </Button>
          </div>

          <div className='h-1px bg-[var(--color-border-2)]' />

          <div className='flex flex-col gap-8px'>
            <div className='text-12px font-600 text-t-primary'>
              {isZh ? '草稿回填 / 评论回复（人工确认）' : 'Prefill Draft / Reply'}
            </div>
            {(latestPost || latestDraft?.title) && (
              <div className='p-10px rd-8px bg-2 text-12px text-t-secondary'>
                <div className='font-600 text-t-primary truncate'>{latestPost?.title || latestDraft?.title}</div>
                <div className='truncate mt-2px opacity-80'>{latestPost?.body || latestDraft?.body}</div>
              </div>
            )}
            <Input.TextArea
              rows={2}
              value={customReply}
              onChange={setCustomReply}
              placeholder={isZh ? '或输入临时回复内容，点击下方自动填入...' : 'Or type a reply to prefill...'}
            />
            <Button type='primary' long icon={<IconSend />} loading={busyAction === 'prefill'} onClick={() => void handlePrefillActivePost()}>
              {isZh ? '一键回填到当前页面' : 'Prefill Active Page'}
            </Button>
            {latestPost && latestPost.status !== 'published' && onMarkPostPublished && (
              <Button type='secondary' long onClick={() => onMarkPostPublished(latestPost.id)}>
                {isZh ? '已在平台发出 → 标记已发布' : 'Mark Latest Post Published'}
              </Button>
            )}
          </div>

          {lastResultMsg && (
            <div className='p-10px rd-8px bg-[rgba(79,70,229,0.08)] text-[#4F46E5] text-12px font-500 mt-auto'>
              {lastResultMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
