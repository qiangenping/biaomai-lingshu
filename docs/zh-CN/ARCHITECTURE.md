# 系统架构与上游同步维护 SOP

## 1. 微内核 + 可热插拔行业套件与开源插件架构

`biaomai-operations-platform` 将**稳定的 Apache-2.0 平台微内核**与**垂直行业包 / 国外开源插件**彻底解耦：

- **免 Docker 桌面壳（`vendor/aionui/`）**：
  - 客户端启动默认进入 `/leadgen`（模块化 `LeadGenStudioPage`：包含 `CreateStudioTab`、`OmniPublishTab`、`IntentRadarTab`、`ProspectorOutboundTab`、`LeadCrmTab`、`PacksMarketTab`、`StudioModals`），由左侧单一可折叠分组菜单统一导航。
  - Electron 主进程桥接层（`biaomaiBridge.ts`、`biaomaiStorage.ts`、`cnCompanyScraper.ts`）提供 19 项原生 IPC 能力：隔离浏览器多开、PII 脱敏评论与竞品拆解、国内公司名/高德百度/Google Maps/LinkedIn 寻客、`dns.resolveMx` 邮箱验真、零依赖 TLS/STARTTLS HTML+纯文本 SMTP、网易 163/126 RFC 2971 `ID` IMAP 回信检测、飞书/企微/钉钉 Webhook 及 `Crawl4AI` 桥接。
- **平台微内核包（`packages/`）**：
  - `@biaomai/plugin-sdk`：统一 Zod Schema（`schema.ts`、`crm-schema.ts`）、动态 `CanvasRegistry`、Open-Core `EntitlementProvider`。
  - `@biaomai/plugin-runtime`：热加载 `PackLoader`、ToB 最小权限沙盒 `PermissionGuard`、双区/双语与 401 防呆 `RegionRouter`。
  - `@biaomai/ai-browser`：多账号隔离容器、`agent-browser`、`stagehand`、`midscene` 与强制 `pii-sanitizer`。
- **官方行业套件与国外双语开源插件（`packs/`）**：
  - 行业套件：`pack-leadgen-ops`、`pack-global-b2b-outbound`、`pack-crossborder-ecom`、`pack-tob-bidding`、`pack-template`。
  - 双语开源插件：`plugin-oss-gmaps-scraper`、`plugin-oss-crawl4ai`、`plugin-oss-openoutreach`、`plugin-oss-quickly-mailer`、`plugin-oss-agentsdr`。

## 2. 校验与上游同步维护 SOP

1. 查看 `vendor/aionui/UPSTREAM_VERSION.md` 与 `vendor/aitoearn/UPSTREAM_VERSION.md` 记录的基线 Commit。
2. 运行 `pnpm verify:all` 执行协议合规、双语键对称、扩展包清单完整性、类型检查、单元测试与生产构建全量验收。
