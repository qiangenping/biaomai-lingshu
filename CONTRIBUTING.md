# Contributing to BiaoMai Lingshu (`biaomai-operations-platform`)

English | [简体中文](./CONTRIBUTING.zh-CN.md)

Thank you for your interest in contributing to **BiaoMai Lingshu**!

## Ways to Contribute

1. **Industry Packs & Skills**: Build new `.bmpack` solutions (Local Office, ToB vertical workflows, CRM connectors) or bilingual `SKILL.md` files under `packs/`.
2. **Core Micro-Kernel Improvements**: Enhance `packages/plugin-sdk`, `packages/plugin-runtime`, or `packages/ai-browser`.
3. **Documentation & Translations**: Improve `docs/en/`, `docs/zh-CN/`, or add new language translations.
4. **Bug Reports & Feature Requests**: Use the structured templates in `.github/ISSUE_TEMPLATE/`.

## License & Developer Certificate of Origin (DCO)

- All contributions are licensed under the **Apache License 2.0**.
- **License Gate**: Never introduce GPL, AGPL, LGPL, or source-available commercial-restricted dependencies. Run `node scripts/verify-licenses.mjs` before opening a PR.
- **DCO Sign-off Required**: Every commit must include a `Signed-off-by` trailer certifying you have the right to submit the work under Apache-2.0:
  ```bash
  git commit -s -m "feat(plugin-sdk): add custom canvas hook"
  ```

## Pre-PR Checklist

```bash
pnpm test
node scripts/verify-i18n.mjs
node scripts/verify-licenses.mjs
```
