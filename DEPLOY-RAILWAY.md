# 部署到 Railway

## 前提条件

确保你的代码已经推送到 GitHub。

## 部署步骤

### 方式 1：通过 Railway 官网（推荐）

1. 访问 [railway.app](https://railway.app)
2. 登录（建议使用 GitHub 登录）
3. 点击 **"New Project"**
4. 选择 **"Deploy from GitHub repo"**
5. 选择 `subconverter` 仓库
6. Railway 会自动检测 `package.json` 并配置

### 方式 2：使用 Railway CLI

```bash
# 安装 CLI
npm install -g @railway/cli

# 登录
railway login

# 初始化项目
railway init

# 关联仓库
railway link

# 部署
railway up
```

## 环境变量

在 Railway 项目设置中配置：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 监听端口 | Railway 自动设置 |
| `HOST` | 监听地址 | `0.0.0.0` |
| `API_TOKEN` | API 访问令牌（可选） | - |
| `LOG_LEVEL` | 日志级别 | `info` |

## 启动命令

Railway 会自动检测 `package.json` 中的 `start` 脚本：

```json
{
  "scripts": {
    "start": "node dist/index.js"
  }
}
```

如果需要自定义启动命令，可以在 Railway 项目设置的 **Services → Command** 中修改。

## 使用示例

部署完成后，Railway 会提供一个公网 URL：

```bash
# 转换为 Clash 格式
curl "https://your-project.railway.app/sub?url=https://example.com/sub&target=clash"

# 转换为 Surge 格式
curl "https://your-project.railway.app/sub?url=https://example.com/sub&target=surge"

# 带过滤
curl "https://your-project.railway.app/sub?url=https://example.com/sub&exclude=广告&sort=true"
```

## 优势

相比 Vercel，Railway 的优势：

- ✅ **无网络限制** - 可以访问任意外部 URL
- ✅ **无超时限制** - 支持长时间运行的请求
- ✅ **免费额度充足** - $5/月免费额度
- ✅ **自动 HTTPS** - 自动提供 HTTPS 证书
- ✅ **持续运行** - 不会休眠

## 故障排除

### 构建失败

确保已提交 `package.json` 和 `package-lock.json`

### 启动失败

检查日志：
```bash
railway logs
```

### 端口问题

Railway 会自动注入 `PORT` 环境变量，无需手动配置。
