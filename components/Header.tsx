'use client';

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthContext'
import ThemeToggle from './ThemeToggle'
import NotificationBell from './NotificationBell'

export default function Header() {
  const { user, logout, isAdmin, isLoggedIn } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  // 判断是否为当前页面
  const isCurrentPage = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  // 获取链接样式
  const getLinkStyle = (href: string) => {
    return isCurrentPage(href)
      ? "text-blue-600 dark:text-blue-400 font-medium transition-colors"
      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors";
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <nav className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            我的博客
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link href="/" className={getLinkStyle('/')}>
              首页
            </Link>
            <Link href="/blog" className={getLinkStyle('/blog')}>
              博客
            </Link>
            <Link href="/about" className={getLinkStyle('/about')}>
              关于
            </Link>
            <Link href="/contact" className={getLinkStyle('/contact')}>
              联系
            </Link>
            
            {/* 登录用户可以看到写文章和我的文章 */}
            {isLoggedIn() && (
              <>
                <Link href="/write" className={getLinkStyle('/write')}>
                  写文章
                </Link>
                <Link href="/my-posts" className={getLinkStyle('/my-posts')}>
                  我的文章
                </Link>
              </>
            )}
            
            {/* 管理员才能看到管理链接 */}
            {isAdmin() && (
              <Link href="/admin" className={getLinkStyle('/admin')}>
                管理
              </Link>
            )}
            
            {/* 通知铃铛 */}
            <NotificationBell />
            
            {/* 主题切换按钮 */}
            <ThemeToggle />
            
            {/* 用户认证状态 */}
            {isLoggedIn() ? (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/profile" 
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="查看个人资料"
                >
                  欢迎，{user?.name}
                  {isAdmin() && (
                    <span className="ml-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                      管理员
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  登出
                </button>
              </div>
            ) : (
              <div className="space-x-2">
                <Link 
                  href="/login" 
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  登录
                </Link>
                <Link 
                  href="/register" 
                  className="bg-blue-600 dark:bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
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