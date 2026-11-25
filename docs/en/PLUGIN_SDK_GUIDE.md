# Micro-Kernel Architecture & Plugin SDK Guide

## Building Your Own Local Office or ToB Industry Pack in 5 Minutes

BiaoMai Lingshu separates its stable Apache-2.0 micro-kernel (`packages/plugin-sdk`, `packages/plugin-runtime`, `packages/ai-browser`) from vertical business packs (`packs/*`).

1. Copy `packs/pack-template/` to `packs/pack-my-tob-app/`.
2. Edit `aion-extension.json` to declare:
   - `permissions`: explicit `fsReadPaths`, `fsWritePaths`, `netDomains`, `browserCdp`, `shellExec`, and `alwaysAskActions`.
   - `contributes.skills`: bilingual `SKILL.zh.md` & `SKILL.en.md` playbooks.
   - `contributes.mcpServers`: local `stdio` tools (Excel, PDF, SQLite, bidding review) or enterprise `http`/`sse` APIs (ERP/CRM/OA).
   - `contributes.canvases`: custom right-side React canvases registered automatically via `CanvasRegistry`.
3. Validate with `pnpm verify:all` and load live via `PackLoader.loadFromDirectory(...)`.
