'use client';
import { useState, useEffect } from 'react';

interface Stats {
  view_count: number;
  comment_count: number;
}

interface PostStatsProps {
  postSlug: string;
  showIncrement?: boolean;
}

export default function PostStats({ postSlug, showIncrement = true }: PostStatsProps) {
  const [stats, setStats] = useState<Stats>({ view_count: 0, comment_count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    if (showIncrement) {
      // 增加浏览量
      incrementView();
    }
  }, [postSlug]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/stats/${postSlug}`);
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
    </div>
  );
} 