# Complete Operator Manual

## 1. Studio Navigation (6-Step Omni-Channel Funnel)

| Tab | Module | Core Capabilities |
| :--- | :--- | :--- |
| **01 Create Studio** | AI Content & Video | Platform-tailored copywriting, multilingual localization (`zh-CN`, `en-US`, `ja-JP`, `es-ES`), AI cover visuals, AI short-video/dubbing progress tracking, and realistic mobile preview. |
| **02 Omni-Publish** | 17-Channel Matrix | Isolated Chromium containers (`persist:bm-acc-*`) across 9 CN + 8 Global channels, schedule queue, and Human-in-the-Loop publish confirmation. |
| **03 Intent Radar** | Social Browser Radar | Extract live visible comments (`pii-sanitizer` strips phones/emails/WeChat IDs), extract competitor post formulas (`extractBrowserPageFormula`), LLM semantic reranking, and prefill replies (stops before Send). |
| **04 Global Outbound** | B2B & Foreign Trade | Launch Google Maps, LinkedIn, Thomasnet, Europages, Alibaba, or local `Crawl4AI` → extract real companies → enrich public emails & DNS MX verify → draft 3-step Day 1/4/9 sequences → confirm & send via SMTP → detect replies via IMAP → prefill WhatsApp/LinkedIn DMs. |
| **05 Lead CRM** | Funnel & ROI | 5-stage pipeline (`New → Engaged → Qualified → Opportunity → Won`), CSV export, short-link click sync, and one-click "Re-spin Post" back to Create Studio. |
| **06 Packs Market** | `.bmpack` Micro-Kernel | Hot-install/uninstall local `.bmpack` industry packs with Apache-2.0/MIT license enforcement and declarative permission badges. |

## 2. Human-in-the-Loop & Privacy Guarantees
- **Zero Hidden Scraping**: Browser extractors only inspect visible DOM elements inside the isolated window you opened.
- **Stop-Before-Send**: Social comment replies, WhatsApp/LinkedIn DMs, and SMTP cold emails all require explicit human confirmation before dispatch.
- **Mandatory PII Redaction**: `pii-sanitizer` strips phone numbers, email addresses, WeChat IDs, and URLs before social comment scoring.

## 3. 24/7 Cron & Feishu / WeCom / DingTalk Alerts
Click **⏱️ Cron & IM** in the studio header to enable daily digests, trigger immediate IMAP reply checks (automatically halting follow-up sequences when a prospect replies), and push summary cards to your configured IM Webhook.
