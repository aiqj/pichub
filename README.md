# PicHub

PicHub是一个基于Cloudflare R2存储、D1数据库和Workers的高性能图床解决方案，提供安全的图片上传、存储、管理和访问功能。

## 特性

- 支持多种图片格式：JPEG、PNG、WebP、GIF、SVG
- 文件大小限制：50MB
- 基于魔数的文件类型检测，防止文件类型伪造
- 自动文件哈希命名，保证唯一性
- 完整的元数据存储
- 优化的缓存策略
- 响应式UI界面
- CORS 跨域支持
- 安全的环境变量配置
- 用户账户管理系统
- 管理员控制面板
- 详细的上传记录与日志

## 项目结构

```
PicHub/
├── worker/              # Cloudflare Worker 后端代码
│   ├── index.js         # Worker主代码文件
│   ├── auth.js          # 授权、加解密功能
│   └── r2Analytics.js   # R2存储分析功能
├── page/                # Cloudflare Pages 前端代码（基于Next.js）
│   ├── components/      # 界面组件
│   ├── pages/           # 页面组件
│   ├── contexts/        # React上下文
│   ├── utils/           # 工具函数
│   ├── styles/          # 样式文件
│   └── README.md        # 前端说明
├── wrangler.toml        # Wrangler配置文件
├── DEPLOY.md            # 项目部署
└── README.md            # 项目概述
```

## 技术栈

- **后端**: Cloudflare Workers
- **数据库**: Cloudflare D1 (SQLite)
- **存储**: Cloudflare R2
- **前端**: Next.js, React, TailwindCSS

## 快速开始

详细的部署指南请参阅 [DEPLOY.md](DEPLOY.md)。

### 基本步骤

1. 创建 Cloudflare R2 存储桶
2. 创建并配置 D1 数据库
3. 配置 Worker 环境变量和 Secrets
4. 部署 Worker API 服务
5. 部署 Next.js 前端到 Pages

## 使用方法

### 普通用户
1. 注册并登录您的账户
2. 上传图片并获取 URL
3. 管理您的图片和个人资料

### 管理员
1. 使用管理员账户登录 (默认用户名: admin, 密码: 123456)
2. 首次登录后立即修改默认密码
3. 访问管理面板管理用户、文件和系统日志

## 数据库结构

PicHub使用Cloudflare D1数据库存储以下信息：

- **用户表**: 存储用户账户信息
- **文件表**: 存储上传文件的元数据
- **日志表**: 记录系统活动和用户操作

## 常见问题解决

### 跨域问题
如果遇到 CORS 错误，确保在 Worker 中设置了正确的 `CORS_ALLOW_ORIGIN` 环境变量。

### 图片上传成功但无法访问
检查 R2 存储桶绑定是否正确，确保存储桶名称与 wrangler.toml 中的配置一致。

### 环境变量相关错误
Worker 和 Pages 需要分别设置各自的环境变量，不会自动共享。

### 数据库连接问题
确保 D1 数据库已正确创建，并且 ID 与 wrangler.toml 中的配置一致。

## 安全注意事项

- 定期更新密钥和管理员密码
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
