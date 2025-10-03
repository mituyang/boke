# Cloudflare Pages 部署指南（社区论坛）

本指南帮助你将本社区论坛部署到 Cloudflare Pages（含 Pages Functions + D1）。

## 前提条件

- Cloudflare 账户
- GitHub/GitLab 账户（用于 Git 集成）
- Node.js 18+ 和 npm
- Wrangler CLI（可选）

## 部署方式

### 方式一：Git 集成部署（推荐）

#### 1. 准备代码仓库

1. 将代码推送到 GitHub 或 GitLab：
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

#### 2. 连接 Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择 "Pages" 服务
3. 点击 "创建项目"
4. 选择 "连接到 Git"

#### 3. 配置构建设置

在 Cloudflare Pages 中设置以下构建配置：

- 项目名称: 你的站点名称
- 生产分支: `main`
- 构建命令: `npm run build`
- 构建输出目录: `out`
- 根目录: `/`（默认）

#### 4. 环境变量（可选）

如果需要环境变量，在 "设置" → "环境变量" 中添加：

```
NODE_VERSION=18.17.0
```

#### 5. 完成部署

点击 "保存并部署"，Cloudflare Pages 将自动：
- 克隆你的仓库
- 安装依赖
- 构建项目
- 部署到全球 CDN

### 方式二：Wrangler CLI 部署（推荐给有 CLI 经验的用户）

#### 1. 安装 Wrangler

```bash
npm install -g wrangler
```

#### 2. 登录 Cloudflare

```bash
wrangler login
```

#### 3. 本地构建

```bash
npm run build
```

#### 4. 部署到 Pages

```bash
wrangler pages deploy out --project-name=my-personal-blog
```
> 将 `my-personal-blog` 替换为你的 Pages 项目名。

#### 5. （可选）应用 D1 迁移

```bash
wrangler d1 execute personal-blog-db --file=./migrations/001-init.sql
wrangler d1 execute personal-blog-db --file=./migrations/005-likes-and-posts.sql
# 如果启用了聊天系统
wrangler d1 execute personal-blog-db --file=./migrations/011-chat-system.sql
```

## 自定义域名设置

### 1. 添加自定义域名

1. 在 Cloudflare Pages 项目中，进入 "自定义域"
2. 点击 "设置自定义域"
3. 输入你的域名（如 `forum.example.com`）

### 2. 配置 DNS

如果域名在 Cloudflare 托管：
- DNS 记录会自动添加

如果域名在其他服务商：
- 添加 CNAME 记录指向 `<project-name>.pages.dev`

### 3. SSL 证书

Cloudflare 会自动为你的自定义域名签发免费的 SSL 证书。

## 性能优化配置

### 1. 缓存策略

项目中的 `_headers` 文件已包含优化的缓存策略：

```
/*
  Cache-Control: public, max-age=0, must-revalidate

/static/*
  Cache-Control: public, max-age=31536000, immutable

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
```

### 2. 压缩优化

Cloudflare 自动启用：
- Gzip 压缩
- Brotli 压缩
- 图片优化（Polish）

### 3. 边缘缓存

利用 Cloudflare 的全球 CDN 网络，内容会被缓存到距离用户最近的边缘节点。

## 环境配置

### 开发环境

```bash
npm run dev
```

### 生产环境（本地调试服务，仅供验证，生产由 Pages 提供）

```bash
npm run build
npm run start
```

### 静态导出

```bash
npm run build
# 生成的静态文件在 out/ 目录
```

## 监控和分析

### 1. Web Analytics

在 Cloudflare Dashboard 中启用 Web Analytics：
1. 进入 "Analytics" → "Web Analytics"
2. 添加你的网站
3. 在 HTML 中添加跟踪代码

### 2. Core Web Vitals

Cloudflare Pages 提供内置的 Core Web Vitals 监控：
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)

### 3. 错误追踪

可以集成 Sentry 或其他错误追踪服务。

## 故障排查

### 常见问题

#### 1. 构建失败

**问题**: "Module not found" 错误
**解决**: 检查 `package.json` 中的依赖是否正确

**问题**: Node.js 版本不兼容
**解决**: 在环境变量中设置 `NODE_VERSION=18.17.0`

#### 2. 路由问题

**问题**: 直接访问子页面返回 404
**解决**: 使用静态导出并提供 `_redirects`，或确保 `next.config.js` 的 `output: 'export'` 保持一致。

#### 3. 样式加载失败

**问题**: Tailwind CSS 样式未生效
**解决**: 检查 `tailwind.config.js` 的 content 配置

### 调试技巧

1. **本地测试静态导出**:
```bash
npm run build
npx serve out
```

2. **检查构建日志**:
在 Cloudflare Pages 项目中查看构建日志

3. **预览部署**:
每个 Pull Request 都会创建预览部署

## 自动化部署

### GitHub Actions（可选）

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: my-personal-blog
          directory: out
```

## 安全配置

### 1. 安全头部

`_headers` 文件已包含基本的安全头部：
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

### 2. CSP（内容安全策略）

可以在 `_headers` 中添加 CSP 头部：

```
/*
  Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'
```

## 成本估算

Cloudflare Pages 免费套餐包括：
- 每月 100,000 次请求
- 无限带宽
- 全球 CDN
- 自动 SSL 证书

对于中小型社区站点，免费套餐通常已经足够。

## 下一步

部署完成后，你可以：

1. 设置自定义域名
2. 配置 Web Analytics
3. 优化 SEO 设置
4. 完善论坛分区与标签
5. 集成 Newsletter 订阅/通知

恭喜！你的社区论坛已部署到 Cloudflare Pages 并可全球访问。

## 新功能: 聊天室

### 概述
项目新增了实时聊天室功能，包括：
- 用户可以实时发送和接收消息
- 管理员可以删除任何用户的消息
- 简单的频率限制防止刷屏
- 移动端友好的界面设计

### 技术实现

#### 本地开发
- 使用Next.js API路由 (`app/api/chat/messages/route.ts`)
- 模拟数据存储在内存中
- 每2秒轮询获取新消息

#### 生产环境 (Cloudflare Pages)
- 使用Cloudflare Pages Functions (`functions/api/chat/messages.js`)
- 数据存储在Cloudflare D1数据库中
- 消息历史持久化保存

### 数据库表结构

已创建的表：
- `chat_rooms` - 聊天室信息
- `chat_messages` - 聊天消息记录
- `user_chat_settings` - 用户聊天设置

### 部署注意事项

1. **数据库迁移**: 确保运行了 `migrations/011-chat-system.sql`
2. **API路由**: 生产环境使用 `functions/api/chat/messages.js`
3. **实时通信**: 当前使用轮询，未来可以升级为WebSocket
4. **权限控制**: 仅登录用户可以访问聊天室

### 使用方法

1. 用户登录后可在导航栏看到"💬 聊天室"链接
2. 点击进入聊天室页面
3. 可以发送文本消息（最多500字符）
4. 管理员可以删除任何消息，普通用户只能删除自己的消息

### 未来改进

建议的增强功能：
- 使用Cloudflare Durable Objects实现真正的实时WebSocket通信
- 添加私聊功能
- 支持图片和文件分享
- 消息提及(@用户)功能
- 聊天记录搜索 