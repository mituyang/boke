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
  is_official: boolean;
  type: 'user';
}

// 移除静态文章类型定义，只使用用户文章

export default function ForumPage() {
  const [posts, setPosts] = useState<UserPost[]>([]);
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
      // 只获取用户文章
      const userPosts = await fetchUserPosts();

      // 按发布时间排序
      const allPosts = userPosts.sort((a: UserPost, b: UserPost) => {
        const dateA = new Date(a.published_at);
        const dateB = new Date(b.published_at);
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
    if (filter === 'static') {
      // 官方文章：只包括标记为官方的用户文章
      return post.is_official;
    }
    if (filter === 'user') {
      // 用户文章：只包括非官方的用户文章
      return !post.is_official;
    }
    return false;
  });

  // 格式化日期
  const formatDate = (post: UserPost) => {
    return new Date(post.published_at).toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div>
      {/* 页面标题和过滤器 */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            社区论坛
          </h1>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: '全部' },
              { key: 'static', label: '官方帖子' },
              { key: 'user', label: '用户帖子' }
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as any)}
                className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === item.key
                    ? 'bg-blue-600 dark:bg-blue-700 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
          发现有趣的讨论 • 共 {filteredPosts.length} 个帖子
        </p>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg">暂时还没有帖子</p>
          <p className="text-gray-500 dark:text-gray-500 mt-2">请稍后再来查看</p>
        </div>
      ) : (
        <div className="space-y-6 md:space-y-8">
          {filteredPosts.map((post) => (
            <article key={`${post.type}-${post.slug}`} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 hover:shadow-lg transition-shadow">
              {/* 帖子类型标识 */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium w-fit ${
                    post.is_official
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-400' 
                      : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-400'
                  }`}>
                    {post.is_official ? '官方帖子' : '用户帖子'}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    作者：{post.author_name}
                  </span>
                </div>
                <time className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(post)}
                </time>
              </div>

              <Link 
                href={`/article?slug=${post.slug}&type=user`}
                className="block"
              >
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {post.title}
                </h2>
              </Link>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed text-sm md:text-base">
                {post.excerpt}
              </p>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <PostStats postSlug={post.slug} showIncrement={false} showLikes={false} />
                  <LikeButton slug={post.slug} className="text-sm" />
                </div>
                <Link 
                  href={`/article?slug=${post.slug}&type=user`}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium w-fit"
                >
                  查看详情 →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
} 