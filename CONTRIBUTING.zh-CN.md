# 参与全球共建 — 标脉灵枢（`opengrowth`）

[English](./CONTRIBUTING.md) | 简体中文

欢迎加入 **标脉灵枢（OpenGrowth）** 全球开源社区！我们的目标是联合全球开发者、增长工程师、设计师与出海实战团队，共同打造一套**零 Docker、本地优先、完全开源的全球 AI 获客与全渠道增长工作台**。

无论你是接入一个海外/本地新渠道、翻译一套多语言界面、开发一个 CRM 连接器、沉淀一套行业 `.bmpack` 实战剧本，还是优化底层微内核与内置 AI 浏览器，你的每一次 PR 都在直接帮助全球创业者降本增效。

---

## 15 分钟完成你的第一次贡献

### 1. Fork 并克隆仓库
```bash
git clone https://github.com/<你的用户名>/opengrowth.git
cd opengrowth
pnpm install
```

### 2. 运行全量质量门禁
```bash
pnpm verify:all
```
一键校验 6 大门禁：
1. `verify:i18n` — 双语键名对称校验
2. `verify:licenses` — Apache-2.0 / MIT 协议合规与治理文件校验
3. `verify:packs` — `.bmpack` 插件清单与文件完整性校验
4. `tsc --noEmit` — TypeScript 类型检查
5. `vitest run` — 单元测试与集成测试
6. `@biaomai/workbench build` — 工作台生产构建检查

### 3. 本地启动工作台
```bash
pnpm dev:workbench
```

---

## 4 大高价值共建赛道

前往 [全球路线图](./ROADMAP.md) 或 [Good First Issues](https://github.com/qiangenping/opengrowth/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) 认领任务：

| 共建赛道 | 贡献内容示例 | 代码位置 | 难度 |
| :--- | :--- | :--- | :--- |
| **A. 全球渠道适配** | 接入 WhatsApp Business、Telegram、Threads、Bluesky、LINE、KakaoTalk、Pinterest 等 | `apps/workbench/src/components/OmniPublishTab.tsx`、`AiBrowserTab.tsx`、`packages/ai-browser/` | 入门–中级 |
| **B. CRM 与 B2B 连接器** | 接入 HubSpot、Salesforce、Pipedrive、Notion、Airtable、飞书多维表格、B2B 数据导入 | `apps/workbench/src/components/LeadCrmTab.tsx`、`LeadDiscoveryTab.tsx`、`packs/plugin-oss-*/` | 中级 |
| **C. `.bmpack` 行业剧本** | 沉淀 SaaS 出海、独立站/Shopify、代理商获客、本地服务等行业技能（`SKILL.md`） | `packs/plugin-*/`（详见 [插件开发指南](./docs/zh-CN/PLUGIN_SDK_GUIDE.md)） | 入门 |
| **D. 全球多语言（i18n）** | 新增西班牙语、日语、德语、韩语、葡语、法语、阿拉伯语、越南语、印尼语界面与文档 | `apps/workbench/src/i18n/`、`docs/` | 入门 |

---

## 协议红线、合规边界与 DCO 声明

1. **Apache License 2.0**：本仓库全部贡献均以 **Apache-2.0** 协议开源。
2. **协议红线**：严禁引入任何 GPL、AGPL、LGPL 或商业受限协议依赖；PR 前必须通过 `node scripts/verify-licenses.mjs`。
3. **人机协同合规原则**：内置 AI 浏览器适配禁止绕过验证码、突破平台鉴权或抓取受限隐私数据；最终发布动作坚持人工确认或调用平台官方接口。
4. **必须签署 DCO（Developer Certificate of Origin）**：每次提交请附带 `-s` 参数声明版权归属：
   ```bash
   git commit -s -m "feat(channels): 新增 Telegram 渠道适配器"
   ```

---

## 提交 PR 前自检清单

- [ ] 本地运行 `pnpm verify:all` 且 6 项门禁全部通过
- [ ] 提交记录附带 `git commit -s` DCO 签名
- [ ] 如有新增用户可见功能，已同步更新相关文档
- [ ] 在 PR 描述中关联对应 Issue（如 `Closes #1`）

---

## 社区交流与维护者联系

- **GitHub Discussions（社区讨论区）**：https://github.com/qiangenping/opengrowth/discussions
- **Issues 与需求提案**：https://github.com/qiangenping/opengrowth/issues
- **官方网站**：https://biao5fen.com
- **维护者邮箱**：`genpingqian@gmail.com`
