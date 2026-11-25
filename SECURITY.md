# Security Policy

## Supported Versions

| Version | Supported |
| :--- | :--- |
| `1.x` (main) | Yes |

## Security Architecture & Boundaries

1. **OS-Level Credential Encryption**: API keys, OAuth tokens, and Relay credentials are encrypted at rest via Electron `safeStorage` (macOS Keychain / Windows DPAPI / Linux Secret Service) and isolated per environment (`cn-official`, `global-official`, `self-hosted`). Credentials are never written in plaintext to logs or telemetry.
2. **Declarative Plugin Permissions**: Every Skill, MCP Server, and Industry Pack (`.bmpack`) declares its required capabilities (`fs.read`, `fs.write`, `net.domains`, `browser.cdp`, `shell.exec`, `im.notify`). High-risk external write actions enforce `Always Ask` Human-in-the-Loop approval.
3. **Isolated Embedded Browser Sessions**: Each social account runs inside an isolated Electron session partition (`persist:bm-acc-<platform>-<id>`), preventing cross-account cookie leakage.
4. **Zero-PII Sanitization**: Embedded browser comment extraction passes through `packages/ai-browser/src/pii-sanitizer.ts`, stripping phone numbers, WeChat IDs, emails, and user profile URLs before LLM scoring or CRM storage.

## Reporting a Vulnerability

Please do **not** open public GitHub issues for security vulnerabilities. Report privately via GitHub Security Advisories or email `security@biaomai.ai`. We acknowledge reports within 48 hours and provide a remediation timeline within 5 business days.
