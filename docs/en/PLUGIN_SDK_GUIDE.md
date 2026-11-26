# Micro-Kernel & `.bmpack` Plugin SDK Guide

BiaoMai Lingshu separates its **Apache-2.0 micro-kernel** (`packages/plugin-sdk`, `packages/plugin-runtime`, `packages/ai-browser`) from hot-pluggable **industry packs & OSS plugins** (`packs/*`).

## Creating a New Industry Pack or OSS Plugin in 5 Minutes

1. Copy `packs/pack-template/` to `packs/pack-your-vertical/` (or `packs/plugin-oss-yourtool/`).
2. Configure `aion-extension.json`:
   ```json
   {
     "name": "pack-your-vertical",
     "displayName": { "zh-CN": "行业套件名称", "en-US": "Vertical Pack Name" },
     "version": "1.0.0",
     "license": "Apache-2.0",
     "category": "leadgen",
     "permissions": {
       "fsReadPaths": ["./exports"],
       "fsWritePaths": ["./exports"],
       "netDomains": ["*"],
       "browserCdp": true,
       "shellExec": false,
       "defaultApproval": "always-ask",
       "alwaysAskActions": ["send_smtp_email"]
     }
   }
   ```
   > **License Policy**: Only **Apache-2.0** or **MIT** licenses are permitted. `scripts/verify-licenses.mjs` blocks GPL/AGPL/LGPL/FSL.
3. Add bilingual playbooks (`SKILL.zh.md` & `SKILL.en.md`) and register them under `contributes.skills` or `contributes.assistants`.
4. Run `pnpm verify:all` to verify manifest file integrity (`verify:packs`), license compliance (`verify:licenses`), and TypeScript/Vitest gates.
5. Open **Packs Market** (`06`) in the desktop app to view or hot-install local `.bmpack` directories.
