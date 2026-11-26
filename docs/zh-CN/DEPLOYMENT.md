# 部署与桌面端打包手册

## 模式 0：免 Docker 本地桌面端（个人与开源用户默认推荐）

无需安装 Docker 或外部数据库，所有数据安全持久化在本机 `userData/biaomai-studio-db.json`：

```bash
pnpm install
pnpm verify:all   # 运行全量 6 项门禁校验（i18n / 协议 / Pack / TS / 单测 / 构建）
pnpm start        # 一键启动桌面端工作台（等效于 pnpm dev:aionui）
```

### 构建独立桌面安装包（Mac `.dmg` / Windows `.exe`）
```bash
pnpm dist:mac     # 打包 macOS 安装包
pnpm dist:win     # 打包 Windows 安装包
```

---

## 模式 A：云端 MCP 增强模式（可选）
1. 打开工作台 **「接口配置 → 3. AiToEarn MCP」**。
2. 选择国内版（`aitoearn.cn`）或国际版（`aitoearn.ai`），填入 `x-api-key` 并点击测试连通性即可启用 AI 短视频与云端短链统计。

---

## 模式 B：全栈 Docker 私有化部署（企业内网数据不出域）
```bash
pnpm docker:up
```
一键拉起 `vendor/aitoearn/docker-compose.yml`（MongoDB + Redis + RustFS + `aitoearn-server` + `aitoearn-ai`），在设置中选择「自建端点（`http://localhost:8080/api/unified/mcp`）」即可。
