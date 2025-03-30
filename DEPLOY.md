# PicHub 部署指南

本文档提供 PicHub 在 Cloudflare 平台上的完整部署流程及常见问题解决方案。

## 前提条件

1. 拥有 Cloudflare 账户
2. 已安装 Node.js (v16+) 和 npm
3. 命令行环境

## 步骤一：设置 Cloudflare R2

1. 登录 Cloudflare 控制台：https://dash.cloudflare.com/
2. 导航到 R2 存储服务
3. 创建新的 R2 存储桶，命名为 `pichub` 或你喜欢的名称
4. 记下存储桶名称，稍后需要用到

## 步骤二：安装依赖

克隆或下载项目后，在项目目录中运行：

```bash
npm install
```

## 步骤三：配置 Wrangler

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

## 步骤四：生成安全的 API Token

执行以下命令生成一个安全的 API Token：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

记下生成的随机字符串，这将是你的 API Token。

## 步骤五：配置并部署 Worker

1. 将 API Token 添加到 Cloudflare 环境变量（**注意变量名必须正确**）：

```bash
# 正确的命令格式
wrangler secret put UPLOAD_API_TOKEN
# 在提示后输入你的API Token值
```

2. 部署 Worker：

```bash
npx wrangler deploy worker/index.js
```

3. 确认 Worker 部署成功，并记下 Worker 的 URL（例如 `https://pichub.yourdomain.workers.dev`）

## 步骤六：配置并部署 Pages 前端

1. 创建 Pages 的 Functions 目录结构（如果尚未创建）：

```bash
mkdir -p functions
```

2. 创建 `functions/_middleware.js` 文件，用于注入环境变量：

```javascript
export async function onRequest(context) {
  const response = await context.next();
  
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }
  
  const originalHtml = await response.text();
  const apiEndpoint = context.env.API_ENDPOINT || '';
  
  const envScript = `
    <script>
      window.ENV = {
        API_ENDPOINT: "${apiEndpoint}"
      };
    </script>
  `;
  
  const modifiedHtml = originalHtml.replace('</head>', `${envScript}</head>`);
  
  return new Response(modifiedHtml, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText
  });
}
```

3. 部署 Pages：

```bash
npx wrangler pages deploy src --project-name=pichub
```

4. **重要**：在 Cloudflare 控制台中为 Pages 设置环境变量
   - 进入 Workers & Pages > 你的 Pages 项目 > Settings > Environment variables
   - 添加变量 `API_ENDPOINT`，值设为你的 Worker URL（例如 `https://pichub.yourdomain.workers.dev`）
   - 应用于 Production 环境

## 步骤七：测试部署

1. 访问你的 Pages URL（例如 `https://pichub.pages.dev`）
2. 在认证界面输入你的 API Token
3. 上传图片测试功能是否正常

## 常见问题及解决方案

### 1. 跨域 (CORS) 错误

**症状**：浏览器控制台显示类似 "Access to XMLHttpRequest has been blocked by CORS policy" 的错误。

**解决方案**：
- 确保 Worker 中的 `CORS_ALLOW_ORIGIN` 环境变量设置为 `*` 或包含你的 Pages 域名
- 确保 Worker 中正确处理 OPTIONS 请求

### 2. 401 Unauthorized 错误

**症状**：上传时收到 401 错误。

**解决方案**：
- 确保使用了正确的 API Token 进行认证
- 确保 Worker 中正确设置了 `UPLOAD_API_TOKEN` secret 变量
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
- 确保在 Pages 项目中正确设置了 `API_ENDPOINT` 环境变量
- 确保 `functions/_middleware.js` 正确注入环境变量
- 检查前端代码是否正确读取 `window.ENV.API_ENDPOINT`

## 本地开发与测试

在本地进行开发和测试：

```bash
# 使用 Miniflare 测试 Worker
npm run dev

# 开发前端 Pages 组件
npm run dev:pages
```

## 安全提示和最佳实践

1. **API Token 管理**：
   - 定期更换 API Token
   - 不要在公共场合分享或暴露 Token

2. **环境变量**：
   - 敏感信息使用 Secrets 存储，不要使用普通环境变量
   - Worker 和 Pages 需要分别设置各自的环境变量

3. **错误处理**：
   - 生产环境中不要返回详细的错误堆栈
   - 为调试目的可添加详细日志，但上线前移除

4. **定期更新**：
   - 定期更新 wrangler 和其他依赖
   - 关注 Cloudflare 安全公告 