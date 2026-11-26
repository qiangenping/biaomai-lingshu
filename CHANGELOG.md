# Changelog

All notable changes to `biaomai-operations-platform` will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-26

### Added
- **Zero-Docker Desktop Workbench (`AionUi` + BiaoMai Branding)**: Launches directly into `/leadgen` (`LeadGenStudioPage`) with official BiaoMai iconography, collapsible single-sidebar grouped menu (`Inbound / Outbound / Convert / System`), 5 industry presets, and built-in operating guide.
- **Inbound 17-Channel Omni-Media Growth (`pack-leadgen-ops`)**: AI copywriting, multilingual localization (`zh-CN`, `en-US`, `ja-JP`, `es-ES`), AI cover visual & video/dubbing task progress, 17 isolated Chromium partitions (`persist:bm-acc-*`), live comment intent radar with mandatory `pii-sanitizer`, competitor formula extraction, and LLM semantic reranking.
- **Outbound Global & CN Enterprise Prospector (`pack-global-b2b-outbound`)**:
  - CN company name bulk lookup (`cnCompanyScraper.ts` with 360/Baidu Mobile/official site deep probe & SSRF guard) + Amap / Baidu Map isolation extraction;
  - Global Google Maps, LinkedIn, Thomasnet, Europages, Alibaba extraction + company `/contact` enrichment + real `dns.resolveMx` verification;
  - 3-step multilingual cold email & WhatsApp sequences, zero-dependency TLS/STARTTLS HTML+Text SMTP mailer, and TLS IMAP reply checker with NetEase 163/126 RFC 2971 `ID` support.
- **Unified Local Persistence & CRM**: Main-process atomic DB (`biaomaiStorage.ts` -> `userData/biaomai-studio-db.json`), 5-stage Lead CRM, ROI attribution & post re-spin, CSV export, and 24/7 Cron + Feishu/WeCom/DingTalk webhook alerts.
- **Vertical `.bmpack` & Bilingual Foreign OSS Plugins**: Added `pack-crossborder-ecom`, `pack-tob-bidding`, and 5 bilingual open-source plugins (`plugin-oss-gmaps-scraper`, `plugin-oss-crawl4ai`, `plugin-oss-openoutreach`, `plugin-oss-quickly-mailer`, `plugin-oss-agentsdr`).
- **Big-Tech OSS Governance**: 6 CI quality gates (`pnpm verify:all`), Apache-2.0 + MIT license audit, DCO `Signed-off-by`, bilingual docs (`README`, `QUICKSTART`, `USER_MANUAL`, `ARCHITECTURE`), and GitHub Issue/PR/Release workflows.
