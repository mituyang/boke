'use client';

import Link from 'next/link'
import { useAuth } from './AuthContext'

export default function Header() {
  const { user, logout, isAdmin, isLoggedIn } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <nav className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
            我的博客
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
              首页
            </Link>
            <Link href="/blog" className="text-gray-600 hover:text-gray-900 transition-colors">
              博客
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
              关于
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
              联系
            </Link>
            
            {/* 登录用户可以看到写文章和我的文章 */}
            {isLoggedIn() && (
              <>
                <Link href="/write" className="text-blue-600 hover:text-blue-800 transition-colors font-medium">
                  写文章
                </Link>
                <Link href="/my-posts" className="text-gray-600 hover:text-gray-900 transition-colors">
                  我的文章
                </Link>
              </>
            )}
            
            {/* 管理员才能看到管理链接 */}
            {isAdmin() && (
              <Link href="/admin" className="text-gray-600 hover:text-gray-900 transition-colors">
                管理
              </Link>
            )}
            
            {/* 用户认证状态 */}
            {isLoggedIn() ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  欢迎，{user?.name}
                  {isAdmin() && (
                    <span className="ml-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      管理员
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 transition-colors"
                >
                  登出
                </button>
              </div>
            ) : (
              <div className="space-x-2">
                <Link 
                  href="/login" 
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  登录
                </Link>
                <Link 
                  href="/register" 
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
} 