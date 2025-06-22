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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

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
        alert('用户状态更新成功');
        fetchData(); // 重新获取数据
      } else {
        alert(data.error || '更新失败');
      }
    } catch (error) {
      console.error('更新用户状态失败:', error);
      alert('更新失败');
    }
  };

  const deleteUser = async (userId: number, username: string) => {
    if (!confirm(`确定要删除用户 "${username}" 吗？此操作不可恢复！`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('用户删除成功');
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
    if (!confirm('确定要同步评论数量吗？这将检查并修正所有文章的评论统计数据。')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/sync-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.updates.length === 0) {
          alert('所有评论数量统计都是准确的，无需更新。');
        } else {
          alert(`${data.message}\n\n更新详情：\n${data.updates.map((u: any) => 
            `• ${u.post_slug}: ${u.old_count} → ${u.new_count} (${u.action})`
          ).join('\n')}`);
        }
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  const isSuperAdmin = currentUser?.username === 'admin';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">管理后台</h1>
        <div className="text-sm text-gray-600">
          当前用户：{currentUser?.name} ({currentUser?.username})
          {isSuperAdmin && <span className="ml-2 text-red-600 font-semibold">超级管理员</span>}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          时间显示：上海时区 (UTC+8)
        </div>
      </div>

      {/* 权限说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">权限说明</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <span className="font-semibold">超级管理员 (admin)</span>：拥有所有权限，包括分配用户角色和删除用户</p>
          <p>• <span className="font-semibold">普通管理员</span>：可以查看用户列表和启用/禁用用户，但不能分配角色</p>
          <p>• <span className="font-semibold">普通用户</span>：只能访问博客内容和评论功能</p>
        </div>
      </div>

      {/* 网站统计 */}
      {stats && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">网站统计</h2>
            <button
              onClick={syncCommentCounts}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              同步评论数量
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.site.total_visits}</div>
              <div className="text-gray-600">总访问量</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.site.total_comments}</div>
              <div className="text-gray-600">总评论数</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.posts.total_posts}</div>
              <div className="text-gray-600">文章总数</div>
            </div>
          </div>
        </div>
      )}

      {/* 用户管理 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">用户管理</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最后登录
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{user.username} • {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isSuperAdmin && user.id !== currentUser?.id ? (
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="user">普通用户</option>
                        <option value="admin">管理员</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? '管理员' : '普通用户'}
                        {user.username === 'admin' && ' (超级)'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.deleted_at ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        已删除
                      </span>
                    ) : user.id !== currentUser?.id ? (
                      <button
                        onClick={() => updateUserStatus(user.id, !user.is_active)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {user.is_active ? '已启用' : '已禁用'}
                      </button>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        已启用 (自己)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_login ? formatDate(user.last_login) : '从未登录'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {isSuperAdmin && user.id !== currentUser?.id && user.username !== 'admin' && !user.deleted_at ? (
                      <button
                        onClick={() => deleteUser(user.id, user.username)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 安全提示 */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-yellow-800 mb-1">安全提示</h3>
        <div className="text-xs text-yellow-700">
          • 所有敏感数据均已加密传输和存储
          • 时间显示统一使用上海时区 (UTC+8)
          • 超级管理员账号拥有最高权限，请妥善保管
        </div>
      </div>
    </div>
  );
}

export default withAuth(AdminPage); 