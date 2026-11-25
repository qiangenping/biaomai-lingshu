# Self-Hosted Docker & Cloud Relay Deployment Guide

## Mode A: Cloud Relay Mode (Zero Infrastructure Setup)
1. Select `global-official` (`aitoearn.ai`) or `cn-official` (`aitoearn.cn`) in the topbar.
2. Paste your region API key in **Settings → Region & Relay**. Keys are encrypted locally via OS Keychain (`safeStorage`) and isolated per region.

## Mode B: Full Self-Hosted Docker Stack (Data Sovereignty)
```bash
pnpm docker:up
```
This launches the vendored `vendor/aitoearn/docker-compose.yml` stack:
- MongoDB (rs0 replica set)
- Redis
- RustFS (S3-compatible object storage)
- `aitoearn-server` (OAuth channels, publish queue, short-link, unified MCP)
- `aitoearn-ai` (multimodal draft generation & model routing)

Switch the desktop app to `self-hosted` (`config/self-hosted.profile.json`) and verify `http://localhost:8080/api/unified/mcp`.
