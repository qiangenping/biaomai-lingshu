# Contributing to OpenGrowth (`opengrowth`)

English | [简体中文](./CONTRIBUTING.zh-CN.md)

Welcome! **OpenGrowth** is on a mission to build the world's best open-source, local-first AI customer acquisition & outbound growth workbench — **together with developers, growth engineers, designers, and marketers worldwide.**

Every contribution matters, whether you are adding a regional social channel, translating UI strings, building a CRM connector, authoring a `.bmpack` industry playbook, or improving the Electron + React core.

---

## Quick Start: Make Your First Contribution in 15 Minutes

### 1. Fork & Clone
```bash
git clone https://github.com/<your-username>/opengrowth.git
cd opengrowth
pnpm install
```

### 2. Verify Your Local Environment
```bash
pnpm verify:all
```
This runs all 6 built-in quality gates:
1. `verify:i18n` — bilingual key symmetry check
2. `verify:licenses` — Apache-2.0 / MIT compliance & governance check
3. `verify:packs` — `.bmpack` manifest & file integrity check
4. `tsc --noEmit` — TypeScript type check
5. `vitest run` — unit & integration tests
6. `@biaomai/workbench build` — production UI bundle check

### 3. Run the Workbench Locally
```bash
pnpm dev:workbench
```

---

## 4 High-Impact Ways to Contribute

Pick a track that matches your skills and check our [Good First Issues](https://github.com/qiangenping/opengrowth/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) or [Global Roadmap](./ROADMAP.md):

| Track | What to Build | Where in the Repo | Difficulty |
| :--- | :--- | :--- | :--- |
| **A. Global Channels** | Add WhatsApp Business, Telegram, Threads, Bluesky, LINE, KakaoTalk, Pinterest, etc. | `apps/workbench/src/components/OmniPublishTab.tsx`, `AiBrowserTab.tsx`, `packages/ai-browser/` | Beginner–Intermediate |
| **B. CRM & B2B Connectors** | Add HubSpot, Salesforce, Pipedrive, Notion, Airtable, or B2B data importers | `apps/workbench/src/components/LeadCrmTab.tsx`, `LeadDiscoveryTab.tsx`, `packs/plugin-oss-*/` | Intermediate |
| **C. `.bmpack` Industry Playbooks** | Package prompts, skills (`SKILL.md`), and channel templates for SaaS, E-commerce, Agencies, Local Services | `packs/plugin-*/` (see [Plugin SDK Guide](./docs/en/PLUGIN_SDK_GUIDE.md)) | Beginner |
| **D. Global Languages (i18n)** | Add `es`, `ja`, `de`, `ko`, `pt-BR`, `fr`, `ar`, `vi`, `id` translations & docs | `apps/workbench/src/i18n/`, `docs/` | Beginner |

---

## Repository Map

```text
opengrowth/
├── apps/workbench/          # React + TypeScript 6+1 Global Lead-Gen Workbench UI
├── packages/
│   ├── plugin-sdk/          # .bmpack manifest & plugin authoring SDK
│   ├── plugin-runtime/      # Local plugin loader & lifecycle runtime
│   └── ai-browser/          # Built-in AI Browser autofill & channel recipes
├── packs/                   # 11+ modular .bmpack plugins & SKILL.md playbooks
├── services/orchestrator/   # Local API & SQLite persistence service
├── vendor/aionui/           # Upstream Electron desktop shell integration
├── docs/                    # English & Simplified Chinese manuals and guides
└── scripts/                 # i18n, license, and pack verification scripts
```

---

## License, Compliance & DCO Rules

1. **Apache License 2.0**: All contributions are licensed under **Apache-2.0**.
2. **Strict License Gate**: Never introduce GPL, AGPL, LGPL, or source-available commercial-restricted dependencies. Always pass `node scripts/verify-licenses.mjs`.
3. **Human-in-the-Loop Compliance**: Browser adapters must never bypass CAPTCHAs, defeat platform authentication, or scrape private/gated user data. Final publishing actions must remain human-confirmed or use official APIs.
4. **DCO Sign-off Required**: Every commit must include a `Signed-off-by` trailer certifying your right to contribute under Apache-2.0:
   ```bash
   git commit -s -m "feat(channels): add Telegram channel adapter"
   ```

---

## Pull Request Checklist

Before opening a Pull Request:
- [ ] Run `pnpm verify:all` and confirm all 6 gates pass locally
- [ ] Sign off your commits with `git commit -s`
- [ ] Update relevant docs (`README.md`, `docs/en/`, `docs/zh-CN/`) if adding user-facing features
- [ ] Link the related GitHub Issue (e.g., `Closes #1`) in your PR description

---

## Community & Maintainer Contact

- **GitHub Discussions**: https://github.com/qiangenping/opengrowth/discussions
- **Issues & Proposals**: https://github.com/qiangenping/opengrowth/issues
- **Website**: https://biao5fen.com
- **Maintainer Email**: `genpingqian@gmail.com`

Thank you for helping build an open, local-first global growth engine for everyone!
