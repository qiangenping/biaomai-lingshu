# Changelog

All notable changes to `biaomai-operations-platform` will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial Apache-2.0 micro-kernel architecture built on `iOfficeAI/AionUi` (Apache-2.0), `anomalyco/opencode` (MIT), `openai/codex` (Apache-2.0), and `yikart/AiToEarn` (MIT).
- `packages/plugin-sdk` and `packages/plugin-runtime` supporting 5 first-class extension types (`SKILL.md`, MCP Servers, Canvas UI, ACP Adapters, `.bmpack` Industry Packs) with declarative permissions and 3-tier approval policies.
- `packages/ai-browser` integrating Electron isolated Chromium (`WebContentsView` + `persist:bm-acc-*`) with `vercel-labs/agent-browser`, `browserbase/stagehand`, optional `web-infra-dev/midscene`, and mandatory PII sanitization.
- V1.0 flagship industry pack `packs/pack-leadgen-ops` focused 100% on global lead generation (`Create` / `Publish` / `Engage` / `Convert` CRM + short-link ROI attribution), omitting legacy creator ad-marketplace UI.
- Dual-region (`cn-official`, `global-official`, `self-hosted`) and instant bilingual (`zh-CN` / `en-US`) routing with 401 region-mismatch guard.
- International open-source governance suite, bilingual documentation (`docs/en/`, `docs/zh-CN/`), launch articles (`docs/articles/`), and CI license & i18n verification gates.
