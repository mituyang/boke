'use client';
import { useState, useEffect, useRef } from 'react';
import { withAuth } from '../../components/AuthContext';

interface Message {
  id: number;
  user_id: number;
  username: string;
  user_name: string;
  content: string;
  message_type: string;
  created_at: string;
  is_edited: boolean;
  deleted_at?: string;
  deleted_by?: number;
}

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchMessages();
    initWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // 取消自动滚动功能 - 根据用户要求
  // useEffect(() => {
  //   scrollToBottom();
  // }, [messages]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData.user);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/chat/messages?roomId=1', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('获取消息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const initWebSocket = () => {
    // 注意：这里需要使用 Durable Objects 的 WebSocket URL
    // 暂时使用轮询方式，稍后会实现 WebSocket
    const interval = setInterval(() => {
      fetchMessages();
    }, 2000);

    return () => clearInterval(interval);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          roomId: 1,
          content: newMessage.trim(),
          messageType: 'text'
        }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages(); // 刷新消息列表
      } else {
        const data = await response.json();
        alert(data.error || '发送失败');
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      alert('发送失败');
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId: number) => {
    if (!confirm('确定要删除这条消息吗？')) return;

    try {
      const response = await fetch(`/api/chat/messages?messageId=${messageId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        fetchMessages(); // 刷新消息列表
      } else {
        const data = await response.json();
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除消息失败:', error);
      alert('删除失败');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const canDeleteMessage = (message: Message) => {
    if (!currentUser) return false;
    // 管理员可以删除任何消息，用户只能删除自己的消息
    return currentUser.role === 'admin' || 
           currentUser.role === 'super_admin' || 
           message.user_id === currentUser.id;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">加载聊天室...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* 聊天室头部 */}
          <div className="bg-blue-600 dark:bg-blue-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">💬 主聊天室</h1>
                <p className="text-blue-100 text-sm">实时聊天，畅所欲言</p>
              </div>
              <div className="text-blue-100 text-sm">
                在线用户: {onlineUsers.length > 0 ? onlineUsers.length : '加载中...'}
              </div>
            </div>
          </div>

          <div className="flex h-[70vh]">
            {/* 消息区域 */}
            <div className="flex-1 flex flex-col">
              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className="group">
                    {message.deleted_at ? (
                      <div className="text-gray-400 dark:text-gray-600 text-sm italic">
                        消息已被删除
                      </div>
                    ) : (
                      message.user_id === currentUser?.id ? (
                        // 自己的消息 - 微信风格右对齐
                        <div className="flex justify-end w-full">
                          <div className="flex items-start gap-3 max-w-xs sm:max-w-sm md:max-w-md">
                            {/* 消息内容区域 */}
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatTime(message.created_at)}
                                </span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {message.user_name}
                                </span>
                              </div>
                              
                              <div className="rounded-lg px-3 py-2 bg-blue-500 text-white">
                                {message.content}
                                {Boolean(message.is_edited) && (
                                  <span className="text-xs opacity-70 ml-2">(已编辑)</span>
                                )}
                              </div>

                              {/* 删除按钮 */}
                              {canDeleteMessage(message) && (
                                <div className="text-right">
                                  <button
                                    onClick={() => deleteMessage(message.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-red-500 hover:text-red-700 mt-1"
                                  >
                                    删除
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            {/* 头像 */}
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                              {message.user_name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      ) : (
                        // 其他人的消息 - 微信风格左对齐
                        <div className="flex justify-start w-full">
                          <div className="flex items-start gap-3 max-w-xs sm:max-w-sm md:max-w-md">
                            {/* 头像 */}
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                              {message.user_name.charAt(0).toUpperCase()}
                            </div>
                            
                            {/* 消息内容区域 */}
                            <div className="flex flex-col items-start">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {message.user_name}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatTime(message.created_at)}
                                </span>
                              </div>
                              
                              <div className="rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                                {message.content}
                                {Boolean(message.is_edited) && (
                                  <span className="text-xs opacity-70 ml-2">(已编辑)</span>
                                )}
                              </div>

                              {/* 删除按钮 */}
                              {canDeleteMessage(message) && (
                                <div>
                                  <button
                                    onClick={() => deleteMessage(message.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-red-500 hover:text-red-700 mt-1"
                                  >
                                    删除
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* 发送消息区域 */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="输入消息..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={500}
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? '发送中...' : '发送'}
                  </button>
                </form>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {newMessage.length}/500 字符
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(ChatPage); 