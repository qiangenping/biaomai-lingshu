# System Architecture & Upstream Sync SOP

## 1. Micro-Kernel + Industry Packs Architecture

`biaomai-operations-platform` enforces strict separation between its **stable Apache-2.0 micro-kernel** and **hot-pluggable industry packs**:

- **Vendored Upstream Foundations (`vendor/`)**:
  - `vendor/aionui/` (`iOfficeAI/AionUi`, Apache-2.0): Desktop Electron shell, WebUI, Cron scheduler, IM remote channels, and extension host.
  - `vendor/aitoearn/` (`yikart/AiToEarn`, MIT): Multi-platform content creation, 14+ channel publishing, short-link attribution, and unified MCP server.
- **Micro-Kernel Packages (`packages/`)**:
  - `@biaomai/plugin-sdk`: Zod schemas for 5 first-class extension types, `CanvasRegistry`, and Open-Core `EntitlementProvider`.
  - `@biaomai/plugin-runtime`: Hot `PackLoader`, ToB `PermissionGuard` sandbox, and dual-region/bilingual `RegionRouter` with 401 guard.
  - `@biaomai/ai-browser`: Multi-account isolated Electron `WebContentsView` manager (`persist:bm-acc-*`), `agent-browser` MCP bridge, `stagehand` semantic extractor, optional `midscene` vision fallback, and mandatory `pii-sanitizer`.
- **Industry Packs (`packs/`)**:
  - `packs/pack-leadgen-ops/`: V1.0 flagship global lead-generation pack (5 bilingual experts, 4 dynamic canvases, Lead CRM, ROI attribution).
  - `packs/pack-template/`: Starter template for Local Office and ToB vertical packs.

## 2. Upstream Sync SOP

1. Check `vendor/aionui/UPSTREAM_VERSION.md` and `vendor/aitoearn/UPSTREAM_VERSION.md` for pinned commits.
2. Refresh vendored tree from upstream `main` on a feature branch, preserving upstream `LICENSE` files.
3. Run `pnpm verify:all` to verify license compliance, i18n parity, pack manifest integrity, TypeScript checks, unit tests, and production workbench build.
