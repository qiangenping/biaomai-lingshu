---
name: intent-radar-copilot
version: 1.0.0
license: Apache-2.0
default_canvas: browser-radar-canvas
---

# 评论区意向雷达副驾驶

运行于 AI 原生内置隔离浏览器之上（`agent-browser` + `stagehand` + 强制 `pii-sanitizer`）：
- 仅在用户主动浏览并点击「AI 意向雷达分析当前页」时读取当前可见评论；
- 按 S 级（85~100 强询价/求链接）、A 级（60~84 产品咨询）、B/C 级分层；
- 为 S/A 级生成双风格回复草稿，点击「采纳并填入回复」后自动停在发送键前等待人工确认，并支持一键入库 CRM。
