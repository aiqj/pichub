# PicHub 部署指南

本文档提供 PicHub 在 Cloudflare 平台上的完整部署流程及常见问题解决方案。

## 项目结构

- `worker/` - Cloudflare Workers 后端代码
- `page/` - Next.js 前端代码（部署到 Cloudflare Pages）

## 前提条件

1. 拥有 Cloudflare 账户
2. 已安装 Node.js (v16+) 和 npm
3. 命令行环境

## 步骤一：设置 Cloudflare R2

1. 登录 Cloudflare 控制台：https://dash.cloudflare.com/
2. 导航到 R2 存储服务
3. 创建新的 R2 存储桶，命名为 `pichub` 或你喜欢的名称
4. 记下存储桶名称，稍后需要用到

## 步骤二：设置 Cloudflare D1 数据库

1. 创建 D1 数据库：

```bash
npx wrangler d1 create pichub
```

2. 记下输出中的数据库 ID，并更新 `wrangler.toml` 中的 D1 配置：

```toml
[[d1_databases]]
binding = "DB"
database_name = "pichub"
database_id = "你的数据库ID"
```

3. 创建数据库表结构，创建一个名为 `schema.sql` 的文件，内容如下：

```sql
-- 用户表
CREATE TABLE users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	username TEXT UNIQUE NOT NULL,
	PASSWORD TEXT NOT NULL,
	email TEXT UNIQUE NOT NULL,
	avatar TEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	is_active BOOLEAN DEFAULT FALSE,
	role TEXT DEFAULT 'user' CHECK (role IN ( 'user', 'admin' )) 
);

-- 文件表
CREATE TABLE files (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL,
	file_name TEXT NOT NULL,
	original_name TEXT,
	file_size INTEGER,
	file_type TEXT,
	uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY ( user_id ) REFERENCES users ( id ) 
);

-- 日志表
CREATE TABLE logs (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER,
	username TEXT,
	action_type TEXT NOT NULL,
	action_detail TEXT NOT NULL,
	is_system BOOLEAN DEFAULT FALSE,
	timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

4. 应用数据库结构：

```bash
npx wrangler d1 execute pichub --file=schema.sql
```

5. 创建管理员账户，创建名为 `admin.sql` 的文件，内容如下（注意：实际部署时请使用强密码）：

```sql
-- 用户名/密码：admin/123456
INSERT INTO users (username, PASSWORD, email, is_active, role) 
VALUES ('admin', '4f16faa8333ef26a31fa39e46c777e895a87ccf4655003f096c9eab3184a5f8d', 'admin@example.com', TRUE, 'admin');
```

6. 执行管理员账户创建脚本：

```bash
npx wrangler d1 execute pichub --file=admin.sql
```

## 步骤三：安装依赖

克隆或下载项目后，在项目目录中运行：

```bash
npm install
```

## 步骤四：配置 Wrangler

1. 安装并登录 Wrangler CLI：

```bash
npm install -g wrangler
wrangler login
```

2. 修改 `wrangler.toml` 文件中的以下内容：

```toml
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "你的R2存储桶名称"  # 修改为你的实际R2存储桶名称
```

## 步骤五：配置并部署 Worker

1. Worker 代码位于 `worker/` 目录，部署 Worker：

```bash
npx wrangler deploy worker/index.js
```

或者，如果您的wrangler.toml已经正确配置，您可以简化命令为：
```bash
npx wrangler deploy
```
Wrangler会自动使用wrangler.toml中的入口点。

2. 确认 Worker 部署成功，并记下 Worker 的 URL（例如 `https://pichub.yourdomain.workers.dev`）

## 步骤六：配置并部署 Next.js 前端到 Pages

1. 进入 Next.js 前端目录：

```bash
cd page
```

2. 配置环境变量：
   - 创建或修改 `.env.local` 文件，设置 API 端点：
   ```
   NEXT_PUBLIC_API_HOST=https://你的worker地址.workers.dev
   ```

3. 构建项目：

```bash
npm run build
```

4. 部署到 Cloudflare Pages：

```bash
npx wrangler pages deploy .next/
```

## 步骤七：测试部署

1. 访问你的 Pages URL（例如 `https://pichub.pages.dev`）
2. 使用管理员账户（用户名: admin，密码: 123456）登录
3. **重要**: 首次登录后立即修改默认密码
4. 上传图片测试功能是否正常

## 数据库管理与维护

以下是一些常用的 D1 数据库管理命令：

```bash
# 查看数据库中的表
npx wrangler d1 execute pichub --command="SELECT name FROM sqlite_master WHERE type='table'"

# 备份数据库
npx wrangler d1 backup pichub ./backup.sql

# 执行自定义 SQL 查询
npx wrangler d1 execute pichub --command="SELECT * FROM users"

# 在本地开发环境使用远程数据库
npx wrangler dev --remote
```

## 常见问题及解决方案

### 1. 跨域 (CORS) 错误

**症状**：浏览器控制台显示类似 "Access to XMLHttpRequest has been blocked by CORS policy" 的错误。

**解决方案**：
- 确保 Worker 中的 `CORS_ALLOW_ORIGIN` 环境变量设置为 `*` 或包含你的 Pages 域名
- 确保 Worker 中正确处理 OPTIONS 请求

### 2. 401 Unauthorized 错误

**症状**：上传时收到 401 错误。

**解决方案**：
- 确保使用了正确的凭据进行认证
- 确保 Worker 中正确设置了必要的 secret 变量
- 使用以下命令重新设置 secret：
  ```bash
  wrangler secret put UPLOAD_API_TOKEN
  ```

### 3. "env is not defined" 错误

**症状**：上传时收到 "env is not defined" 错误。

**解决方案**：
- 检查 Worker 代码中所有函数是否正确接收和传递 `env` 参数
- 确保在使用环境变量的函数中，`env` 参数被正确传递

### 4. 上传成功但图片无法访问

**症状**：上传显示成功，但访问图片 URL 时出错。

**解决方案**：
- 检查 R2 存储桶名称是否与 wrangler.toml 中配置一致
- 确认 Worker 有正确的 R2 绑定和权限
- 检查 R2 存储桶中是否存在上传的文件

### 5. 前端无法获取 API 端点配置

**症状**：前端显示"系统配置错误"。

**解决方案**：
- 确保在 `.env.local` 文件中正确设置了 `NEXT_PUBLIC_API_HOST` 环境变量
- 检查前端代码是否正确使用环境变量

### 6. 数据库相关错误

**症状**：收到数据库连接或查询错误。

**解决方案**：
- 确保 D1 数据库已正确创建且 ID 与 wrangler.toml 中一致
- 检查表结构是否正确创建
- 验证是否有足够的权限执行数据库操作
- 使用 `wrangler d1 execute` 命令进行调试查询

## 本地开发与测试

在本地进行开发和测试：

```bash
# 使用 Miniflare 测试 Worker
npm run dev

# 启动 Next.js 开发服务器
cd page
npm run dev
```
