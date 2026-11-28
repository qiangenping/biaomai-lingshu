# OpenGrowth (OpenGrowth) — Complete User Manual

This guide walks you through configuring your model and running the full end-to-end Inbound Content + Outbound B2B + CRM workflow locally.

---

## 1. Initial Setup & Model Configuration

1. Open **Settings → Models** in the left sidebar and configure any OpenAI-compatible provider (DeepSeek, OpenAI, Qwen, local Ollama, etc.).
2. Return to **Lead-Gen Studio**: the top-right status pill automatically turns green and syncs your active model. If you delete the model in system settings, the workbench clears its synced cache automatically.
3. Click **Settings** (top right of the workbench) to optionally override the LLM, add a dedicated Image API key, configure outbound **SMTP / IMAP** mail credentials, or connect a **Feishu / WeCom / DingTalk Webhook** and local **Crawl4AI** endpoint.

---

## 2. Inbound Social Growth (01 → 02 → AI Browser → 04 → 06)

### Step 1: 1-Click Content Creation (`01 Create Studio`)
1. Choose your target channel (RedNote, Douyin, TikTok, YouTube, LinkedIn, etc.) and output language.
2. Enter a short product pitch and click **1-Click Generate All (Copy + Cover + Motion)**.
3. The right-side phone preview immediately renders your headline, body copy + CTA, brand cover visual, and **OpenMotion** HTML5 animation (toggle `Cover / Motion` at the top of the phone frame).
4. Edit headlines/body inline inside the phone preview, or tweak individual pieces using **Rewrite Copy**, **New Cover**, or **New Motion**. Past drafts appear under **Recent Drafts** for instant reload.

### Step 2: 2-Stage Compliant Publishing (`02 Omni-Publish` & `03 AI Browser`)
- Click **Publish in AI Browser** (or **Save to Schedule** to queue it at the top of Omni-Publish).
- The Built-in AI Browser opens the platform creator center in an isolated Cookie partition and copies your draft.
- Click **Prefill Active Page** in the right AI Copilot panel, review visually, click Publish on the platform, and then click **Mark Published** to record ROI attribution.

### Step 3: Built-in AI Browser & Social Intent Radar (`04 Intent Radar`)
1. Open any social post in the **AI Browser** (or click **Open in AI Browser** from Intent Radar).
2. Click **Extract Comments → Radar** in the right AI Copilot (or **Extract Formula → Create** to rewrite a competitor's structure).
3. Intent Radar automatically preserves real commenter names, redacts PII (phones/emails/WeChat/URLs), scores S/A/B/C intent, runs **LLM Semantic Scoring**, and lets you prefill replies (stopping before Send) or click **+ Add to CRM**.
4. You can also click **Load Sample Comments** to test the full pipeline offline.

---

## 3. Global & China Outbound Prospecting (`05 Global & CN B2B` → `06 Lead CRM`)

- **China Mode**: Paste company names (one per line) to extract official websites, phones, and emails, or browse Amap/Baidu Maps in the AI Browser and click **Extract Companies → B2B**.
- **Global Mode**: Launch Google Maps, LinkedIn, Thomasnet, Europages, or Alibaba → extract companies → run **Website Enrichment + DNS MX Verification** → draft multilingual cold emails → send via local TLS/STARTTLS SMTP after human approval → save structured `company`, `email`, and `phone` directly to **Lead CRM**.

---

## 4. Lead CRM & Open-Source CRM Sync (`06 Lead CRM`)

- Switch between **Kanban**, **Table**, and **ROI** views; search/filter by tier; click any card to open the **Detail Drawer** to edit contact info, deal value, and notes; export CSV anytime.
- Click **Configure CRM** to connect self-hosted **Twenty CRM** (`twentyhq/twenty`), **Atomic CRM** (`marmelab/atomic-crm`, MIT), or any custom REST Webhook, then click **Sync to CRM**.

---

## 5. Hot-Pluggable Plugins & Local OpenMotion Studio (`07 Packs Market`)

- Install any `.bmpack` folder via **Install Local .bmpack** or click **Uninstall** on any card.
- All installed plugin skills are immediately available via `/` in **New Conversation** with automatic `zh-CN` / `en-US` localization.
- On the **OpenMotion Agentic Video Studio Plugin** card, click **Start Local Studio** to automatically clone, build, and launch `nexu-io/openmotion` locally (`http://localhost:3001`) for timeline editing and MP4 export.
