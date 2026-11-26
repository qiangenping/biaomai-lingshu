# System Architecture & Upstream Sync SOP

## 1. Micro-Kernel + Industry Packs Architecture

`biaomai-operations-platform` enforces strict separation between its **stable Apache-2.0 micro-kernel** and **hot-pluggable industry packs & OSS plugins**:

- **Zero-Docker Desktop Shell (`vendor/aionui/`)**:
  - Default home route `/leadgen` renders the modular `LeadGenStudioPage` (`CreateStudioTab`, `OmniPublishTab`, `IntentRadarTab`, `ProspectorOutboundTab`, `LeadCrmTab`, `PacksMarketTab`, `StudioModals`) driven by the single collapsible grouped `Sider`.
  - Electron main-process bridge (`biaomaiBridge.ts`, `biaomaiStorage.ts`, `cnCompanyScraper.ts`) provides 19 native IPC capabilities: isolated `WebContentsView` browsers, PII-sanitized comment & formula extraction, CN company & Amap/Baidu/Google Maps prospecting, `dns.resolveMx` email verification, zero-dependency TLS/STARTTLS HTML+Text SMTP, NetEase RFC 2971 `ID` IMAP reply detection, Feishu/WeCom/DingTalk webhooks, and `Crawl4AI` bridging.
- **Micro-Kernel Packages (`packages/`)**:
  - `@biaomai/plugin-sdk`: Zod schemas (`schema.ts`, `crm-schema.ts`), `CanvasRegistry`, and Open-Core `EntitlementProvider`.
  - `@biaomai/plugin-runtime`: Hot `PackLoader`, ToB `PermissionGuard`, and `RegionRouter`.
  - `@biaomai/ai-browser`: Multi-account isolated browser session manager, `agent-browser`, `stagehand`, `midscene`, and `pii-sanitizer`.
- **Official Industry Packs & Foreign OSS Plugins (`packs/`)**:
  - Industry Packs: `pack-leadgen-ops`, `pack-global-b2b-outbound`, `pack-crossborder-ecom`, `pack-tob-bidding`, `pack-template`.
  - Bilingual Foreign OSS Plugins: `plugin-oss-gmaps-scraper`, `plugin-oss-crawl4ai`, `plugin-oss-openoutreach`, `plugin-oss-quickly-mailer`, `plugin-oss-agentsdr`.

## 2. Verification & Upstream Sync SOP

1. Check `vendor/aionui/UPSTREAM_VERSION.md` and `vendor/aitoearn/UPSTREAM_VERSION.md` for pinned commits.
2. Run `pnpm verify:all` to validate all 6 gates: i18n parity, Apache-2.0/MIT licenses, `.bmpack` manifest integrity, TypeScript, Vitest unit tests, and Vite production build.
