# Architecture Deep Dive: Why We Combined AionUi, OpenCode, AiToEarn, and an AI-Native Isolated Browser

Building an enterprise-grade AI desktop workbench from scratch takes years—and most teams waste 80% of their effort reinventing Electron auto-updaters, chat streaming UIs, OAuth token refresh queues, and fragile browser extensions.

In **BiaoMai Lingshu (`biaomai-operations-platform`)**, we chose a disciplined **Apache-2.0 / MIT composition architecture**:

1. **Zero Copyleft Traps**: Automated CI (`scripts/verify-licenses.mjs`) blocks GPL/AGPL/source-available dependencies at merge time.
2. **Micro-Kernel Isolation**: Every vertical workflow—starting with V1.0 Global Lead Generation (`packs/pack-leadgen-ops`) and expanding to Local Office & ToB vertical apps—ships as a declarative `.bmpack` with explicit `permissions` and dynamic right-side canvases.
3. **AI-Native Embedded Browser**: Instead of forcing non-technical operators to install Chrome extensions, Electron `WebContentsView` + per-account `persist:bm-acc-*` partitions + `agent-browser` (Apache-2.0) + `stagehand` (MIT) turn the workbench into an isolated, resilient, Human-in-the-Loop AI browser.
