'use client';
import { useState, useEffect } from 'react';
import LikeButton from './LikeButton';

interface Stats {
  view_count: number;
  comment_count: number;
}

interface PostStatsProps {
  postSlug: string;
  showIncrement?: boolean;
  showLikes?: boolean;
}

export default function PostStats({ postSlug, showIncrement = true, showLikes = true }: PostStatsProps) {
  const [stats, setStats] = useState<Stats>({ view_count: 0, comment_count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    if (showIncrement) {
      // 增加浏览量
      incrementView();
    }
  }, [postSlug]);

  // 监听评论更新事件
  useEffect(() => {
    const handleCommentUpdate = () => {
      fetchStats(); // 重新获取统计数据
    };

    window.addEventListener(`comment-updated-${postSlug}`, handleCommentUpdate);
    
    return () => {
      window.removeEventListener(`comment-updated-${postSlug}`, handleCommentUpdate);
    };
  }, [postSlug]);

  const fetchStats = async () => {
    try {
      // 添加时间戳防止缓存
      const response = await fetch(`/api/stats/${postSlug}?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
    setLoading(false);
  };

  const incrementView = async () => {
    try {
      const response = await fetch(`/api/stats/${postSlug}`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error incrementing view:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-4 text-sm text-gray-500">
        <span>加载中...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4 text-sm text-gray-500">
      <div className="flex items-center space-x-1">
        <span>👁️</span>
        <span>{stats.view_count} 次浏览</span>
      </div>
      <div className="flex items-center space-x-1">
        <span>💬</span>
        <span>{stats.comment_count} 条评论</span>
      </div>
      {showLikes && (
        <LikeButton slug={postSlug} className="text-sm" />
      )}
    </div>
  );
} 