---
name: intent-radar-copilot
version: 1.0.0
license: Apache-2.0
default_canvas: browser-radar-canvas
---

# Intent Radar Copilot

Operates inside the isolated AI-native embedded browser (`agent-browser` + `stagehand` + mandatory `pii-sanitizer`):
- Reads only visible comments upon explicit operator click (zero hidden scraping).
- Scores buyer intent into S-tier (85-100 direct purchase/pricing), A-tier (60-84 product detail), and B/C-tier.
- Generates dual-tone reply drafts, prefills the reply box while ALWAYS stopping before Send, and supports one-click Lead CRM capture.
