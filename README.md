<p align="center">
  <strong>English</strong> | <a href="./README.zh-CN.md">简体中文</a>
</p>

# BiaoMai Lingshu (`biaomai-operations-platform`)

> **Open-Source Extensible AI Desktop Workbench (Micro-Kernel + Hot-Pluggable Skills / MCP / Canvas Ecosystem)**
> Built to rival closed-source AI workbenches with full data sovereignty, Apache-2.0 licensing, and a flagship V1.0 **Global Autonomous Lead-Generation Pack** (`Create → Publish → Engage → Convert`).

[![License](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](./LICENSE)
[![i18n](https://img.shields.io/badge/i18n-English%20%7C%20%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-indigo.svg)](./README.zh-CN.md)
[![Regions](https://img.shields.io/badge/Regions-Global%20%7C%20CN%20%7C%20Self--Hosted-emerald.svg)](./config/)

---

## Why BiaoMai Lingshu?

1. **Zero Wheel Reinvention (100% Apache-2.0 / MIT Stack)**:
   - Desktop shell, 24/7 Cron scheduler, WebUI & IM remote control (Feishu / WeChat / DingTalk / Telegram): [`iOfficeAI/AionUi`](https://github.com/iOfficeAI/AionUi) (Apache-2.0)
   - Agent engines: [`anomalyco/opencode`](https://github.com/anomalyco/opencode) (MIT) + [`openai/codex`](https://github.com/openai/codex) (Apache-2.0) + local models (Ollama/vLLM)
   - Global 14+ channel publishing, multimodal generation & short-link attribution: [`yikart/AiToEarn`](https://github.com/yikart/AiToEarn) (MIT)
   - AI-Native Embedded Isolated Browser: Electron Chromium (`WebContentsView` + per-account session isolation) + [`vercel-labs/agent-browser`](https://github.com/vercel-labs/agent-browser) (Apache-2.0) + [`browserbase/stagehand`](https://github.com/browserbase/stagehand) (MIT) + optional [`web-infra-dev/midscene`](https://github.com/web-infra-dev/midscene) (MIT)
2. **Ultra-Flexible Micro-Kernel & Plugin Architecture**:
   - Five first-class hot-pluggable units: `SKILL.md`, MCP Servers, Canvas UI, ACP Adapters, and `.bmpack` Industry Solution Packs (`aion-extension.json` compatible).
   - Ready for V1.0 **Global Lead-Gen** (`packs/pack-leadgen-ops`) today, and **Local Office** & **ToB vertical packs** (bidding review, SCRM, ERP/OA) tomorrow with zero micro-kernel modifications.
3. **Zero External Browser Extension Hassle**:
   - Multi-account isolated Chromium built right inside the workbench—no Chrome extension installation, resilient against platform DOM changes, and strict Human-in-the-Loop + zero-PII compliance.

## Quick Start

```bash
git clone https://github.com/<org>/biaomai-operations-platform.git
cd biaomai-operations-platform
pnpm bootstrap
```

To start the self-hosted AiToEarn backend stack via Docker:
```bash
pnpm docker:up
```

## Documentation

- [5-Minute Quickstart](./docs/en/QUICKSTART.md)
- [Complete Operator Manual](./docs/en/USER_MANUAL.md)
- [Self-Hosted & Cloud Relay Deployment](./docs/en/DEPLOYMENT.md)
- [Architecture & Plugin SDK Guide](./docs/en/PLUGIN_SDK_GUIDE.md)
- [Security Policy](./SECURITY.md) | [Privacy & Compliance](./PRIVACY_AND_COMPLIANCE.md) | [Contributing](./CONTRIBUTING.md)

## License

Licensed under the [Apache License 2.0](./LICENSE). See [NOTICE](./NOTICE) and [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for upstream attributions.
