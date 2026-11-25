# 本地 Docker 私有化与云中继部署手册

## 模式 A：官方云中继模式（免运维、免申请平台资质）
1. 在顶部切换至 `cn-official`（国内版）或 `global-official`（国际版）。
2. 进入「设置 → 区域与 Relay」，填入对应区域 API Key（经操作系统安全存储分环境加密隔离，互不覆盖）。

## 模式 B：全栈本地 Docker 私有化部署（数据 100% 不出域）
```bash
pnpm docker:up
```
该命令一键拉起 `vendor/aitoearn/docker-compose.yml` 完整业务中台：
- MongoDB（rs0 副本集）+ Redis + RustFS（对象存储）
- `aitoearn-server`（渠道管理、发布队列、归因短链、Unified MCP）
- `aitoearn-ai`（多模态创作与模型路由）

启动后在桌面端切换至 `self-hosted` 模式，点击「测试连接」验证 `http://localhost:8080/api/unified/mcp` 返回成功即可使用。
