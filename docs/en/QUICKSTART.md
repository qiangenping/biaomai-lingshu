# 5-Minute Quickstart Guide

## Prerequisites
- **Node.js** `>= 22` and **pnpm** `>= 9`
- **Bun** (`curl -fsSL https://bun.sh/install | bash`) for the `AionUi` Electron shell
- **Docker** (optional — **not required** for local desktop usage)

## 1. Install & Verify Workspace
```bash
pnpm install
pnpm verify:all
```
This runs all 6 quality gates: i18n symmetry check, Apache-2.0/MIT license audit, `.bmpack` manifest integrity check, TypeScript typecheck, Vitest unit tests, and production build.

## 2. Launch the Zero-Docker Desktop Workbench
```bash
pnpm dev:aionui
```
Open **Lead-Gen Studio** from the left sidebar. All local data is stored safely on your machine (`userData/biaomai-studio-db.json`).

## 3. Configure Your Local Keys (Optional & BYOK)
Click **⚙️ API Settings** in the top-right corner:
1. **LLM Provider**: Enter any OpenAI-compatible Base URL, Model, and API Key (e.g., DeepSeek, OpenAI, or local Ollama `http://localhost:11434/v1`).
2. **Image Provider**: Optional image model key.
3. **AiToEarn MCP**: Optional CN/Global/Self-Hosted `x-api-key` for cloud publishing and AI video generation.
4. **Outbound SMTP / IMAP & IM Webhook**: Enter your Gmail App Password / Corporate Mail SMTP & IMAP settings and optional Feishu/WeCom/DingTalk webhook URL.

## 4. Run Your First Inbound + Outbound Workflows
- **Inbound (`01 → 02 → 03`)**: Generate platform-tailored copy & visuals → schedule across 17 isolated channels → extract live comments in the isolated browser with automatic PII redaction.
- **Outbound (`04 Global Outbound`)**: Search buyers on Google Maps / LinkedIn / Europages → extract real companies → enrich public emails with DNS MX verification → draft 3-step cold email sequences → confirm and send via local SMTP.
