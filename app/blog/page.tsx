'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDateOnly } from '@/lib/utils';
import PostStats from '@/components/PostStats';
import LikeButton from '@/components/LikeButton';

interface UserPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at: string;
  author_name: string;
  username: string;
  type: 'user';
}

interface StaticPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tags?: string[];
  type: 'static';
}

type Post = UserPost | StaticPost;

// 静态文章数据（临时方案）
const STATIC_POSTS: StaticPost[] = [
  {
    slug: 'hello-world',
    title: '欢迎来到我的博客',
    excerpt: '这是我的第一篇博客文章，欢迎大家来到我的个人博客！在这里我会分享我的学习心得、技术笔记和生活感悟。',
    date: '2024-01-01',
    tags: ['欢迎', '博客'],
    type: 'static'
  },
  {
    slug: 'getting-started-with-nextjs',
    title: 'Next.js 入门指南',
    excerpt: 'Next.js 是一个强大的 React 框架，它提供了许多开箱即用的功能，让我们能够快速构建现代化的 Web 应用。本文将带你了解 Next.js 的基础概念和核心特性。',
    date: '2024-01-02',
    tags: ['Next.js', 'React', '教程'],
    type: 'static'
  },
  {
    slug: 'thoughts-on-web-development',
    title: 'Web 开发的一些思考',
    excerpt: '在 Web 开发的道路上，我们会遇到各种各样的技术选择和设计决策。本文分享一些我在开发过程中的思考和体会。',
    date: '2024-01-03',
    tags: ['Web开发', '思考', '经验'],
    type: 'static'
  }
];

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'static' | 'user'>('all');

  // 获取用户发布的文章
  const fetchUserPosts = async () => {
    try {
      const response = await fetch('/api/user-posts?status=published&limit=100');
      const data = await response.json();
      
      if (data.success) {
        return data.posts.map((post: any) => ({
          ...post,
          type: 'user' as const
        }));
      }
    } catch (error) {
      console.error('获取用户文章失败:', error);
    }
    return [];
  };

  // 获取所有文章
  const fetchAllPosts = async () => {
    setLoading(true);
    try {
      // 使用静态文章数据
      const staticPosts = STATIC_POSTS;

      // 获取用户文章
      const userPosts = await fetchUserPosts();

      // 合并并按时间排序
      const allPosts = [...staticPosts, ...userPosts].sort((a, b) => {
        const dateA = a.type === 'static' ? new Date(a.date) : new Date(a.published_at);
        const dateB = b.type === 'static' ? new Date(b.date) : new Date(b.published_at);
        return dateB.getTime() - dateA.getTime();
      });

      setPosts(allPosts);
    } catch (error) {
      console.error('获取文章失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPosts();
  }, []);

  // 过滤文章
  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true;
    return post.type === filter;
  });

  // 格式化日期
  const formatDate = (post: Post) => {
    if (post.type === 'static') {
      return formatDateOnly(post.date);
    } else {
      return new Date(post.published_at).toLocaleDateString('zh-CN');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* 页面标题和过滤器 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            所有文章
          </h1>
          <div className="flex space-x-2">
            {[
              { key: 'all', label: '全部' },
              { key: 'static', label: '官方文章' },
              { key: 'user', label: '用户文章' }
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === item.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        
        <p className="text-gray-600">
          发现有趣的内容 • 共 {filteredPosts.length} 篇文章
        </p>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">暂时还没有文章</p>
          <p className="text-gray-500 mt-2">请稍后再来查看</p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredPosts.map((post) => (
            <article key={`${post.type}-${post.slug}`} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              {/* 文章类型标识 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    post.type === 'static' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {post.type === 'static' ? '官方文章' : '用户文章'}
                  </span>
                  {post.type === 'user' && (
                    <span className="text-sm text-gray-500">
                      作者：{post.author_name}
                    </span>
                  )}
                </div>
                <time className="text-sm text-gray-500">
                  {formatDate(post)}
                </time>
              </div>

              <Link 
                href={`/article?slug=${post.slug}&type=${post.type}`} 
                className="block"
              >
                <h2 className="text-2xl font-semibold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                  {post.title}
                </h2>
              </Link>
              
              <p className="text-gray-600 mb-4 leading-relaxed">
                {post.excerpt}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {post.type === 'static' ? (
                    <PostStats postSlug={post.slug} showIncrement={false} />
                  ) : (
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>浏览 {post.view_count}</span>
                      <span>评论 {post.comment_count}</span>
                      <LikeButton slug={post.slug} className="text-sm" />
                    </div>
                  )}
                </div>
                
                {post.type === 'static' && post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <Link 
                href={`/article?slug=${post.slug}&type=${post.type}`}
                className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-medium"
              >
                阅读全文 →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
} 