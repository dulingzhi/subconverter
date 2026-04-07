# subconverter-node

使用 Node.js + TypeScript 重写的订阅转换工具

## 特性

- **多格式支持**: 支持 Clash、Surge、Quantumult X 等多种格式
- **TypeScript**: 类型安全，易于维护
- **高性能**: 基于 Fastify 构建
- **易于部署**: 支持 Docker 和多种部署方式

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 生产构建

```bash
npm run build
npm start
```

## 使用方法

### API 调用

#### 基本转换

```bash
# 转换为 Clash 格式
curl "http://localhost:25500/sub?url=https://example.com/sub"

# 转换为 Surge 格式
curl "http://localhost:25500/sub?url=https://example.com/sub&target=surge"

# 转换为 Quantumult X 格式
curl "http://localhost:25500/sub?url=https://example.com/sub&target=quanx"
```

#### 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| url | 订阅链接 | - |
| target | 目标格式 | clash |
| content | 直接传入订阅内容 | - |
| include | 包含节点名称匹配 | - |
| exclude | 排除节点名称匹配 | - |
| filter | 过滤节点名称 | - |
| sort | 是否排序节点 | false |
| rename | 重命名规则 (regex,replacement) | - |

### 支持的目标格式

- `clash` / `clashr` - Clash 配置
- `surge` / `surge2` / `surge3` / `surge4` / `surge5` - Surge 配置
- `quan` / `quantumult` - Quantumult 配置
- `quanx` / `quantumultx` - Quantumult X 配置
- `mellow` - Mellow 配置
- `ss` / `shadowsocks` - Shadowsocks 链接
- `v2ray` - V2Ray 链接
- `singbox` / `sing-box` - Sing-Box 配置
- `loon` - Loon 配置

## 配置

创建 `pref.toml`、`pref.yml` 或 `pref.ini` 文件：

### TOML 格式 (pref.toml)

```toml
[server]
listen_address = "0.0.0.0"
listen_port = 25500
max_concurrent_threads = 4
log_level = "info"
access_token = ""
api_mode = false
```

### YAML 格式 (pref.yml)

```yaml
server:
  listen_address: "0.0.0.0"
  listen_port: 25500
  max_concurrent_threads: 4
  log_level: "info"
```

### INI 格式 (pref.ini)

```ini
[server]
listen_address = 0.0.0.0
listen_port = 25500
max_concurrent_threads = 4
log_level = info
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| PORT | 监听端口 | 25500 |
| HOST | 监听地址 | 0.0.0.0 |
| API_TOKEN | API 访问令牌 | - |
| API_MODE | API 模式 | false |

## 项目结构

```
src/
├── api/           # API 路由和处理器
├── config/        # 配置加载
├── core/          # 核心转换逻辑
├── generator/     # 输出生成器
├── parser/        # 订阅解析器
├── types/         # TypeScript 类型定义
├── utils/         # 工具函数
└── index.ts       # 入口文件
```

## 支持的代理类型

- Shadowsocks (SS)
- ShadowsocksR (SSR)
- Vmess
- VLESS
- Trojan
- Hysteria / Hysteria2
- Snell

## License

GPL-3.0

## 致谢

本项目灵感来源于 [subconverter](https://github.com/tindy2013/subconverter)
