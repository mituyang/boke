'use client';
import { useState, useEffect } from 'react';

interface SiteStats {
  site: {
    total_visits: number;
    total_comments: number;
  };
  posts: {
    total_posts: number;
    total_views: number;
    total_post_comments: number;
  };
  popular_posts: Array<{
    post_slug: string;
    view_count: number;
    comment_count: number;
  }>;
  recent_comments: Array<{
    post_slug: string;
    user_name: string;
    content: string;
    created_at: string;
  }>;
}

export default function AdminPage() {
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/site-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPostTitle = (slug: string) => {
    const titles: { [key: string]: string } = {
      'hello-world': '你好，世界！',
      'getting-started-with-nextjs': 'Next.js 入门指南',
      'thoughts-on-web-development': '对现代 Web 开发的一些思考'
    };
    return titles[slug] || slug;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-600">正在加载统计数据...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-red-600">无法加载统计数据</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        网站管理
      </h1>

      {/* 概览统计 */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              📊
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总访问量</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.site.total_visits.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              💬
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总评论数</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.site.total_comments.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              📝
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总文章数</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.posts.total_posts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              👁️
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">文章总浏览</p>
              <p className="text-2xl font-bold text-gray-900">
                {(stats.posts.total_views || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 热门文章和最近评论 */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* 热门文章 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            热门文章
          </h2>
          {stats.popular_posts.length > 0 ? (
            <div className="space-y-4">
              {stats.popular_posts.map((post, index) => (
                <div key={post.post_slug} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">
                        {getPostTitle(post.post_slug)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {post.view_count} 浏览 · {post.comment_count} 评论
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">暂无数据</p>
          )}
        </div>

        {/* 最近评论 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            最近评论
          </h2>
          {stats.recent_comments.length > 0 ? (
            <div className="space-y-4">
              {stats.recent_comments.map((comment, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {comment.user_name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">
                    {comment.content.length > 100 
                      ? comment.content.substring(0, 100) + '...' 
                      : comment.content
                    }
                  </p>
                  <p className="text-xs text-gray-500">
                    在文章《{getPostTitle(comment.post_slug)}》中
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">暂无评论</p>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="mt-8 flex space-x-4">
        <button
          onClick={fetchStats}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          刷新数据
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
        >
          返回首页
        </button>
      </div>
    </div>
  );
} 