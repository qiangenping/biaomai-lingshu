# 微内核架构与 `.bmpack` 插件 SDK 开发指南

标脉灵枢采用「**Apache-2.0 稳定微内核**（`packages/plugin-sdk`、`packages/plugin-runtime`、`packages/ai-browser`）+ **可热插拔行业套件与开源插件**（`packs/*`）」架构。

## 5 分钟开发新的行业套件或开源插件

1. 复制模板目录 `packs/pack-template/` 为 `packs/pack-your-vertical/`（或 `packs/plugin-oss-yourtool/`）。
2. 编辑 `aion-extension.json` 清单：
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
   > **开源协议红线**：仅允许 **Apache-2.0** 或 **MIT** 协议，任何 GPL/AGPL/LGPL/FSL 将被 `scripts/verify-licenses.mjs` 自动拦截。
3. 编写中英双语 `SKILL.zh.md` 与 `SKILL.en.md` 并在 `contributes.skills` / `contributes.assistants` 中声明。
4. 运行 `pnpm verify:all` 校验清单引用文件完整性（`verify:packs`）、协议合规（`verify:licenses`）与单元测试。
5. 在桌面端左侧菜单 **「行业插件」** 中即可自动识别展示或热插拔安装本地 `.bmpack` 目录。
