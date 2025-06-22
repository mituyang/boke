'use client';

import { useState, useEffect } from 'react';
import { useAuth, withAuth } from '../../components/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';



interface UserPost {
  id: number;
  slug: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function WritePage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'draft' as 'draft' | 'published'
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [postId, setPostId] = useState<number | null>(null);

  // 加载要编辑的文章
  const loadPost = async (id: string) => {
    if (!token) return;

    try {
      // 先通过ID获取文章的slug
      const response = await fetch(`/api/user-posts?id=${id}`, {
        credentials: 'include' // 使用 cookie 认证
      });

      const data = await response.json();
      
      if (data.success && data.post) {
        const post = data.post;
        setFormData({
          title: post.title,
          content: post.content,
          status: post.status
        });
        setPostId(post.id);
        setIsEditing(true);
      } else {
        alert('文章不存在或无权限访问');
        router.push('/my-posts');
      }
    } catch (error) {
      console.error('加载文章失败:', error);
      alert('加载文章失败');
      router.push('/my-posts');
    }
  };

  // 保存文章
  const handleSave = async (status: 'draft' | 'published') => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('标题和内容不能为空');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...(isEditing && { id: postId }),
        title: formData.title.trim(),
        content: formData.content.trim(),
        status
      };

      const response = await fetch('/api/user-posts', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // 使用 cookie 认证
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.success) {
        const action = isEditing ? '更新' : '创建';
        const statusText = status === 'published' ? '并发布' : '为草稿';
        alert(`文章${action}${statusText}成功！`);
        router.push('/my-posts');
      } else {
        alert(data.message || '保存失败');
      }
    } catch (error) {
      console.error('保存文章失败:', error);
      alert('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 预览功能
  const handlePreview = () => {
    if (!formData.content.trim()) {
      alert('内容不能为空');
      return;
    }

    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${formData.title || '预览'}</title>
          <meta charset="UTF-8">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px; 
              line-height: 1.6;
            }
            h1, h2, h3, h4, h5, h6 { color: #333; }
            pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
            code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
            blockquote { border-left: 4px solid #ddd; margin-left: 0; padding-left: 20px; color: #666; }
          </style>
        </head>
        <body>
          <h1>${formData.title || '预览'}</h1>
          <div style="white-space: pre-wrap;">${formData.content}</div>
        </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  useEffect(() => {
    if (editId) {
      loadPost(editId);
    }
  }, [editId, token]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {isEditing ? '编辑文章' : '写文章'}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {isEditing ? '修改您的文章' : '分享您的想法和知识'}
              </p>
            </div>
            <button
              onClick={() => router.push('/my-posts')}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
            >
              返回我的文章
            </button>
          </div>
        </div>

        {/* 文章表单 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6">
            {/* 标题输入 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                文章标题 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="请输入文章标题..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                maxLength={100}
              />
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {formData.title.length}/100 字符
              </div>
            </div>

            {/* 内容输入 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                文章内容 *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="请输入文章内容...&#10;&#10;支持Markdown格式：&#10;# 一级标题&#10;## 二级标题&#10;**粗体**&#10;*斜体*&#10;[链接](http://example.com)&#10;![图片](http://example.com/image.jpg)&#10;```代码块```"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={20}
                style={{ minHeight: '500px' }}
              />
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                支持 Markdown 语法，{formData.content.length} 字符
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-3">
                <button
                  onClick={handlePreview}
                  disabled={!formData.content.trim()}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800"
                >
                  预览
                </button>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleSave('draft')}
                  disabled={loading || !formData.title.trim() || !formData.content.trim()}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800"
                >
                  {loading ? '保存中...' : '保存草稿'}
                </button>

                <button
                  onClick={() => handleSave('published')}
                  disabled={loading || !formData.title.trim() || !formData.content.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '发布中...' : (isEditing ? '更新并发布' : '发布文章')}
                </button>
              </div>
            </div>

            {/* Markdown 帮助 */}
            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Markdown 语法帮助</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded"># 标题</code> - 一级标题</div>
                <div><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">## 标题</code> - 二级标题</div>
                <div><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">**粗体**</code> - <strong>粗体文字</strong></div>
                <div><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">*斜体*</code> - <em>斜体文字</em></div>
                <div><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">[链接文字](网址)</code> - 创建链接</div>
                <div><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">![图片描述](图片网址)</code> - 插入图片</div>
                <div><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">```代码```</code> - 代码块</div>
                <div><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">&gt; 引用</code> - 引用文字</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(WritePage); 