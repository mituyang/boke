'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthContext';
import Link from 'next/link';

interface Notification {
  id: number;
  type: 'like' | 'comment' | 'follow';
  title: string;
  content: string;
  isRead: boolean;
  sourceUser?: {
    username: string;
    displayName: string;
  };
  postSlug?: string;
  createdAt: string;
}

interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // 获取通知列表
  const fetchNotifications = async (page = 1, onlyUnread = false) => {
    if (!user) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20'
      });
      
      if (onlyUnread) {
        params.append('unread', 'true');
      }

      const response = await fetch(`/api/notifications?${params}`, {
        credentials: 'include'
      });
      const data: NotificationResponse = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications);
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('获取通知失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 标记通知为已读
  const markAsRead = async (notificationIds: number[]) => {
    if (!user) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ notificationIds })
      });
      const data = await response.json();
      
      if (data.success) {
        // 更新本地状态
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n.id) ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
        setSelectedIds([]);
      }
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 全部标记为已读
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ markAllAsRead: true })
      });
      const data = await response.json();
      
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('全部标记已读失败:', error);
    }
  };

  // 删除通知
  const deleteNotifications = async (notificationIds: number[]) => {
    if (!user) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ notificationIds })
      });
      const data = await response.json();
      
      if (data.success) {
        setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
        setSelectedIds([]);
      }
    } catch (error) {
      console.error('删除通知失败:', error);
    }
  };

  // 处理复选框变化
  const handleCheckboxChange = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(sid => sid !== id)
        : [...prev, id]
    );
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n.id));
    }
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取通知图标
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return (
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'comment':
        return (
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'follow':
        return (
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  // 处理通知点击
  const handleNotificationClick = (notification: Notification) => {
    // 如果未读，标记为已读
    if (!notification.isRead) {
      markAsRead([notification.id]);
    }

    // 根据通知类型跳转
    if (notification.postSlug) {
      window.location.href = `/article?slug=${notification.postSlug}&type=user`;
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications(1, filter === 'unread');
    }
  }, [user, filter]);

  // 如果用户未登录，重定向到登录页
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">请先登录</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">您需要登录才能查看通知</p>
          <Link
            href="/login"
            className="inline-block bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            去登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">通知中心</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            共有 {unreadCount} 条未读通知
          </p>
        </div>

        {/* 过滤器和操作按钮 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* 过滤器 */}
            <div className="flex space-x-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 dark:bg-blue-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                全部通知
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-blue-600 dark:bg-blue-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                未读通知 ({unreadCount})
              </button>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                >
                  全部已读
                </button>
              )}
              
              {selectedIds.length > 0 && (
                <>
                  <button
                    onClick={() => markAsRead(selectedIds)}
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    标记已读 ({selectedIds.length})
                  </button>
                  <button
                    onClick={() => deleteNotifications(selectedIds)}
                    className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md text-sm font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                  >
                    删除 ({selectedIds.length})
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 通知列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-lg font-medium">暂无通知</p>
              <p className="text-sm">当有人点赞、评论或关注你时，会在这里显示</p>
            </div>
          ) : (
            <>
              {/* 表头 */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === notifications.length && notifications.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    全选 ({notifications.length} 条)
                  </span>
                </label>
              </div>

              {/* 通知列表 */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 transition-colors ${
                      !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    } hover:bg-gray-50 dark:hover:bg-gray-700`}
                  >
                    <div className="flex items-start space-x-4">
                      {/* 复选框 */}
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(notification.id)}
                        onChange={() => handleCheckboxChange(notification.id)}
                        className="w-4 h-4 mt-1 text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
                      />

                      {/* 通知图标 */}
                      {getNotificationIcon(notification.type)}

                      {/* 通知内容 */}
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {formatTime(notification.createdAt)}
                            </span>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.content}
                        </p>
                        {notification.sourceUser && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            来自: {notification.sourceUser.displayName || notification.sourceUser.username}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => fetchNotifications(currentPage - 1, filter === 'unread')}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      上一页
                    </button>
                    
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      第 {currentPage} 页，共 {totalPages} 页
                    </span>
                    
                    <button
                      onClick={() => fetchNotifications(currentPage + 1, filter === 'unread')}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 