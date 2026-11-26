# Changelog

All notable changes to **BiaoMai Lingshu (标脉灵枢)** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-26

### Added
- **Built-in AI Browser (`AiBrowserTab`)**: Embedded Electron `<webview>` workspace with address bar, bookmarks, multi-account isolated `persist:` Cookie partitions, and right-side AI Copilot (live comment extraction, competitor formula extraction, B2B company extraction, and human-confirmed draft/reply prefill).
- **1-Click Content Studio (`CreateStudioTab`)**: Single-click generation of platform copy, brand cover visual / AI image, and **OpenMotion** HTML5/Motion.md animation preview, plus inline editing, per-part tweaks, and recent draft history.
- **2-Stage Compliant Publishing (`OmniPublishTab`)**: Top-pinned schedule queue, 17 China & Global channel containers, one-click AI Browser prefill, and explicit human-confirmed "Mark Published" flow.
- **Upgraded Social Intent Radar (`IntentRadarTab`)**: Direct AI Browser integration, multi-platform real author + comment extraction, mandatory PII sanitization, LLM semantic intent scoring, and 1-click offline sample comments.
- **Commercial Lead CRM & Open-Source CRM Sync (`LeadCrmTab`)**: 5-stage Kanban board, Table view, Detail Drawer, CSV export, ROI attribution, and REST API connector for self-hosted **Twenty CRM** (`twentyhq/twenty`) and **Atomic CRM** (`marmelab/atomic-crm`).
- **Hot-Pluggable Open-Source Plugins**: Added `plugin-oss-twenty-crm` and `plugin-oss-openmotion` (with 1-click local full OpenMotion Studio lifecycle control), plus full `/` slash command availability and automatic `zh-CN` / `en-US` localization.

### Changed
- Unified flat button design system (`flat-buttons.css`), full-width responsive layouts, BiaoMai Lingshu brand logo (`app.png`), theme cover (`biaomai-theme.svg`), and About links (`biao5fen.com`, `genpingqian@gmail.com`, `github.com/qiangenping/biaomai-lingshu`).
- Removed unused AiToEarn MCP settings UI and redesigned Settings into a clean 3-tab modal with live system model sync and 1-click key clearing.
- Eliminated startup lazy-load spinner flash on `/leadgen` and added inline font-family/theme styles in `index.html` to prevent FOUC.
