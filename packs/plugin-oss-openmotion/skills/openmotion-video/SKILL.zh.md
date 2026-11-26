---
name: openmotion-video
description: 基于 Apache-2.0 开源项目 nexu-io/openmotion 的可编辑 Motion.md 分镜与动效视频生成技能。
---

# OpenMotion 动效视频工坊插件 (nexu-io/openmotion)

1. 在「01 内容创作」点击「OpenMotion 动效视频」，系统会自动按目标平台画幅（`3:4`、`9:16`、`16:9` 等）生成 `Motion.md` 分镜脚本与自包含 HTML5 动效预览工程。
2. 如本地已启动 `nexu-io/openmotion` Studio（默认 `http://localhost:3001`），将优先对接其 `/api/projects` 接口并支持 FFmpeg/Chromium 导出 MP4。
3. 也可通过 `npx skills add nexu-io/openmotion --skill openmotion` 在本地独立运行完整版 OpenMotion Studio。
