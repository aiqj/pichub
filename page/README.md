# PicHub - 科幻风格图像管理系统

PicHub是一个现代化的图像管理系统，提供美观的科幻风格UI界面和强大的图像存储功能。

## 特性

- **科幻风格UI界面**：采用暗色主题和科幻元素设计
- **多格式支持**：支持JPEG、PNG、WebP、GIF、SVG等多种图像格式
- **文件大小限制**：支持最大50MB的文件上传
- **响应式设计**：完全适配移动端和桌面浏览器
- **代码生成**：自动生成URL、HTML和Markdown代码
- **用户管理**：支持用户注册、登录和权限管理
- **文件管理**：轻松管理您的所有图像文件

## 技术栈

- **前端**：React.js、Next.js、TypeScript
- **样式**：TailwindCSS
- **API通信**：Axios
- **认证**：JWT (JSON Web Token)

## 快速开始

### 前提条件

- Node.js (v14+)
- npm 或 yarn

### 安装依赖

```bash
# 安装依赖
npm install
# 或
yarn install
```

### 环境变量配置

创建`.env.local`文件，添加如下配置：

```
NEXT_PUBLIC_API_HOST=https://pichub.8008893.workers.dev
```

### 启动开发服务器

```bash
npm run dev
# 或
yarn dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
page/
├── components/          # 组件
│   ├── ui/              # UI组件
│   └── layout/          # 布局组件
├── contexts/            # React上下文
├── pages/               # 页面组件
│   ├── admin/           # 管理员页面
│   └── _app.tsx         # 应用入口
├── public/              # 静态资源
├── styles/              # 样式
├── types/               # 类型定义
└── utils/               # 工具函数
```

## 页面说明

- `/` - 主页和上传页面
- `/login` - 用户登录
- `/register` - 用户注册
- `/files` - 用户文件管理
- `/admin` - 管理员控制面板
- `/admin/users` - 用户管理
- `/admin/files` - 文件管理

## 许可证

MIT
