# Complete Operator Manual

## 1. Workbench Overview & Collapsible Menu

BiaoMai Lingshu (`biaomai-operations-platform`) launches directly into the **Global Lead-Gen Studio** (`/leadgen`). All core modules are organized in the **left collapsible sidebar** under **Lead-Gen Studio**:

- **Inbound Growth**:
  - `Create Studio` — AI multi-platform copywriting, localization, cover visuals, AI short-video progress, and realistic mobile preview.
  - `Omni-Publish` — 17 isolated channel containers (`persist:bm-acc-*`), schedule queue, and Human-in-the-Loop publish confirmation.
  - `Intent Radar` — Live isolated browser comment extraction (`pii-sanitizer`), competitor formula extraction, and LLM semantic reranking.
- **Outbound B2B**:
  - `Global & CN B2B` — Domestic CN company bulk lookup + Amap/Baidu Map extraction + Global Google Maps/LinkedIn/Directories + `dns.resolveMx` verification + 3-step multilingual cold email & WhatsApp sequences + IMAP reply auto-stop.
- **Convert & Ecosystem**:
  - `Lead CRM` — 5-stage funnel (`New → Engaged → Qualified → Opportunity → Won`), ROI attribution, post re-spin, and CSV export.
  - `Packs Market` — Built-in official `.bmpack` industry packs, 5 bilingual foreign OSS plugins, and local `.bmpack` installer.

Use the **Industry Switcher** in the top-left of the workspace to load presets for *Global Manufacturing & Trade*, *Cross-Border E-Commerce*, *Enterprise ToB & Public Tenders*, *Local Services*, or *B2B SaaS*.

---

## 2. Step-by-Step Setup (`Settings`)

Click **Settings** in the top-right header. All credentials remain strictly on your local machine:

1. **LLM Provider**: Enter any OpenAI-compatible Base URL, Model, and API Key (e.g., DeepSeek, OpenAI, or local Ollama `http://localhost:11434/v1`).
2. **Image Provider (Optional)**: Leave API Key blank to reuse your LLM key if compatible.
3. **AiToEarn MCP (Optional)**: Configure CN (`aitoearn.cn`), Global (`aitoearn.ai`), or Self-Hosted MCP `x-api-key` for cloud publishing, AI video generation, and short-link click sync.
4. **Outbound SMTP / IMAP & IM Webhook**:
   - **SMTP**: e.g. `smtp.163.com:465`, `smtp.qq.com:465`, or `smtp.gmail.com:465` with your App Password / authorization code.
   - **IMAP**: e.g. `imap.163.com:993` (built-in RFC 2971 `ID` command support for NetEase mailboxes) or `imap.gmail.com:993`.
   - **IM Webhook**: Feishu, WeCom, or DingTalk bot webhook URL for daily digest pushes.
   - **Crawl4AI URL (Optional)**: Local `http://localhost:11235/crawl` endpoint for batch directory scraping.

---

## 3. Running Inbound Social Lead-Gen (`Create → Publish → Radar`)

1. **Create**: Pick your target platform and output language (`zh-CN`, `en-US`, `ja-JP`, `es-ES`). Enter your product pitch and click **Generate Copy**, **Cover Visual**, or **AI Video**. Edit the headline/body directly inside the right-hand phone preview, then click **Save & Continue to Publish**.
2. **Publish**: Create isolated account containers (or use default per-platform partitions), log in once inside the isolated browser window, and click **Publish** after reviewing the Human-in-the-Loop confirmation dialog.
3. **Radar**: Open any post in the isolated browser and click **Extract Live Browser Comments** (strips phones/emails/WeChat IDs automatically via `pii-sanitizer`) or **Extract Competitor Formula** to send winning post structures back to `Create Studio`. Click **Prefill Browser** to populate replies (strictly stopping before Send) and **Add to CRM** for high-intent buyers.

---

## 4. Running Domestic CN & Global B2B Outbound (`Prospector`)

1. **Domestic CN Mode (`CN Company & Map`)**:
   - Paste one or more Chinese company names (one per line) and click **Lookup CN Companies** to discover official websites, mobile/400/landline numbers, and public emails.
   - Or click **Amap (CN)** / **Baidu Map** to search local businesses in the isolated browser, then click **Extract from Browser**.
2. **Global B2B Mode (`Global B2B`)**:
   - Enter industry keywords and target country, launch **Google Maps**, **LinkedIn**, **Thomasnet**, **Europages**, or **Alibaba**, and click **Extract from Browser**.
3. **Enrich, Draft & Send**:
   - Click **Enrich & MX Verify** to crawl `/contact` & `/about` pages and verify domain MX records (`dns.resolveMx`).
   - Click **Draft Cold Email** to generate a 3-step sequence (Day 1 Icebreaker, Day 4 Follow-up, Day 9 WhatsApp).
   - Click **Confirm & Send SMTP** (requires manual confirmation), **Prefill WhatsApp/LinkedIn** (stops before Send), and **Check IMAP Replies** to automatically halt sequences when a prospect replies.

---

## 5. Lead CRM, ROI Attribution & 24/7 Cron

- **CRM Funnel**: Advance leads across 5 stages and export all records to `biaomai-leads.csv`.
- **ROI Attribution**: Sync short-link clicks and click **Re-spin Post** to iterate on top-performing content.
- **Cron & IM**: Click **Cron** in the header to toggle daily monitoring, run immediate IMAP reply checks, and push summary digests to Feishu/WeCom/DingTalk.
