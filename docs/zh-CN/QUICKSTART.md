# 5 分钟快速上手指南

## 环境要求
- **Node.js** `>= 22` 与 **pnpm** `>= 9`
- **Docker**（可选，仅「本地 Docker 私有化」模式需要）
- **OpenCode** 或 **Codex** CLI（可选，未安装时可直接使用 AionUi 内置零配置 Agent）

## 1. 一键初始化与校验
```bash
pnpm bootstrap
```
脚本将自动安装依赖并依次运行：中英双语键对称校验、Apache-2.0/MIT 开源协议门禁、TypeScript 类型检查与自动化单元测试。

## 2. 选择运行区域环境（支持与中英文自由组合）
在顶部控制栏或 `config/` 目录切换三套环境配置：
- `config/china.profile.json` — 国内 6 大平台（抖音、小红书、快手、B站、视频号、公众号）
- `config/global.profile.json` — 国际 8 大平台（TikTok、YouTube、Instagram、Facebook、Threads、X、Pinterest、LinkedIn）
- `config/self-hosted.profile.json` — 本地私有化 Docker 栈（运行 `pnpm docker:up` 启动）

## 3. 跑通首条全自动运营获客闭环
1. 在左侧专家广场选择 **「全链路获客增长总监」**。
2. 输入指令：*“围绕企业私有化 AI 办公痛点，生成 3 篇带 CTA 钩子与归因短链的小红书获客笔记并排期到明早 9 点。”*
3. 在右侧 **获客预览** 画布微调文案，点击 **加入排期日历** 并确认审批。
4. 切换至右侧 **AI 浏览器雷达** 画布，选择独立隔离账号登录目标平台，打开帖子评论区点击 **「AI 意向雷达分析当前页」**，人工确认回填高意向回复并一键加入 **线索 CRM**。
