# 正式开源「标脉灵枢」：用 Apache-2.0 微内核 + AI 原生内置浏览器，打造对标 WorkBuddy 的全球运营获客与 ToB 工作台

市面上的闭源 AI 桌面助手大多停留在“泛聊天”阶段，企业既无法控制数据出域，又难以深度接入自己的获客渠道和内部业务系统。今天我们正式开源 **标脉灵枢（`biaomai-operations-platform`）**，全栈采用 **Apache-2.0 / MIT** 商用安全协议！

### 绝不重复造轮子：站在顶级开源生态的肩膀上
- **桌面壳、24/7 Cron 与飞书/微信/Telegram 远程控盘**：直接复用 `iOfficeAI/AionUi`（Apache-2.0）；
- **底层 Agent 引擎**：原生集成 `OpenCode`（MIT）与 `OpenAI Codex`（Apache-2.0），并支持本地私有模型；
- **全球 14+ 平台创作分发与归因短链**：直接复用 `yikart/AiToEarn`（MIT），彻底剥离无关商单模块，100% 聚焦运营获客；
- **AI 原生内置隔离浏览器**：融合 Electron 隔离 Chromium、`vercel-labs/agent-browser` 与 `browserbase/stagehand`，免装外部 Chrome 插件、多号隔离不串号、严守人机协同与零 PII 合规红线。

### V1.0 打穿运营获客，V2.0 开放本地办公与 ToB 插件生态
借助标准化的 `packages/plugin-sdk` 与声明式权限沙盒，任何团队只需 5 分钟即可编写自己的本地办公、招投标审标或 ERP/CRM 行业插件包（`.bmpack`），让 AI 工作台真正长在企业的真实业务流上。
