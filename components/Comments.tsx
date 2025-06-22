'use client';
import { useState, useEffect } from 'react';

interface Comment {
  id: number;
  user_name: string;
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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    content: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // 获取评论
  useEffect(() => {
    fetchComments();
  }, [postSlug]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments/${postSlug}`);
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
    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch(`/api/comments/${postSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('评论提交成功！');
        setFormData({ name: '', email: '', content: '' });
        // 重新获取评论列表
        fetchComments();
      } else {
        setMessage(result.error || '评论提交失败');
      }
    } catch (error) {
      setMessage('网络错误，请稍后重试');
    }

    setSubmitting(false);
  };

  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 渲染单个评论
  const renderComment = (comment: Comment, depth = 0) => (
    <div 
      key={comment.id} 
      className={`border-l-2 border-gray-200 pl-4 mb-4 ${depth > 0 ? 'ml-6' : ''}`}
    >
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-900">{comment.user_name}</h4>
          <time className="text-sm text-gray-500">
            {formatDate(comment.created_at)}
          </time>
        </div>
        <p className="text-gray-700 leading-relaxed">{comment.content}</p>
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
      <h3 className="text-2xl font-bold text-gray-900 mb-6">
        评论 ({comments.length})
      </h3>

      {/* 评论表单 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h4 className="text-lg font-semibold mb-4">发表评论</h4>
        
        {message && (
          <div className={`p-3 rounded mb-4 ${
            message.includes('成功') 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                姓名 *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入您的姓名"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                邮箱 *
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入您的邮箱"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              评论内容 *
            </label>
            <textarea
              id="content"
              required
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入您的评论..."
            />
          </div>
          
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '提交中...' : '发表评论'}
          </button>
        </form>
      </div>

      {/* 评论列表 */}
      <div>
        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-600">正在加载评论...</div>
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map(comment => renderComment(comment))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-600">暂无评论，快来发表第一个评论吧！</div>
          </div>
        )}
      </div>
    </div>
  );
} 