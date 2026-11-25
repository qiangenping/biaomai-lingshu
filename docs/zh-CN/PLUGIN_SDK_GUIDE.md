# 微内核架构与插件 / 技能 SDK 开发指南

## 5 分钟构建本地办公或 ToB 垂直行业扩展包

标脉灵枢采用「稳定微内核（`packages/plugin-sdk`、`packages/plugin-runtime`、`packages/ai-browser`）+ 热插拔行业包（`packs/*`）」架构，微内核与业务完全解耦。

1. 复制模板目录 `packs/pack-template/` 为 `packs/pack-your-industry/`（例如本地文档批处理、标脉招投标审标、企业 ERP/CRM 连接器）。
2. 编辑 `aion-extension.json` 声明：
   - `permissions`：最小权限清单（读写目录白名单、允许访问域名、浏览器权限及强制二次确认动作）；
   - `contributes.skills`：中英双语 `SKILL.zh.md` / `SKILL.en.md` 业务 SOP；
   - `contributes.mcpServers`：本地 `stdio` 工具进程或企业内网 `http`/`sse` API；
   - `contributes.canvases`：注册专属右侧业务画布至 `CanvasRegistry`。
3. 运行 `pnpm verify:all` 通过 Schema、双语键对称与开源协议门禁校验，即可在插件市场一键热加载。
