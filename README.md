# 个人博客网站

这是一个使用 Next.js + TypeScript 构建的个人博客网站，适合部署在 Cloudflare Pages 上。

## 特性

- ✨ 现代化的设计和响应式布局
- 🚀 使用 Next.js 14 和 TypeScript
- 🎨 Tailwind CSS 样式
- 📝 支持 Markdown 博客文章
- 🔍 SEO 优化
- 📱 移动端适配
- ⚡ 优化的性能
- 🌐 适合 Cloudflare Pages 部署

## 技术栈

- **框架**: Next.js 14
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **Markdown 处理**: gray-matter, remark
- **部署**: Cloudflare Pages

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 开发模式

```bash
npm run dev
```

在浏览器中访问 [http://localhost:3000](http://localhost:3000) 查看网站。

### 3. 构建项目

```bash
npm run build
```

## 项目结构

```
├── app/                    # Next.js App Router
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   ├── blog/              # 博客相关页面
│   ├── about/             # 关于页面
│   └── contact/           # 联系页面
├── components/            # React 组件
│   ├── Header.tsx         # 页头组件
│   └── Footer.tsx         # 页脚组件
├── lib/                   # 工具函数
│   └── posts.ts           # 博客文章处理
├── posts/                 # Markdown 博客文章
├── public/                # 静态资源
└── README.md              # 项目说明
```

## 博客文章

### 创建新文章

在 `posts/` 目录下创建新的 `.md` 文件，文件格式如下：

```markdown
---
title: '文章标题'
date: '2024-01-01'
author: '作者'
excerpt: '文章摘要'
category: 'tech'
tags: ['标签1', '标签2']
---

# 文章内容

这里是文章的正文内容...
```

### Front Matter 字段

- `title`: 文章标题
- `date`: 发布日期 (YYYY-MM-DD)
- `author`: 作者姓名
- `excerpt`: 文章摘要
- `category`: 分类 (tech, life, thoughts)
- `tags`: 标签数组

## 自定义配置

### 修改个人信息

1. 编辑 `app/about/page.tsx` 更新个人简介
2. 编辑 `app/contact/page.tsx` 更新联系方式
3. 编辑 `components/Footer.tsx` 更新社交媒体链接

### 修改样式

项目使用 Tailwind CSS，你可以：

1. 修改 `app/globals.css` 中的自定义样式
2. 在组件中直接使用 Tailwind 类名
3. 修改 `tailwind.config.js` 进行主题自定义

## 部署到 Cloudflare Pages

### 方法一：GitHub 集成

1. 将代码推送到 GitHub 仓库
2. 在 Cloudflare Pages 中连接 GitHub 仓库
3. 设置构建命令：`npm run build`
4. 设置输出目录：`out`
5. 部署

### 方法二：直接上传

1. 运行 `npm run build` 构建项目
2. 将 `out` 目录上传到 Cloudflare Pages

### 环境变量

如果需要使用环境变量，在 Cloudflare Pages 设置中添加：

```
NODE_ENV=production
```

## 性能优化

项目已包含以下优化：

- 静态生成 (SSG)
- 图片优化
- 代码分割
- CSS 压缩
- 自动缓存

## SEO 优化

- 结构化数据
- Meta 标签优化
- 语义化 HTML
- 站点地图生成
- OpenGraph 支持

## 浏览器支持

- Chrome (最新)
- Firefox (最新)
- Safari (最新)
- Edge (最新)

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 联系

如有问题，请通过以下方式联系：

- 邮箱: hello@example.com
- GitHub: [你的GitHub地址]
- Twitter: [你的Twitter地址]

---

**享受写博客的乐趣！** 🎉 