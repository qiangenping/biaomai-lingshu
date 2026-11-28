# Third-Party Open-Source Notices

`OpenGrowth` strictly incorporates only OSI-approved, commercially permissive open-source software (**Apache-2.0**, **MIT**, **BSD-3-Clause**, **ISC**). Copyleft (GPL/AGPL/LGPL) and source-available commercial-restricted software are explicitly excluded from the core bundle and blocked by automated CI license auditing (`scripts/verify-licenses.mjs`).

## Core Upstream Foundations

| Component | Upstream Repository | License | Usage in This Repository |
| :--- | :--- | :--- | :--- |
| **AionUi** | https://github.com/iOfficeAI/AionUi | Apache-2.0 | Vendored in `vendor/aionui/` as the cross-platform Electron/WebUI desktop micro-kernel, Cron scheduler, IM remote channels, and extension host. |
| **AiToEarn** | https://github.com/yikart/AiToEarn | MIT | Vendored in `vendor/aitoearn/` for multi-platform content creation, 17-channel publishing, short-link attribution, and unified MCP server. Original creator ad-marketplace UI is omitted. |
| **OpenMotion** | https://github.com/nexu-io/openmotion | Apache-2.0 | Integrated via `plugin-oss-openmotion` for HTML5/MP4 motion graphics rendering. |
| **OpenCode** | https://github.com/anomalyco/opencode | MIT | Integrated via ACP adapter as a primary open-source coding & operations agent engine. |
| **OpenAI Codex** | https://github.com/openai/codex | Apache-2.0 | Integrated via ACP adapter as an official open-source agent runtime. |
| **agent-browser** | https://github.com/vercel-labs/agent-browser | Apache-2.0 | Integrated in `packages/ai-browser/` for low-token accessibility-tree browser control via CDP/MCP. |
| **Stagehand** | https://github.com/browserbase/stagehand | MIT | Integrated in `packages/ai-browser/` for schema-based semantic extraction and resilient UI interaction. |
| **Midscene** | https://github.com/web-infra-dev/midscene | MIT | Optional vision-model browser fallback in `packages/ai-browser/`. |
| **social-auto-upload** | https://github.com/dreammis/social-auto-upload | MIT | Referenced for zero-Docker local multi-platform publishing across domestic & global channels. |

## External REST Connectors (Non-Bundled)

| Component | Upstream Repository | License | Integration Method |
| :--- | :--- | :--- | :--- |
| **Twenty CRM** | https://github.com/twentyhq/twenty | AGPL-3.0 | External REST API sync only (`/rest/people`); zero copyleft code bundled. |
| **Atomic CRM** | https://github.com/marmelab/atomic-crm | MIT | External REST API sync (`/rest/v1/contacts`). |

## Integrated Global Lead-Gen OSS Plugins (`packs/plugin-oss-*`)

| Plugin | Upstream Inspiration | License | Capability |
| :--- | :--- | :--- | :--- |
| `plugin-oss-gmaps-scraper` | https://github.com/omkarcloud/google-maps-scraper | MIT | Bulk Google Maps local business lead extraction. |
| `plugin-oss-crawl4ai` | https://github.com/unclecode/crawl4ai | Apache-2.0 | AI-ready web directory & public tender extraction. |
| `plugin-oss-openoutreach` | https://github.com/eracle/OpenOutreach | Apache-2.0 | AI ICP fit scoring & personalized cold outreach drafting. |
| `plugin-oss-quickly-mailer` | https://github.com/AbdelftahZowail/Quickly | MIT | Multi-inbox rotation, 3-step follow-up sequences & IMAP auto-stop. |
| `plugin-oss-agentsdr` | AgentSDR | MIT | Coordinated Email + LinkedIn + WhatsApp outbound workflow. |

## Attribution Preservation

Original `LICENSE` files from `iOfficeAI/AionUi` and `yikart/AiToEarn` are preserved intact inside `vendor/aionui/LICENSE` and `vendor/aitoearn/LICENSE`.
