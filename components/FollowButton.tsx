'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface FollowButtonProps {
  username: string;
  className?: string;
}

interface UserData {
  id: number;
  username: string;
  displayName: string;
  followersCount: number;
  followingCount: number;
}

export default function FollowButton({ username, className = '' }: FollowButtonProps) {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [canFollow, setCanFollow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 获取用户关注状态
  const fetchFollowStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/follow/${username}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setUserData(data.user);
        setIsFollowing(data.isFollowing);
        setCanFollow(data.canFollow);
      } else {
        console.error('获取关注状态失败:', data.message);
      }
    } catch (error) {
      console.error('获取关注状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理关注/取消关注
  const handleFollow = async () => {
    if (!user) {
      setMessage('请先登录');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/follow/${username}`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setIsFollowing(data.action === 'follow');
        setMessage(data.message);
        
        // 更新关注数
        if (userData) {
          setUserData({
            ...userData,
            followersCount: userData.followersCount + (data.action === 'follow' ? 1 : -1)
          });
        }
        
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || '操作失败');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('关注操作失败:', error);
      setMessage('网络错误，请稍后重试');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (user && username) {
      fetchFollowStatus();
    } else {
      setLoading(false);
    }
  }, [user, username]);

  // 如果用户未登录，不显示关注按钮
  if (!user || !canFollow) {
    return null;
  }

  if (loading) {
    return (
      <div className={`inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 dark:border-gray-300"></div>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-center space-y-2">
      <button
        onClick={handleFollow}
        disabled={actionLoading}
        className={`
          inline-flex items-center justify-center px-4 py-2 border rounded-md font-medium text-sm
          transition-colors duration-200 min-w-[100px]
          ${isFollowing 
            ? 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700' 
            : 'border-blue-600 dark:border-blue-500 text-white bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {actionLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        ) : (
          <>
            {isFollowing ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                已关注
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                关注
              </>
            )}
          </>
        )}
      </button>

      {/* 关注数统计 */}
      {userData && (
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <span>{userData.followersCount} 粉丝</span>
          <span>{userData.followingCount} 关注</span>
        </div>
      )}

      {/* 操作消息提示 */}
      {message && (
        <div className="text-sm text-center px-3 py-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
          {message}
        </div>
      )}
    </div>
  );
} 