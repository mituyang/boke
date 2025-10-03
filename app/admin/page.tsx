'use client';
import { useState, useEffect } from 'react';
import { withAuth } from '../../components/AuthContext';
import { formatDate } from '../../lib/utils';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  deleted_at?: string;
}

interface Post {
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
  published_at?: string;
  author_id: number;
  username: string;
  author_name: string;
  is_official: boolean;
}

interface Stats {
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
    id: number;
    user_name: string;
    content: string;
    post_slug: string;
    created_at: string;
  }>;
}

function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'posts'>('stats');

  const isSuperAdmin = currentUser?.username === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    }
  }, [activeTab]);

  const fetchData = async () => {
    try {
      // 获取当前用户信息
      const userResponse = await fetch('/api/auth/me');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData.user);
      }

      // 获取网站统计
      const statsResponse = await fetch('/api/site-stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // 获取用户列表
      const usersResponse = await fetch('/api/admin/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }


    } catch (error) {
      console.error('获取数据失败:', error);
      setError('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    setPostsLoading(true);
    try {
      const response = await fetch('/api/admin/posts', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        console.error('获取文章列表失败');
      }
    } catch (error) {
      console.error('获取文章列表失败:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const deletePost = async (postId: number, title: string) => {
    if (!confirm(`确定要删除文章 "${title}" 吗？此操作不可恢复！`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/posts?postId=${postId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`文章 "${title}" 已被删除`);
        fetchPosts(); // 重新获取文章列表
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除文章失败:', error);
      alert('删除失败');
    }
  };

  const updateUserRole = async (userId: number, newRole: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role: newRole
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('角色更新成功');
        fetchData(); // 重新获取数据
      } else {
        alert(data.error || '更新失败');
      }
    } catch (error) {
      console.error('更新角色失败:', error);
      alert('更新失败');
    }
  };

  const updateUserStatus = async (userId: number, isActive: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          isActive
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('状态更新成功');
        fetchData(); // 重新获取数据
      } else {
        alert(data.error || '更新失败');
      }
    } catch (error) {
      console.error('更新状态失败:', error);
      alert('更新失败');
    }
  };

  const deleteUser = async (userId: number, username: string) => {
    if (!confirm(`确定要删除用户 "${username}" 吗？此操作不可恢复！`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`用户 "${username}" 已被删除`);
        fetchData(); // 重新获取数据
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      alert('删除失败');
    }
  };

  const syncCommentCounts = async () => {
    try {
      const response = await fetch('/api/admin/sync-comments', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('评论数量同步成功');
        fetchData(); // 重新获取数据
      } else {
        alert(data.error || '同步失败');
      }
    } catch (error) {
      console.error('同步评论数量失败:', error);
      alert('同步失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center text-red-600 dark:text-red-400">
          <p>加载失败: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 px-2 sm:px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">管理后台</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            当前用户: <span className="font-medium">{currentUser?.name} (admin)</span> | 
            超级管理员 | 时间显示：上海时区 (UTC+8)
          </p>
        </div>

        {/* 标签页导航 */}
        <div className="mb-4">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'stats'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                网站统计
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                用户管理
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'posts'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                帖子管理
              </button>
            </nav>
          </div>
        </div>

        {/* 网站统计 */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-4">
            {/* 统计卡片 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.site.total_visits}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">总访问量</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.site.total_comments}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">总评论数</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.posts.total_posts}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">帖子总数</div>
              </div>
            </div>
            
            {/* 权限说明 */}
            <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">权限说明</h3>
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p>• <span className="font-semibold">超级管理员</span>：拥有所有权限 • <span className="font-semibold">普通管理员</span>：可管理用户但不能分配角色 • <span className="font-semibold">普通用户</span>：只能访问论坛内容</p>
              </div>
              <button
                onClick={syncCommentCounts}
                className="mt-2 px-3 py-1 bg-blue-600 dark:bg-blue-700 text-white text-xs rounded hover:bg-blue-700 dark:hover:bg-blue-600"
              >
                同步评论数量
              </button>
            </div>
          </div>
        )}

        {/* 用户管理 */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">用户管理</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      用户信息
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      角色
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      状态
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      最后登录
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-2">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            @{user.username} • {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {isSuperAdmin && user.id !== currentUser?.id ? (
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                            className="text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1"
                          >
                            <option value="user">普通用户</option>
                            <option value="admin">管理员</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-400' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          }`}>
                            {user.role === 'admin' ? '管理员' : '普通用户'}
                            {user.username === 'admin' && ' (超级)'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {user.deleted_at ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                            已删除
                          </span>
                        ) : user.id !== currentUser?.id ? (
                          <button
                            onClick={() => updateUserStatus(user.id, !user.is_active)}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              user.is_active 
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-400 hover:bg-green-200' 
                                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-400 hover:bg-red-200'
                            }`}
                          >
                            {user.is_active ? '已启用' : '已禁用'}
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-400">
                            已启用 (自己)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                        {user.last_login ? formatDate(user.last_login) : '从未登录'}
                      </td>
                      <td className="px-4 py-2 text-xs font-medium">
                        {isSuperAdmin && user.id !== currentUser?.id && user.username !== 'admin' && !user.deleted_at ? (
                          <button
                            onClick={() => deleteUser(user.id, user.username)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          >
                            删除
                          </button>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 帖子管理 */}
        {activeTab === 'posts' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">帖子管理</h2>
            </div>
            {postsLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">加载中...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        帖子信息
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        作者
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        状态/统计
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        时间
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {posts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 py-1.5">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                              {post.title}
                            </div>
                            {post.excerpt && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs mt-0.5">
                                {post.excerpt}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-1.5">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{post.author_name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">@{post.username}</div>
                          </div>
                        </td>
                        <td className="px-3 py-1.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <span className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium ${
                                post.status === 'published' 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                              }`}>
                                {post.status === 'published' ? '发布' : '草稿'}
                              </span>
                              <span className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium ${
                                post.is_official
                                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400' 
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                              }`}>
                                {post.is_official ? '官方' : '用户'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                              <span className="text-blue-600 dark:text-blue-400">👁{post.view_count}</span>
                              <span className="text-red-500">❤{post.like_count}</span>
                              <span className="text-green-600 dark:text-green-400">💬{post.comment_count}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(post.created_at)}
                        </td>
                        <td className="px-3 py-1.5 text-xs font-medium">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <a
                              href={`/article?slug=${post.slug}&type=user`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                            >
                              查看
                            </a>
                            {/* 管理员可以删除普通用户的文章，超级管理员可以删除所有文章 */}
                            {(isSuperAdmin || (!post.is_official && currentUser?.role === 'admin')) && (
                              <button
                                onClick={() => deletePost(post.id, post.title)}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                              >
                                删除
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {posts.length === 0 && (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    暂无帖子数据
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 安全提示 - 精简版 */}
        <div className="mt-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
          <div className="text-xs text-yellow-700 dark:text-yellow-300">
            <strong>安全提示：</strong> 所有数据已加密传输 • 使用上海时区(UTC+8) • 管理员可删除普通用户帖子，超级管理员可删除所有帖子
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(AdminPage); 