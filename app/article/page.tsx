'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Comments from '../../components/Comments';
import LikeButton from '../../components/LikeButton';
import PostStats from '../../components/PostStats';
import Link from 'next/link';
interface UserPost {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  author_name: string;
  username: string;
}

interface StaticPost {
  slug: string;
  title: string;
  content: string;
  date: string;
  excerpt: string;
}

function ArticleContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');
  const type = searchParams.get('type'); // 'static' or 'user'
  
  const [userPost, setUserPost] = useState<UserPost | null>(null);
  const [staticPost, setStaticPost] = useState<StaticPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取用户文章详情
  const fetchUserPost = async (slug: string) => {
    try {
      const response = await fetch(`/api/user-posts/${slug}`);
      const data = await response.json();
      
      if (data.success) {
        setUserPost(data.post);
        setError(null);
      } else {
        setError(data.message || '文章不存在');
        setUserPost(null);
      }
    } catch (error) {
      console.error('获取文章失败:', error);
      setError('加载文章失败');
      setUserPost(null);
    }
  };

  // 获取静态文章详情
  const fetchStaticPost = async (slug: string) => {
    try {
      // 使用静态文章数据
      const staticPosts = [
        {
          slug: 'hello-world',
          title: '欢迎来到我的博客',
          content: '# 欢迎来到我的博客\n\n这是我的第一篇博客文章。在这里，我将分享我的技术心得、生活感悟和各种有趣的想法。\n\n## 关于这个博客\n\n这个博客使用 Next.js 和 TypeScript 构建，部署在 Cloudflare Pages 上。它具有以下特性：\n\n- 响应式设计\n- 现代化的 UI\n- 快速的加载速度\n- SEO 友好\n\n## 未来计划\n\n我计划在这里分享：\n\n1. **技术文章** - Web 开发、前端技术、最佳实践\n2. **项目分享** - 我正在进行的有趣项目\n3. **学习笔记** - 新技术的学习心得\n4. **生活感悟** - 工作和生活的平衡\n\n希望你能喜欢这里的内容！',
          date: '2024-01-01',
          excerpt: '欢迎来到我的个人博客！这里将分享技术、生活和各种有趣的内容。'
        },
        {
          slug: 'getting-started-with-nextjs',
          title: 'Next.js 入门指南：从零开始构建现代化 Web 应用',
          content: '# Next.js 入门指南：从零开始构建现代化 Web 应用\n\nNext.js 是一个基于 React 的生产级框架，它为构建现代化 Web 应用提供了强大的功能和优秀的开发体验。\n\n## 什么是 Next.js？\n\nNext.js 是由 Vercel 开发的 React 框架，它解决了 React 应用在生产环境中遇到的许多问题：\n\n• **零配置** - 开箱即用的配置\n• **混合渲染** - 支持 SSG、SSR 和 CSR\n• **文件系统路由** - 基于文件结构的自动生成路由\n• **API 路由** - 内置 API 端点支持\n• **性能优化** - 自动代码分割、图片优化等\n\n## 核心特性\n\n### 1. 文件系统路由\n\nNext.js 使用文件系统作为路由器，在 `pages` 目录（或 `app` 目录）中创建文件，就会自动创建对应的路由：\n\n```\npages/\n  index.js      -> /\n  about.js      -> /about\n  blog/\n    index.js    -> /blog\n    [slug].js   -> /blog/:slug\n```\n\n### 2. 预渲染\n\nNext.js 默认预渲染每个页面，有两种形式：\n\n**静态生成 (SSG)**\n```javascript\nexport async function getStaticProps() {\n  return {\n    props: {\n      posts: await getPosts()\n    }\n  }\n}\n```\n\n**服务端渲染 (SSR)**\n```javascript\nexport async function getServerSideProps() {\n  return {\n    props: {\n      data: await fetchData()\n    }\n  }\n}\n```',
          date: '2024-01-15',
          excerpt: 'Next.js 是一个基于 React 的生产级框架，它为构建现代化 Web 应用提供了强大的功能和优秀的开发体验。'
        },
        {
          slug: 'thoughts-on-web-development',
          title: 'Web 开发的一些思考',
          content: '# Web 开发的一些思考\n\n在 Web 开发的道路上，我们会遇到各种各样的技术选择和设计决策。本文分享一些我在开发过程中的思考和体会。\n\n## 技术选择的重要性\n\n选择合适的技术栈对项目的成功至关重要。需要考虑的因素包括：\n\n- **项目需求** - 功能复杂度、性能要求\n- **团队经验** - 团队对技术的熟悉程度\n- **维护成本** - 长期维护的难易程度\n- **社区支持** - 生态系统的成熟度\n\n## 用户体验优先\n\n好的用户体验应该是无感的：\n\n1. **快速加载** - 用户不应该等待\n2. **响应式设计** - 适配各种设备\n3. **直观的交互** - 符合用户预期\n4. **错误处理** - 优雅地处理异常情况\n\n## 代码质量\n\n高质量的代码具有以下特征：\n\n- **可读性强** - 代码如文档\n- **模块化** - 高内聚、低耦合\n- **可测试** - 易于编写和维护测试\n- **一致性** - 统一的编码规范\n\n## 持续学习\n\nWeb 技术发展迅速，保持学习的热情很重要：\n\n- 关注新技术趋势\n- 参与开源项目\n- 分享和交流经验\n- 反思和总结\n\n技术是手段，解决问题才是目的。',
          date: '2024-01-03',
          excerpt: '在 Web 开发的道路上，我们会遇到各种各样的技术选择和设计决策。本文分享一些我在开发过程中的思考和体会。'
        }
      ];

      const post = staticPosts.find(p => p.slug === slug);
      if (post) {
        setStaticPost(post);
        setError(null);
      } else {
        setError('文章不存在');
        setStaticPost(null);
      }
    } catch (error) {
      console.error('获取静态文章失败:', error);
      setError('加载文章失败');
      setStaticPost(null);
    }
  };

  useEffect(() => {
    if (!slug) {
      setError('缺少文章ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    
    if (type === 'static') {
      fetchStaticPost(slug);
    } else {
      fetchUserPost(slug);
    }
    
    setLoading(false);
  }, [slug, type]);

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 格式化内容（简单的Markdown渲染）
  const formatContent = (content: string) => {
    return content
      .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-gray-900 mt-8 mb-4">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-gray-900 mt-6 mb-3">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-gray-900 mt-4 mb-2">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4" />')
      .replace(/```[\s\S]*?```/g, (match) => {
        const content = match.slice(3, -3);
        return `<pre class="bg-gray-100 p-4 rounded-lg my-4 overflow-x-auto"><code>${content}</code></pre>`;
      })
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm">$1</code>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4">$1</blockquote>')
      .replace(/\n/g, '<br>');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || (!userPost && !staticPost)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">文章不存在</h2>
          <p className="text-gray-600 mb-4">{error || '请检查链接是否正确'}</p>
          <Link
            href="/blog"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            返回博客列表
          </Link>
        </div>
      </div>
    );
  }

  const post = userPost || staticPost;
  const isUserPost = !!userPost;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 文章头部 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-4">
            <Link 
              href="/blog" 
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← 返回博客列表
            </Link>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {post!.title}
          </h1>
          
          <div className="flex items-center justify-between text-sm text-gray-600 mb-6">
            <div className="flex items-center space-x-4">
              {isUserPost ? (
                <>
                  <span>作者：{userPost!.author_name}</span>
                  <span>发布时间：{formatDate(userPost!.published_at || userPost!.created_at)}</span>
                  {userPost!.updated_at !== userPost!.created_at && (
                    <span>更新时间：{formatDate(userPost!.updated_at)}</span>
                  )}
                </>
              ) : (
                <span>发布时间：{formatDate(staticPost!.date)}</span>
              )}
            </div>
          </div>

          {/* 文章统计和点赞 */}
          <div className="flex items-center justify-between pb-6 border-b">
            <PostStats postSlug={slug!} showIncrement={true} showLikes={false} />
            <LikeButton slug={slug!} />
          </div>
        </div>
      </div>

      {/* 文章内容 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: formatContent(post!.content) 
            }}
          />
        </div>

        {/* 作者信息 */}
        {isUserPost && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">关于作者</h3>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {userPost!.author_name.charAt(0)}
                </span>
              </div>
              <div>
                <div className="font-medium text-gray-900">{userPost!.author_name}</div>
                <div className="text-gray-600">@{userPost!.username}</div>
              </div>
            </div>
          </div>
        )}

        {/* 评论区 */}
        <div className="mt-8">
          <Comments postSlug={slug!} />
        </div>
      </div>
    </div>
  );
}

export default function ArticlePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ArticleContent />
    </Suspense>
  );
} 