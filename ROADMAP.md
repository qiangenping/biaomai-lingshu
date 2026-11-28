# OpenGrowth — Global Open-Source Roadmap

> **Mission**: Build the world's #1 open-source, local-first, zero-Docker AI customer acquisition & outbound growth workbench — **built by global developers, for global builders.**

We want every founder, indie hacker, growth engineer, agency, and exporter anywhere in the world to acquire customers across every major social, search, and B2B channel without paying \$500+/month for fragmented SaaS tools or handing over their API keys and CRM data to third-party clouds.

**Want to claim an item below?** Comment on the linked GitHub Issue or open a PR using our [Contributor Playbook](./CONTRIBUTING.md)!

---

## Live Milestones & Contributor Tracks

### Track 1: Global Social & Messaging Channel Matrix (`channel-adapter`)
Expand beyond the built-in 17 Global + China channels so local teams in every region can publish and capture leads natively.

- [x] **v1.0**: LinkedIn, X (Twitter), Reddit, YouTube, Instagram, Facebook, TikTok, Xiaohongshu, Douyin, WeChat Official Account, WeChat Channels, Bilibili, Zhihu, Weibo, Toutiao, Kuaishou, Baijiahao
- [ ] **v1.1 (Help Wanted)**: WhatsApp Business, Telegram Channels & Groups, Threads, Bluesky
- [ ] **v1.2 (Help Wanted)**: LINE (Japan / Thailand / Taiwan), KakaoTalk & Naver Blog (Korea), Pinterest, Quora, Medium, Substack
- [ ] **v1.3 (Community)**: Regional marketplaces & B2B portals (Mercado Libre, Shopify Community, Product Hunt, Hacker News)

### Track 2: Open-Source & Enterprise CRM Connectors (`crm-connector`)
Turn the local Kanban Lead CRM into a universal hub that syncs seamlessly with whatever CRM your team already uses.

- [x] **v1.0**: Local SQLite Kanban CRM + Twenty CRM GraphQL Connector + Atomic CRM Webhook + CSV Export
- [ ] **v1.1 (Help Wanted)**: HubSpot two-way sync, Salesforce REST connector, Pipedrive connector
- [ ] **v1.2 (Help Wanted)**: Notion Database sync, Airtable, Zoho CRM, Feishu / Lark Bitable, DingTalk
- [ ] **v1.3 (Community)**: Automated enrichment webhooks (email verification, company domain lookup, LinkedIn profile matching)

### Track 3: Global Languages & Regional Localization (`i18n`)
Make OpenGrowth feel native in every major market.

- [x] **v1.0**: English (`en-US`), Simplified Chinese (`zh-CN`)
- [ ] **v1.1 (Good First Issue)**: Spanish (`es`), Japanese (`ja`), German (`de`), Korean (`ko`), Portuguese (`pt-BR`)
- [ ] **v1.2 (Good First Issue)**: French (`fr`), Arabic (`ar` with RTL), Vietnamese (`vi`), Indonesian (`id`), Traditional Chinese (`zh-TW`)

### Track 4: Built-in AI Browser & Modular Site Recipes (`ai-browser`)
Keep the human-in-the-loop publishing engine rock-solid as social platforms evolve their UIs.

- [x] **v1.0**: Isolated Electron `<webview>` (`persist:biaomai-browser`), multi-account profiles, one-click draft/media autofill, human-confirmed publish
- [ ] **v1.1 (Help Wanted)**: Modular, community-maintained JSON/TS site selector recipes (`packages/ai-browser/recipes/`) with automated selector health tests
- [ ] **v1.2 (Help Wanted)**: Vision-assisted fallback element locator for dynamic creator studios
- [ ] **v1.3 (Community)**: Side-by-side DM & comment reply copilot inside the built-in browser

### Track 5: Global B2B Discovery & Intent Radar (`enhancement`)
Help teams find high-intent buyers before competitors do.

- [x] **v1.0**: B2B domain & decision-maker discovery, SMTP/IMAP cold-email studio, multi-platform Social Intent Radar (65–95 scoring)
- [ ] **v1.1 (Help Wanted)**: Google Maps / Places local-business lead extractor, Apollo/Crunchbase-compatible CSV importer, GitHub/Product Hunt buyer-intent monitor
- [ ] **v1.2 (Help Wanted)**: Multi-step email drip sequences with automatic reply detection & bounce handling
- [ ] **v1.3 (Community)**: Self-hosted intent-radar alert bots (Slack, Discord, Telegram, Email digest)

### Track 6: Community `.bmpack` Plugin & Playbook Ecosystem (`bmpack-plugin`)
Package vertical-specific prompts, workflows, motion templates, and channel playbooks into 1-click `.bmpack` bundles.

- [x] **v1.0**: 11 built-in `.bmpack` plugins (B2B Foreign Trade, Social Matrix, Local Life, OpenMotion Studio, Twenty CRM, Local Office, etc.)
- [ ] **v1.1 (Good First Issue)**: Community industry packs — SaaS PLG Launch, Shopify/DTC E-commerce, Agency Client Acquisition, Indie Hacker Distribution, Real Estate & Legal Local Services
- [ ] **v1.2 (Help Wanted)**: Community Plugin Registry (`registry.json`) with one-click install from GitHub URLs inside the workbench

---

## How Decisions Are Made

- **Small improvements & bug fixes**: Open a PR directly — we review within 48 hours.
- **New channels, CRM connectors, or `.bmpack` plugins**: Open an issue with the [Plugin / Channel Proposal template](./.github/ISSUE_TEMPLATE/plugin_channel_proposal.yml) or comment on an existing roadmap issue so contributors don't duplicate effort.
- **Major architecture RFCs**: Start a thread in [GitHub Discussions](https://github.com/qiangenping/opengrowth/discussions).

Let's build the global open-source growth engine together!
