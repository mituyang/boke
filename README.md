# 个人博客

这是一个使用 Next.js、TypeScript 和 Tailwind CSS 构建的现代化个人博客，适合部署到 Cloudflare Pages。

## 功能特性

- ✨ **现代化技术栈** - Next.js 14 + TypeScript + Tailwind CSS
- 📱 **响应式设计** - 适配各种设备和屏幕尺寸
- 📝 **Markdown 支持** - 使用 Markdown 编写博客文章
- 🏷️ **标签系统** - 文章分类和检索
- ⚡ **静态生成** - 极快的加载速度
- 🔍 **SEO 优化** - 良好的搜索引擎优化
- 🎨 **美观界面** - 简洁现代的设计风格

## 技术栈

- **框架**: Next.js 14
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **内容**: Markdown + Gray Matter
- **部署**: Cloudflare Pages

## 快速开始

### 1. 克隆项目

\`\`\`bash
git clone <your-repo-url>
cd personal-blog
\`\`\`

### 2. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 3. 运行开发服务器

\`\`\`bash
npm run dev
\`\`\`

访问 [http://localhost:3000](http://localhost:3000) 查看结果。

### 4. 构建生产版本

\`\`\`bash
npm run build
\`\`\`

## 项目结构

\`\`\`
├── app/                    # Next.js App Router
│   ├── about/             # 关于页面
│   ├── blog/              # 博客相关页面
│   ├── contact/           # 联系页面
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # React 组件
│   ├── Footer.tsx         # 页脚组件
│   └── Header.tsx         # 头部组件
├── lib/                   # 工具库
│   ├── posts.ts          # 文章管理
│   └── utils.ts          # 通用工具
├── posts/                 # Markdown 文章
│   ├── hello-world.md
│   ├── getting-started-with-nextjs.md
│   └── thoughts-on-web-development.md
├── public/               # 静态资源
├── _headers              # Cloudflare Pages 头部配置
├── _redirects            # Cloudflare Pages 重定向配置
└── next.config.js        # Next.js 配置
\`\`\`

## 添加新文章

1. 在 \`posts/\` 目录下创建新的 \`.md\` 文件
2. 在文件顶部添加 Front Matter：

\`\`\`markdown
---
title: "文章标题"
date: "2024-01-01"
excerpt: "文章摘要"
tags: ["标签1", "标签2"]
---

# 文章内容

这里是你的文章内容...
\`\`\`

3. 重新构建项目，新文章会自动出现在博客中

## 部署到 Cloudflare Pages

### 方法 1: 通过 Git 集成（推荐）

1. 将代码推送到 GitHub/GitLab
2. 登录 [Cloudflare Pages](https://pages.cloudflare.com/)
3. 连接你的 Git 仓库
4. 设置构建配置：
   - **构建命令**: \`npm run build\`
   - **构建输出目录**: \`out\`
   - **Node.js 版本**: 18 或更高

### 方法 2: 使用 Wrangler CLI

1. 安装 Wrangler：
\`\`\`bash
npm install -g wrangler
\`\`\`

2. 登录 Cloudflare：
\`\`\`bash
wrangler login
\`\`\`

3. 构建并部署：
\`\`\`bash
npm run build
wrangler pages publish out
\`\`\`

## 自定义配置

### 修改网站信息

编辑以下文件来自定义你的博客：

- \`app/layout.tsx\` - 网站标题和描述
- \`components/Header.tsx\` - 导航菜单
- \`components/Footer.tsx\` - 页脚信息
- \`app/about/page.tsx\` - 个人介绍
- \`app/contact/page.tsx\` - 联系信息

### 样式自定义

- 编辑 \`tailwind.config.js\` 来自定义 Tailwind CSS 配置
- 修改 \`app/globals.css\` 来添加全局样式

## 性能优化

- ✅ 静态生成 (SSG)
- ✅ 图片优化
- ✅ 代码分割
- ✅ 预加载关键资源
- ✅ 缓存策略优化

## 浏览器支持

支持所有现代浏览器：

- Chrome (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- Edge (最新版本)

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系

如有问题，请通过以下方式联系：

- 邮箱: your.email@example.com
- GitHub: [你的GitHub用户名](https://github.com/yourusername) 