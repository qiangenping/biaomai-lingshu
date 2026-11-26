<p align="center">
  <a href="./README.md">English</a> | <strong>简体中文</strong>
</p>

# 标脉灵枢 AI 工作台（`biaomai-operations-platform`）

> **开源全球获客与可扩展 AI 桌面工作台（微内核 + 热插拔 `.bmpack` 行业生态）**
> 全栈采用 **Apache-2.0 / MIT** 商用安全协议，**个人下载免 Docker 即可本地运行**。将 **Inbound 全媒介内容获客（全球 17 大平台）** 与 **Outbound 全球外贸/全行业 B2B 主动寻客（Google Maps / LinkedIn / 欧美黄页 + 官网邮箱抓取与 DNS MX 验真 + 3 轮多语开发信与 IMAP 回信自动停发 + WhatsApp 话术填入）** 融为一体。

[![License](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](./LICENSE)
[![i18n](https://img.shields.io/badge/i18n-English%20%7C%20%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-indigo.svg)](./README.md)
[![Zero-Docker](https://img.shields.io/badge/Desktop-Zero--Docker%20Local-emerald.svg)](./docs/zh-CN/QUICKSTART.md)
[![CI](https://img.shields.io/badge/CI-6%20Quality%20Gates-success.svg)](./.github/workflows/ci.yml)

---

## 核心能力全景

### 1. Inbound 社媒内容获客矩阵（`pack-leadgen-ops`）
- **AI 内容创作工坊**：多平台文案生成、出海多语改写（中/英/日/西）、AI 封面配图及（可选 `AiToEarn MCP`）AI 短视频与多语配音进度跟踪。
- **17 大国内外媒介隔离直连**：基于 Electron `WebContentsView` + `persist:bm-acc-*` 独立 Cookie 分区，免服务器、免外部 Chrome 插件直连小红书、抖音、视频号、B站、快手、公众号、微博、知乎、百家号、TikTok、YouTube、LinkedIn、X、Instagram、Facebook、Threads、Pinterest。
- **实时意向雷达与竞品拆解**：一键提取隔离浏览器当前页面评论与竞品爆款结构，强制经 `pii-sanitizer` 脱敏手机号/微信号/邮箱，输出 `S/A/B/C` 分层并停在发送键前等待人工确认。

### 2. Outbound 全球外贸与全行业 B2B 主动寻客（`pack-global-b2b-outbound`）
- **全球多目录线索雷达**：一键拉起 **Google Maps、LinkedIn、Thomasnet（北美）、Europages（欧洲）、Alibaba** 隔离浏览器提取真实企业名录，并支持对接可选本地 **`Crawl4AI`（Apache-2.0）** 批量采集。
- **官网抓邮箱 + DNS MX 验真**：自动抓取目标企业官网 `/contact` `/about` 公开邮箱、电话与 WhatsApp 链接，并通过 `dns.resolveMx` 实时验证邮箱域名可投递性。
- **3 轮多语种开发信 + IMAP 回信自动停发**：AI 生成 Day 1 / Day 4 / Day 9 开发信与 WhatsApp 破冰序列；内置零第三方依赖 **TLS/STARTTLS SMTP**（每次发前强制弹窗人工确认）与 **TLS IMAP 回信检测**（客户回信自动停止后续跟进）。

### 3. 统一本地 CRM、定时巡检与微内核 `.bmpack` 生态
- **主进程原子持久化**：所有账号、排期、外贸客户与 5 阶段 CRM 线索（`新意向 → 已回复 → 已留资 → 商机 → 已成交`）安全落盘至本机 `userData/biaomai-studio-db.json`，支持 CSV 导出与爆款 ROI 归因裂变。
- **定时巡检 & IM 审批**：支持将每日获客汇总与待确认任务推送至**飞书 / 企业微信 / 钉钉 Webhook**。
- **四大官方 `.bmpack` 行业套件**：
  - `packs/pack-leadgen-ops` — 全球全自动社媒运营获客套件
  - `packs/pack-global-b2b-outbound` — 全球外贸与 B2B 主动获客套件
  - `packs/pack-crossborder-ecom` — 跨境电商与海外红人建联套件
  - `packs/pack-tob-bidding` — 标脉招投标与政企标讯获客套件

---

## 快速启动（免 Docker 桌面端即开即用）

**环境要求**：Node.js `>= 22`、pnpm `>= 9`、Bun。

```bash
git clone https://github.com/<org>/biaomai-operations-platform.git
cd biaomai-operations-platform
pnpm install
pnpm verify:all     # 运行全部 6 项门禁校验（i18n / 协议 / Pack / TS / 单测 / 构建）
pnpm dev:aionui     # 启动零 Docker Electron 桌面工作台
```

如需自行通过 Docker 部署 `AiToEarn` 后端中台（可选）：
```bash
pnpm docker:up
```

---

## 完整中文文档

- [5 分钟快速上手指南](./docs/zh-CN/QUICKSTART.md)
- [完整操作使用手册](./docs/zh-CN/USER_MANUAL.md)
- [本地私有化与云中继部署手册](./docs/zh-CN/DEPLOYMENT.md)
- [微内核架构设计](./docs/zh-CN/ARCHITECTURE.md)
- [插件 SDK 与 `.bmpack` 开发指南](./docs/zh-CN/PLUGIN_SDK_GUIDE.md)
- [安全声明](./SECURITY.md) | [隐私与合规红线](./PRIVACY_AND_COMPLIANCE.md) | [参与贡献](./CONTRIBUTING.zh-CN.md)

---

## 开源协议与致谢

主仓采用 **[Apache License 2.0](./LICENSE)**。所有依赖均由 `pnpm verify:licenses` 严格审计，确保全栈 **Apache-2.0 / MIT** 商用安全。详见 [NOTICE](./NOTICE) 与 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。
