# Deployment & Desktop Packaging Guide

## Mode 0: Zero-Docker Local Desktop (Default for Individual & Open-Source Users)

No Docker or external database is required. All data persists locally in `userData/biaomai-studio-db.json`.

```bash
pnpm install
pnpm verify:all   # Validates i18n, Apache-2.0/MIT licenses, .bmpack manifests, TypeScript, tests & build
pnpm start        # Launches the Electron Desktop Workbench (alias for pnpm dev:aionui)
```

### Building Standalone Installers (Mac `.dmg` / Windows `.exe`)
```bash
pnpm dist:mac     # macOS installer
pnpm dist:win     # Windows installer
```

---

## Mode A: Cloud Relay Mode (Optional `AiToEarn MCP`)
1. Open **Settings → AiToEarn MCP**.
2. Select `cn` (`https://aitoearn.cn/api/unified/mcp`) or `global` (`https://aitoearn.ai/api/unified/mcp`).
3. Enter your `x-api-key` and click **Test AiToEarn MCP**.

---

## Mode B: Full Self-Hosted Docker Stack (Enterprise Data Sovereignty)
```bash
pnpm docker:up
```
Launches the vendored `vendor/aitoearn/docker-compose.yml` stack (MongoDB, Redis, RustFS, `aitoearn-server`, `aitoearn-ai`). Switch **Settings → AiToEarn MCP** to `self-hosted` (`http://localhost:8080/api/unified/mcp`).
