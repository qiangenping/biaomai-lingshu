# Privacy & Platform Compliance Statement

`biaomai-operations-platform` is designed for **100% lawful, ethical, and platform-compliant** global operations and lead generation.

## Compliance Red Lines

1. **Official Authorization First**: Multi-platform publishing uses official OAuth 2.0 flows (via Server Relay or user-configured self-hosted OAuth credentials). The software never reverse-engineers platform signing algorithms or bypasses anti-bot protections.
2. **Visible Human-in-the-Loop Embedded Browser**:
   - The embedded Chromium browser operates strictly in visible foreground tabs driven by the operator.
   - Comment intent analysis is triggered only upon explicit user action on currently visible DOM content—never via hidden headless mass-scraping.
   - AI-drafted replies and form fills stop before the final **Publish / Send** action and require explicit human confirmation.
3. **Zero Non-Public PII Harvesting**:
   - Automated intent scoring processes only anonymized public comment text and interaction context.
   - Phone numbers, WeChat IDs, email addresses, and account UIDs are stripped automatically by `pii-sanitizer.ts` and are never harvested or exported.
   - Contact details enter the Lead CRM only when a prospect voluntarily submits them through an authorized form or direct inbound inquiry.
4. **Local-First Data Sovereignty**:
   - Community Edition stores sessions, drafts, and local CRM records strictly on the user's device with zero forced cloud telemetry.
