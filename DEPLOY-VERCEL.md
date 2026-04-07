# 部署到 Vercel

## 前提条件

1. 安装 Vercel CLI:
```bash
npm install -g vercel
```

2. 登录 Vercel:
```bash
vercel login
```

## 部署步骤

### 方式 1：使用 CLI（推荐）

```bash
# 1. 进入项目目录
cd subconverter

# 2. 部署到预览环境
vercel

# 3. 部署到生产环境
vercel --prod
```

### 方式 2：GitHub 集成

1. 将代码推送到 GitHub
2. 访问 [vercel.com](https://vercel.com)
3. 连接 GitHub 账号并导入项目
4. Vercel 会自动检测配置并部署

### 方式 3：GitLab / Bitbucket

1. 在 Vercel 连接你的 GitLab/Bitbucket 账号
2. 导入项目
3. 自动部署

## 环境变量

在 Vercel 项目设置中配置以下环境变量：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 监听端口 | `8080` (Vercel 自动设置) |
| `HOST` | 监听地址 | `0.0.0.0` |
| `API_TOKEN` | API 访问令牌 | 无 |
| `LOG_LEVEL` | 日志级别 | `info` |

## 使用示例

```bash
# 转换为 Clash 格式
curl "https://your-project.vercel.app/sub?url=https://example.com/sub&target=clash"

# 转换为 Surge 格式
curl "https://your-project.vercel.app/sub?url=https://example.com/sub&target=surge"

# 带过滤
curl "https://your-project.vercel.app/sub?url=https://example.com/sub&exclude=广告&sort=true"
```

## 注意事项

### Vercel 限制

- **超时限制**: Serverless Functions 最大执行时间 10 秒（免费版）
- **冷启动**: 首次访问可能有 1-3 秒延迟
- **无持久连接**: 不能运行长期 WebSocket 连接
- **请求大小**: 最大 4.5MB (免费版) / 6MB (付费版)

### 建议

1. **订阅链接**: 确保源订阅响应速度快，避免超时
2. **节点数量**: 建议单次转换节点数不超过 100 个
3. **缓存**: 对于频繁请求的订阅，建议使用缓存

## 本地测试

```bash
# 安装 Vercel CLI
npm install -g vercel

# 本地运行 Vercel 函数
vercel dev
```

## 故障排除

### 构建失败

确保已安装所有依赖：
```bash
npm install
```

### 运行时错误

检查日志：
```bash
vercel logs
```

### 超时问题

如果转换超时，可以：
1. 减少节点数量
2. 升级 Vercel 套餐
3. 考虑使用其他平台（Railway、Render 等）
