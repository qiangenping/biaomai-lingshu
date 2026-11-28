# 5 分钟快速上手指南

## 环境要求
- **Node.js** `>= 22` 与 **pnpm** `>= 9`
- **Bun**（用于拉起 `AionUi` Electron 桌面端）
- **Docker**（可选 — **个人本地桌面端运行无需安装 Docker**）

## 1. 安装依赖并校验工程门禁
```bash
pnpm run setup
pnpm verify:all
```
该命令依次校验：中英双语词条对称性、Apache-2.0/MIT 协议合规、`.bmpack` 行业包完整性、TypeScript 类型检查、Vitest 单元测试及生产构建。

## 2. 一键启动零 Docker 桌面工作台
```bash
pnpm dev:aionui
```
启动后在左侧菜单点击 **「获客工作台」**。所有账号、草稿、外贸客户与 CRM 线索均安全保存在您本机 `userData/biaomai-studio-db.json` 中。

## 3. 配置您的本地模型与邮箱凭据（BYOK，密钥零上传）
点击右上角 **⚙️ 接口配置**：
1. **对话与文案大模型**：填入任意 OpenAI 兼容接口（DeepSeek / OpenAI / 本地 Ollama 等）。
2. **AI 生图接口**：可选，留空默认复用上方 Key。
3. **AiToEarn MCP**：可选，填入国内版/国际版/自建端点 `x-api-key` 即可开启 AI 视频生成与云端直发。
4. **外贸开发信 SMTP / IMAP & IM Webhook**：填入 Gmail 应用专用密码 / 飞书企业邮 / 阿里企业邮账号与授权码，以及可选的飞书/企微/钉钉机器人 Webhook。

## 4. 跑通 Inbound + Outbound 双引擎获客闭环
- **社媒 Inbound（`01 → 02 → 03`）**：AI 生成文案与配图 → 17 大平台独立 Cookie 隔离发布 → 隔离浏览器读取评论（强制脱敏）与竞品爆款拆解。
- **全球外贸 Outbound（`04 全球 B2B 寻客`）**：一键打开 Google Maps / LinkedIn / Europages → 提取真实企业 → 官网抓取邮箱并做 DNS MX 验真 → 生成 3 轮开发信与 WhatsApp 话术 → 人工确认直发并入库 `05 线索 CRM`。
