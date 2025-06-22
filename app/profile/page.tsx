'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthContext';
import { encryptData } from '../../lib/utils';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    nickname: '',
    userId: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // 调试信息
  console.log('ProfilePage render - isEditing:', isEditing);

  // 从认证上下文中加载用户信息
  useEffect(() => {
    if (user) {
      setFormData({
        nickname: user.name || '',
        userId: user.username || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 如果不在编辑模式，不执行提交
    if (!isEditing) {
      console.log('不在编辑模式，忽略提交');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    // 验证用户ID格式
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.userId)) {
      setError('用户ID必须是3-20位字母、数字或下划线');
      setLoading(false);
      return;
    }

    try {
      // 加密敏感数据
      const encryptedData = {
        nickname: await encryptData(formData.nickname),
        userId: await encryptData(formData.userId),
        email: await encryptData(formData.email),
        encrypted: true
      };

      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(encryptedData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('个人资料更新成功！');
        setIsEditing(false);
        // 使用后端返回的更新后的用户信息
        if (data.user) {
          updateUser({
            id: data.user.id,
            username: data.user.username,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            isActive: data.user.isActive,
            lastLogin: data.user.lastLogin
          });
          // 同步更新表单数据
          setFormData({
            nickname: data.user.name,
            userId: data.user.username,
            email: data.user.email
          });
        }
      } else {
        setError(data.error || '更新失败');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      setError('更新过程中发生错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        nickname: user.name || '',
        userId: user.username || '',
        email: user.email || ''
      });
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            请先登录
          </h2>
          <a
            href="/login"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            前往登录页面
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              个人资料
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              管理您的账户信息
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-600 dark:text-green-400 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  昵称
                </label>
                <input
                  id="nickname"
                  name="nickname"
                  type="text"
                  required
                  value={formData.nickname}
                  onChange={handleChange}
                  disabled={!isEditing || loading}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                  placeholder="请输入昵称"
                />
              </div>

              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  用户ID
                </label>
                <input
                  id="userId"
                  name="userId"
                  type="text"
                  required
                  value={formData.userId}
                  onChange={handleChange}
                  disabled={!isEditing || loading}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                  placeholder="3-20位字母、数字或下划线"
                />
                {isEditing && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    用户ID必须唯一，修改后需要重新登录
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  邮箱
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing || loading}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                  placeholder="请输入邮箱地址"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  角色
                </label>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {user.role === 'admin' || user.role === 'super_admin' ? '管理员' : '普通用户'}
                </div>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('点击编辑资料按钮');
                    setIsEditing(true);
                  }}
                  className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  编辑资料
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 dark:bg-green-700 text-white py-2 px-4 rounded-md hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '保存中...' : '保存'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCancel();
                    }}
                    disabled={loading}
                    className="flex-1 bg-gray-600 dark:bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    取消
                  </button>
                </>
              )}
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>数据库ID:</span>
                <span className="font-mono">{user.id}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>当前用户ID:</span>
                <span className="font-mono">{user.username}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>最后登录:</span>
                <span>{user.lastLogin ? new Date(user.lastLogin).toLocaleString('zh-CN') : '从未登录'}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>最后编辑资料:</span>
                <span>{user.updatedAt ? new Date(user.updatedAt).toLocaleString('zh-CN') : '未知'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 