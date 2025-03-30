# PicHub - 图港

PicHub是一个基于Cloudflare R2存储和Workers的高性能图床解决方案，提供安全的图片上传、存储和访问功能。

## 特性

- 支持多种图片格式：JPEG、PNG、WebP、GIF、SVG
- 文件大小限制：50MB
- 基于魔数的文件类型检测，防止文件类型伪造
- API Token验证机制，防止时序攻击
- 自动文件哈希命名，保证唯一性
- 完整的元数据存储
- 优化的缓存策略
- 响应式UI界面
- CORS 跨域支持
- 安全的环境变量配置

## 项目结构

```
PicHub/
├── worker/              # Cloudflare Worker代码
│   └── index.js         # Worker主代码文件
├── src/                 # 前端源代码
│   ├── index.html       # 主HTML文件
│   ├── css/             # 样式文件
│   │   └── style.css    # 主样式表
│   └── js/              # JavaScript文件
│       └── app.js       # 主应用代码
├── functions/           # Cloudflare Pages函数
│ └── _middleware.js     # 页面中间件（注入环境变量）
└── wrangler.toml        # Wrangler配置文件
```

## 快速开始

详细的部署指南请参阅 [DEPLOY.md](DEPLOY.md)。

### 基本步骤

1. 创建 Cloudflare R2 存储桶
2. 配置 Worker 环境变量和 Secrets
3. 部署 Worker API 服务
4. 配置 Pages 环境变量
5. 部署 Pages 前端

## 使用方法

1. 访问您部署的 Pages 网站
2. 使用 API Token 进行认证
3. 上传图片并获取 URL

## 常见问题解决

### 跨域问题
如果遇到 CORS 错误，确保在 Worker 中设置了正确的 `CORS_ALLOW_ORIGIN` 环境变量。

### 401 Unauthorized
验证 API Token 是否正确设置为 Worker 的 Secret，名称必须为 `UPLOAD_API_TOKEN`。

### 图片上传成功但无法访问
检查 R2 存储桶绑定是否正确，确保存储桶名称与 wrangler.toml 中的配置一致。

### 环境变量相关错误
Worker 和 Pages 需要分别设置各自的环境变量，不会自动共享。

## 安全注意事项

- 保护您的 API Token
- 定期更新密钥
- 使用环境变量存储敏感信息，避免硬编码
- 考虑设置允许的域名列表以防止盗链
- 适当配置防盗链功能，限制图片资源的引用域 

## 防盗链配置

PicHub 支持防盗链功能，可以限制只有特定域名可以引用您的图片资源：

1. 在 wrangler.toml 中设置 `ALLOWED_REFERERS` 环境变量
2. 值可以是域名列表，用逗号分隔，如："example.com,yoursite.org"
3. 设置为 "*" 允许所有域名引用（默认值）
4. 可选设置 `DEFAULT_IMAGE` 指定一个已上传的图片作为未授权引用时显示的替代图片

防盗链使用 HTTP Referer 头进行检查，因此并非 100% 可靠，但可以阻止大多数盗链情况。 
