---
name: twenty-crm-sync
description: 将标脉灵枢捕获的高意向线索同步至自建 Twenty CRM 或 Atomic CRM
---

# Twenty / Atomic 开源 CRM 同步技能

1. 在「05 线索 CRM -> 配置开源 CRM」填入 Twenty CRM（`http://localhost:3000`）或 Atomic CRM 地址与 Bearer Token。
2. 对 S/A 级高意向线索优先补充公司名、邮箱、电话与预估成交金额。
3. 点击「推送至 Twenty」将线索写入 `/rest/people` 或 `/rest/v1/contacts`。
