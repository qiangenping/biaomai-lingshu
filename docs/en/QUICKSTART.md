# 5-Minute Quickstart Guide

## Prerequisites
- **Node.js** `>= 22` and **pnpm** `>= 9`
- **Docker** (optional, required only for `self-hosted` mode)
- **OpenCode** or **Codex** CLI (optional, AionUi built-in agent works out of the box)

## 1. Install & Verify Workspace
```bash
pnpm bootstrap
```
This installs dependencies and runs the i18n symmetry check, Apache-2.0/MIT license audit, TypeScript typecheck, and automated unit tests.

## 2. Choose Your Region Profile
Edit or select one of the three built-in profiles in `config/`:
- `config/global.profile.json` — Global 8 channels (TikTok, YouTube, Instagram, Facebook, Threads, X, Pinterest, LinkedIn)
- `config/china.profile.json` — China 6 channels (Douyin, RedNote/XHS, Kuaishou, Bilibili, WeChat Channels, WeChat OA)
- `config/self-hosted.profile.json` — Local Docker stack (`pnpm docker:up`)

## 3. Run Your First Lead-Gen Workflow
1. Select **Full-Funnel Lead-Gen Director** from the left Experts Hub.
2. Prompt: *"Create a 3-post LinkedIn + TikTok lead-gen campaign for our B2B SaaS with a tracking short-link."*
3. Review the generated drafts in the right **Content Preview** canvas and click **Add to Calendar**.
4. Open the built-in **AI Browser Radar** tab, log into your isolated social account, navigate to a target post, and click **Analyze Visible Comments** to score S/A buyer intent and capture leads into the **Lead CRM**.
