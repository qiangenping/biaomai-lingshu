<p align="center">
  <strong>English</strong> | <a href="./README.zh-CN.md">简体中文</a>
</p>

# BiaoMai Lingshu (`biaomai-operations-platform`)

> **Open-Source Global Lead-Gen & Extensible AI Desktop Workbench**
> Built on a 100% **Apache-2.0 / MIT** micro-kernel (`AionUi` + `.bmpack` hot-pluggable industry packs). Zero Docker required for local desktop use. Combines **Inbound Omni-Media Growth (17 Global & CN Channels)** with **Outbound Global B2B & Foreign-Trade Prospecting (Google Maps / LinkedIn / Directories + DNS MX Verify + Multilingual Cold Email & WhatsApp Sequences + IMAP Reply Auto-Stop)**.

[![License](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](./LICENSE)
[![i18n](https://img.shields.io/badge/i18n-English%20%7C%20%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-indigo.svg)](./README.zh-CN.md)
[![Zero-Docker](https://img.shields.io/badge/Desktop-Zero--Docker%20Local-emerald.svg)](./docs/en/QUICKSTART.md)
[![CI](https://img.shields.io/badge/CI-6%20Quality%20Gates-success.svg)](./.github/workflows/ci.yml)

---

## Core Capabilities

### 1. Inbound: Omni-Media Content & 17-Channel Matrix (`pack-leadgen-ops`)
- **AI Content Studio**: Multi-platform copywriting, multilingual localization (`zh-CN`, `en-US`, `ja-JP`, `es-ES`), AI cover visual generation, and AI short-video / dubbing task tracking via optional `AiToEarn` MCP.
- **17 Global & CN Channels**: Isolated Chromium cookie partitions (`persist:bm-acc-*`) for RedNote, Douyin, WeChat Channels, Bilibili, Kuaishou, WeChat OA, Weibo, Zhihu, Baijiahao, TikTok, YouTube, LinkedIn, X, Instagram, Facebook, Threads, and Pinterest.
- **Live Intent Radar & Competitor Formula**: Extract live visible comments and competitor post structures directly from the embedded isolated browser, strip PII via `pii-sanitizer`, score `S/A/B/C` buyer intent, and prefill replies (strictly stopping before Send).

### 2. Outbound: Global B2B & Foreign-Trade Prospector (`pack-global-b2b-outbound`)
- **Multi-Directory Discovery**: Launch isolated browser search across **Google Maps, LinkedIn, Thomasnet, Europages, Alibaba**, or connect optional local **`Crawl4AI` (Apache-2.0)** for batch scraping.
- **Website Enrichment & DNS MX Verification**: Automatically crawl company `/contact` & `/about` pages for public emails, phones, WhatsApp links, and verify email deliverability via real `dns.resolveMx`.
- **3-Step Multilingual Cold Email & WhatsApp Sequences**: Generate Day 1 / Day 4 / Day 9 outreach sequences, send via zero-dependency **TLS/STARTTLS SMTP** (with mandatory Human-in-the-Loop confirmation), prefill WhatsApp/LinkedIn DMs, and auto-stop follow-ups via **TLS IMAP reply detection**.

### 3. Unified Local CRM, 24/7 Cron & Hot-Pluggable `.bmpack` Micro-Kernel
- **Atomic Main-Process Persistence**: All accounts, posts, prospects, and 5-stage CRM leads (`New → Engaged → Qualified → Opportunity → Won`) persist locally in `userData/biaomai-studio-db.json` with CSV export and ROI attribution.
- **Cron & IM Approval Center**: Push daily digests and approval alerts to **Feishu / WeCom / DingTalk** webhooks.
- **Official `.bmpack` Industry Packs**:
  - `packs/pack-leadgen-ops` — Global Omni-Media Inbound Lead-Gen
  - `packs/pack-global-b2b-outbound` — Global B2B & Foreign-Trade Outbound
  - `packs/pack-crossborder-ecom` — Cross-Border E-Commerce & Influencer Outreach
  - `packs/pack-tob-bidding` — Enterprise ToB Bidding & Tender Intelligence

---

## Quick Start (Zero-Docker Desktop)

**Prerequisites**: Node.js `>= 22`, pnpm `>= 9`, and Bun (for AionUi desktop build).

```bash
git clone https://github.com/<org>/biaomai-operations-platform.git
cd biaomai-operations-platform
pnpm install
pnpm verify:all     # Runs all 6 quality, i18n, license, pack, typecheck & unit test gates
pnpm dev:aionui     # Launches the Zero-Docker Electron Desktop Workbench
```

Optional self-hosted AiToEarn backend via Docker:
```bash
pnpm docker:up
```

---

## Documentation

- [5-Minute Quickstart](./docs/en/QUICKSTART.md)
- [Complete Operator Manual](./docs/en/USER_MANUAL.md)
- [Self-Hosted & Cloud Deployment](./docs/en/DEPLOYMENT.md)
- [Architecture Overview](./docs/en/ARCHITECTURE.md)
- [Plugin SDK & `.bmpack` Guide](./docs/en/PLUGIN_SDK_GUIDE.md)
- [Security Policy](./SECURITY.md) | [Privacy & Compliance](./PRIVACY_AND_COMPLIANCE.md) | [Contributing](./CONTRIBUTING.md)

---

## License & Upstream Attributions

Licensed under the **[Apache License 2.0](./LICENSE)**. All dependencies are strictly audited by `pnpm verify:licenses` to remain **Apache-2.0 / MIT** clean (no GPL/AGPL). See [NOTICE](./NOTICE) and [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
