'use client';

import { useState, useEffect } from 'react';
import { useAuth, withAuth } from '../../components/AuthContext';
import Link from 'next/link';

interface UserPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  status: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  author_name: string;
  is_official: boolean;
}

interface PostsResponse {
  success: boolean;
  posts: UserPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function MyPostsPage() {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [total, setTotal] = useState(0);

  // 获取用户文章列表
  const fetchPosts = async (page = 1, status = 'all') => {
    if (!token) return;
    
    setLoading(true);
    try {
      const url = `/api/user-posts?page=${page}&limit=10&status=${status}`;
      const response = await fetch(url, {
        credentials: 'include' // 使用 cookie 认证
      });

      const data: PostsResponse = await response.json();
      
      if (data.success) {
        setPosts(data.posts);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } else {
        console.error('获取文章失败:', data);
        setPosts([]);
      }
    } catch (error) {
      console.error('获取文章列表失败:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // 删除文章
  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`确定要删除文章"${title}"吗？`)) return;

    try {
      const response = await fetch(`/api/user-posts?id=${id}`, {
        method: 'DELETE',
        credentials: 'include' // 使用 cookie 认证
      });

      const data = await response.json();
      
      if (data.success) {
        alert('文章删除成功');
        fetchPosts(currentPage, statusFilter);
      } else {
        alert(data.message || '删除失败');
      }
    } catch (error) {
      console.error('删除文章失败:', error);
      alert('删除失败，请重试');
    }
  };

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

  // 获取状态显示
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">已发布</span>;
      case 'draft':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">草稿</span>;
      case 'deleted':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">已删除</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">{status}</span>;
    }
  };

  useEffect(() => {
    fetchPosts(currentPage, statusFilter);
  }, [token, currentPage, statusFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">我的文章</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                管理您发布的文章 • 共 {total} 篇文章
              </p>
            </div>
            <Link
              href="/write"
              className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              写文章
            </Link>
          </div>
        </div>

        {/* 过滤器 */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {[
              { key: 'all', label: '全部' },
              { key: 'published', label: '已发布' },
              { key: 'draft', label: '草稿' },
              { key: 'deleted', label: '已删除' }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => handleStatusFilterChange(filter.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === filter.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* 文章列表 */}
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">还没有文章</h3>
            <p className="text-gray-600 mb-4">开始写您的第一篇文章吧！</p>
            <Link
              href="/write"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              写文章
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      文章
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      统计
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 mb-1">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {post.excerpt}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          {getStatusDisplay(post.status)}
                          {post.is_official && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              官方文章
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>浏览：{post.view_count}</div>
                          <div>点赞：{post.like_count}</div>
                          <div>评论：{post.comment_count}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>创建：{formatDate(post.created_at)}</div>
                          {post.updated_at !== post.created_at && (
                            <div>更新：{formatDate(post.updated_at)}</div>
                          )}
                          {post.published_at && (
                            <div>发布：{formatDate(post.published_at)}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {post.status === 'published' && (
                            <Link
                              href={`/article?slug=${post.slug}&type=user`}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              查看
                            </Link>
                          )}
                          {post.status !== 'deleted' && (
                            <>
                              <Link
                                href={`/write?edit=${post.id}`}
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
                                编辑
                              </Link>
                              <button
                                onClick={() => handleDelete(post.id, post.title)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                删除
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="flex space-x-2">
              {currentPage > 1 && (
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  上一页
                </button>
              )}
              
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 2 && page <= currentPage + 2)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-lg text-sm ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  (page === currentPage - 3 && page > 1) ||
                  (page === currentPage + 3 && page < totalPages)
                ) {
                  return (
                    <span key={page} className="px-3 py-2 text-gray-400">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              {currentPage < totalPages && (
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  下一页
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(MyPostsPage); 