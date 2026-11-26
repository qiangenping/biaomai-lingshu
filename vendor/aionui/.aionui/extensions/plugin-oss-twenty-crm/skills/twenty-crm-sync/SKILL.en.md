---
name: twenty-crm-sync
description: Sync qualified leads from BiaoMai Lingshu to self-hosted Twenty CRM or Atomic CRM
---

# Twenty / Atomic Open-Source CRM Sync

1. Configure your self-hosted Twenty CRM (`http://localhost:3000`) or Atomic CRM endpoint and Bearer API key under **05 Lead CRM -> Configure CRM**.
2. Enrich S/A-tier leads with company, email, phone, and deal value in the Lead Detail Drawer.
3. Push leads directly to `/rest/people` (Twenty) or `/rest/v1/contacts` (Atomic CRM).
