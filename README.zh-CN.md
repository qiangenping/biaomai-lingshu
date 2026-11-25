<p align="center">
  <a href="./README.md">English</a> | <strong>简体中文</strong>
</p>

# 标脉灵枢 AI 工作台（`biaomai-operations-platform`）

> **开源对标 WorkBuddy 的企业级可插拔 AI 桌面工作台（微内核 + 热插拔技能 / MCP / 画布生态）**
> 100% Apache-2.0 / MIT 商用安全底座；V1.0 以 **「全球全自动运营获客（Create → Publish → Engage → Convert）」** 为破局尖刀，全面支持未来本地办公与各类 ToB 垂直行业应用扩展。

[![License](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](./LICENSE)
[![i18n](https://img.shields.io/badge/i18n-English%20%7C%20%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-indigo.svg)](./README.md)
[![Regions](https://img.shields.io/badge/Regions-%E5%9B%BD%E5%86%85CN%20%7C%20%E5%9B%BD%E9%99%85Global%20%7C%20%E7%A7%81%E6%9C%89%E5%8C%96-emerald.svg)](./config/)

---

## 核心特性

1. **全栈开源零造轮子（100% Apache-2.0 / MIT 商用安全）**：
   - 桌面壳 + 24/7 Cron 定时调度 + WebUI 与微信/飞书/钉钉/Telegram 远程控盘：[`iOfficeAI/AionUi`](https://github.com/iOfficeAI/AionUi)（Apache-2.0）
   - Agent 引擎：[`anomalyco/opencode`](https://github.com/anomalyco/opencode)（MIT）+ [`openai/codex`](https://github.com/openai/codex)（Apache-2.0）+ 本地私有模型
   - 全球 14+ 平台创作分发与短链归因中台：[`yikart/AiToEarn`](https://github.com/yikart/AiToEarn)（MIT，已剥离原达人商单板块）
   - AI 原生内置隔离浏览器：Electron Chromium（`WebContentsView` + 多账号物理隔离）+ [`vercel-labs/agent-browser`](https://github.com/vercel-labs/agent-browser)（Apache-2.0）+ [`browserbase/stagehand`](https://github.com/browserbase/stagehand)（MIT）+ 可选 [`web-infra-dev/midscene`](https://github.com/web-infra-dev/midscene)（MIT）
2. **极致灵活的微内核 + 插件/技能生态**：
   - 统一支持 5 类热插拔扩展：`SKILL.md` 技能、MCP Server、右侧 Canvas 业务画布、ACP 引擎适配器、`.bmpack` 行业一键包；配备 ToB 级声明式权限沙盒与三档人工审批门禁。
3. **AI 原生内置隔离浏览器（零外装插件门槛）**：
   - 彻底免除手动安装 Chrome 扩展的麻烦；多账号 Cookie 物理隔离不串号、防前端改版自适应操作、强制 PII 脱敏与人机协同确认发送。

## 快速开始

```bash
git clone https://github.com/<org>/biaomai-operations-platform.git
cd biaomai-operations-platform
pnpm bootstrap
```

一键拉起本地 Docker 私有化 `AiToEarn` 业务中台：
```bash
pnpm docker:up
```

## 完整中文文档

- [5 分钟快速上手指南](./docs/zh-CN/QUICKSTART.md)
- [完整操作使用手册](./docs/zh-CN/USER_MANUAL.md)
- [本地 Docker 私有化与云中继部署手册](./docs/zh-CN/DEPLOYMENT.md)
- [微内核架构与插件/技能 SDK 开发指南](./docs/zh-CN/PLUGIN_SDK_GUIDE.md)
- [安全声明](./SECURITY.md) | [隐私与合规红线](./PRIVACY_AND_COMPLIANCE.md) | [参与贡献](./CONTRIBUTING.zh-CN.md)
