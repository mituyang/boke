'use client';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { formatDate } from '../lib/utils';

interface Comment {
  id: number;
  user_name: string;
  username: string;
  content: string;
  created_at: string;
  parent_id?: number;
  replies: Comment[];
}

interface CommentsProps {
  postSlug: string;
}

export default function Comments({ postSlug }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const { user, isLoggedIn } = useAuth();

  // 获取评论
  useEffect(() => {
    fetchComments();
  }, [postSlug]);

  const fetchComments = async () => {
    try {
      // 添加时间戳防止缓存
      const response = await fetch(`/api/comments/${postSlug}?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
    setLoading(false);
  };

  // 提交评论
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoggedIn()) {
      setMessage('请先登录后再发表评论');
      return;
    }

    if (!content.trim()) {
      setMessage('评论内容不能为空');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch(`/api/comments/${postSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content.trim() }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('评论发表成功！');
        setContent('');
        // 重新获取评论列表
        fetchComments();
        // 触发统计更新事件
        window.dispatchEvent(new CustomEvent(`comment-updated-${postSlug}`));
      } else {
        setMessage(result.error || '评论发表失败');
      }
    } catch (error) {
      setMessage('网络错误，请稍后重试');
    }

    setSubmitting(false);
  };

  // 递归计算总评论数（包括回复）
  const getTotalCommentCount = (comments: Comment[]): number => {
    let count = 0;
    comments.forEach(comment => {
      count += 1; // 当前评论
      if (comment.replies && comment.replies.length > 0) {
        count += getTotalCommentCount(comment.replies); // 递归计算回复数量
      }
    });
    return count;
  };

  // 渲染单个评论
  const renderComment = (comment: Comment, depth = 0) => (
    <div 
      key={comment.id} 
      className={`border-l-2 border-gray-200 dark:border-gray-600 pl-4 mb-4 ${depth > 0 ? 'ml-6' : ''}`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">{comment.user_name}</h4>
            <span className="text-sm text-gray-500 dark:text-gray-400">@{comment.username}</span>
          </div>
          <time className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(comment.created_at)}
          </time>
        </div>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
      </div>
      
      {/* 渲染回复 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map(reply => renderComment(reply, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        评论 ({getTotalCommentCount(comments)})
      </h3>

      {/* 评论表单 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">发表评论</h4>
        
        {!isLoggedIn() ? (
          <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <p className="text-blue-800 dark:text-blue-200 mb-3">请先登录后再发表评论</p>
            <div className="space-x-3">
              <a
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                立即登录
              </a>
              <a
                href="/register"
                className="inline-flex items-center px-4 py-2 border border-blue-300 dark:border-blue-600 text-sm font-medium rounded-md text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700"
              >
                注册账号
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span>当前用户：</span>
                <span className="font-medium text-gray-900 dark:text-white">{user?.name}</span>
                <span className="text-gray-500 dark:text-gray-400">(@{user?.username})</span>
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded mb-4 ${
                message.includes('成功') 
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 border border-green-300 dark:border-green-700' 
                  : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 border border-red-300 dark:border-red-700'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  评论内容 *
                </label>
                <textarea
                  id="content"
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="请输入您的评论..."
                  maxLength={1000}
                />
                <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {content.length}/1000
                </div>
              </div>
              
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '发表中...' : '发表评论'}
              </button>
            </form>
          </>
        )}
      </div>

      {/* 评论列表 */}
      <div>
        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-600 dark:text-gray-400">正在加载评论...</div>
          </div>
        ) : getTotalCommentCount(comments) > 0 ? (
          <div className="space-y-4">
            {comments.map(comment => renderComment(comment))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400">暂无评论，来发表第一条评论吧！</div>
          </div>
        )}
      </div>
    </div>
  );
} 