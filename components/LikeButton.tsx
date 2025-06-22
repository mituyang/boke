'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface LikeButtonProps {
  slug: string;
  className?: string;
}

export default function LikeButton({ slug, className = '' }: LikeButtonProps) {
  const { user, token } = useAuth();
  const [likeData, setLikeData] = useState<{
    likeCount: number;
    userLiked: boolean;
  }>({ likeCount: 0, userLiked: false });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 获取点赞状态
  const fetchLikeData = async () => {
    try {
      const response = await fetch(`/api/likes/${slug}`, { 
        credentials: 'include' // 使用 cookie 认证
      });
      const data = await response.json();
      
      if (data.success) {
        setLikeData({
          likeCount: data.likeCount,
          userLiked: data.userLiked
        });
      }
    } catch (error) {
      console.error('获取点赞数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 点赞/取消点赞
  const handleLike = async () => {
    if (!user) {
      alert('请先登录后再点赞');
      return;
    }

    if (submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/likes/${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // 使用 cookie 认证
      });

      const data = await response.json();
      
      if (data.success) {
        // 更新本地状态
        setLikeData(prev => ({
          likeCount: data.action === 'liked' ? prev.likeCount + 1 : prev.likeCount - 1,
          userLiked: data.action === 'liked'
        }));
      } else {
        alert(data.message || '操作失败');
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      alert('操作失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchLikeData();
  }, [slug, token]);

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
        <span className="text-gray-400">加载中...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={handleLike}
        disabled={submitting}
        className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
          likeData.userLiked
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        } ${submitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <svg
          className={`w-4 h-4 ${likeData.userLiked ? 'fill-current' : 'stroke-current fill-none'}`}
          viewBox="0 0 24 24"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span>{likeData.likeCount}</span>
      </button>
      {!user && (
        <span className="text-xs text-gray-400">登录后可点赞</span>
      )}
    </div>
  );
} 