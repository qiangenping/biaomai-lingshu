# 参与贡献 — 标脉灵枢 AI 工作台（`biaomai-operations-platform`）

[English](./CONTRIBUTING.md) | 简体中文

感谢您关注并参与 **标脉灵枢（BiaoMai Lingshu）** 开源社区建设！

## 贡献方向

1. **行业扩展包与技能（`.bmpack` / `SKILL.md`）**：贡献本地办公、ToB 垂直行业工作流、CRM/ERP 连接器或中英双语获客技能。
2. **微内核能力增强**：优化 `packages/plugin-sdk`、`packages/plugin-runtime`、`packages/ai-browser`。
3. **多语言文档与文章**：完善 `docs/zh-CN/`、`docs/en/` 或新增其他语种翻译。
4. **缺陷反馈与需求建议**：通过 `.github/ISSUE_TEMPLATE/` 模板提交。

## 开源协议与 DCO 声明

- 本仓库全部贡献均以 **Apache License 2.0** 协议发布。
- **协议红线**：严禁引入任何 GPL、AGPL、LGPL 或商业受限协议依赖；提交 PR 前请务必运行 `node scripts/verify-licenses.mjs`。
- **必须签署 DCO（Developer Certificate of Origin）**：每次提交请附带 `-s` 参数声明版权归属：
  ```bash
  git commit -s -m "feat(plugin-sdk): 新增自定义画布钩子"
  ```

## 提交 PR 前自检

```bash
pnpm test
node scripts/verify-i18n.mjs
node scripts/verify-licenses.mjs
```
