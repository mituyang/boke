'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PostStats from '@/components/PostStats';

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
}

export default function Home() {
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取已发布的文章
  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/user-posts?status=published&limit=10');
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('获取文章失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div>
      <section className="mb-8 md:mb-12">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          欢迎来到我的博客
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
          这里是我分享技术见解、个人思考和生活感悟的地方。
        </p>
      </section>

      <section>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6">最新文章</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">加载中...</span>
          </div>
        ) : posts.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">暂时还没有文章，敬请期待。</p>
        ) : (
          <div className="space-y-6 md:space-y-8">
            {posts.map((post) => (
              <article key={post.slug} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 hover:shadow-lg transition-shadow">
                {/* 文章类型标识 */}
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium w-fit ${
                    post.is_official
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-400' 
                      : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-400'
                  }`}>
                    {post.is_official ? '官方文章' : '用户文章'}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    作者：{post.author_name}
                  </span>
                </div>

                <Link href={`/article?slug=${post.slug}&type=user`} className="block">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {post.title}
                  </h3>
                </Link>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 text-sm md:text-base">
                  {post.excerpt}
                </p>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <time dateTime={post.published_at}>
                      {formatDate(post.published_at)}
                    </time>
                    <PostStats postSlug={post.slug} showIncrement={false} />
                  </div>
                  <Link 
                    href={`/article?slug=${post.slug}&type=user`}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium w-fit"
                  >
                    阅读更多 →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
} 