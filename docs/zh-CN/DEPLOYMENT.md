# 部署与桌面端打包手册

## 模式 0：免 Docker 本地桌面端（个人与开源用户默认推荐）

无需安装 Docker 或外部数据库，所有数据安全持久化在本机 `userData/biaomai-studio-db.json`：

```bash
pnpm run setup
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

## 开源版与商业交付

| 交付方式 | 客户获得的价值 | 建议收费方式 |
| --- | --- | --- |
| 社区自托管 | 本地企业池、CRM、自选行业与语言、自带模型和渠道账号 | 工作台免费，客户直接承担模型与渠道费用 |
| 托管服务 | 运营方维护模型中继、插件版本与服务可用性 | 月订阅含额度，额外用量按成功调用结算 |
| 企业私有化 | 本地部署、行业目录适配、离线授权、培训与运维 | 实施费与年度支持费，OEM 单独约定 |

托管网关启动前需设置 `BILLING_ADMIN_TOKEN`、`LICENSE_SIGNING_SECRET`、`UPSTREAM_MCP_URL`，上游需要认证时另设 `UPSTREAM_MCP_API_KEY`。运营方通过受保护的管理接口签发客户 Key。客户在桌面端选择自建端点，填写网关的 `/api/unified/mcp` 地址与客户 Key。客户 Key 用于网关鉴权，上游服务使用运营方凭据。

现有 Stripe / 微信通知路由接收内部履约格式，并要求服务端管理令牌。对外开放收银台前，支付适配层须验证支付平台签名、核对订单金额和币种，并对重复通知执行幂等履约。当前版本适合人工核款后开通。席位、SLA、行业插件支持范围与价格在合同中约定。
