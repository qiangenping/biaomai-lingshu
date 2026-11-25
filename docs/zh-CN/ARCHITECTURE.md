# 系统架构与上游同步维护 SOP

## 1. 微内核 + 可热插拔行业包架构

`biaomai-operations-platform` 将**稳定的 Apache-2.0 平台微内核**与**垂直行业应用包**彻底解耦：

- **上游零造轮子底座（`vendor/`）**：
  - `vendor/aionui/`（`iOfficeAI/AionUi`，Apache-2.0）：跨平台桌面壳、WebUI、24/7 Cron 调度、飞书/微信/钉钉/Telegram 远程控盘与扩展宿主。
  - `vendor/aitoearn/`（`yikart/AiToEarn`，MIT）：多模态创作、全球 14+ 平台矩阵分发、短链归因与 Unified MCP。
- **平台微内核包（`packages/`）**：
  - `@biaomai/plugin-sdk`：五类扩展统一 Zod Schema、动态 `CanvasRegistry`、Open-Core `EntitlementProvider`。
  - `@biaomai/plugin-runtime`：热加载 `PackLoader`、ToB 最小权限沙盒 `PermissionGuard`、双区/双语与 401 防呆 `RegionRouter`。
  - `@biaomai/ai-browser`：多账号物理隔离容器 `IsolatedSessionManager`、`agent-browser` MCP 桥接、`stagehand` 语义提取与合规回填、可选 `midscene` 视觉兜底及强制 `pii-sanitizer`。
- **可热插拔行业包（`packs/`）**：
  - `packs/pack-leadgen-ops/`：V1.0 全球运营获客尖刀包（5 大专家、4 大动态画布、线索 CRM 与 ROI 归因）。
  - `packs/pack-template/`：本地办公与 ToB 行业扩展 5 分钟开发模板。

## 2. 上游同步维护 SOP

1. 查看 `vendor/aionui/UPSTREAM_VERSION.md` 与 `vendor/aitoearn/UPSTREAM_VERSION.md` 记录的基线 Commit。
2. 在独立升级分支同步上游最新代码，完整保留原始 `LICENSE` 文件。
3. 运行 `pnpm verify:all` 执行协议合规、双语键对称、扩展包清单完整性、类型检查、单元测试与工作台生产构建全量验收。
