'use client';

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from './AuthContext'
import ThemeToggle from './ThemeToggle'
import NotificationBell from './NotificationBell'

export default function Header() {
  const { user, logout, isAdmin, isLoggedIn } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 relative z-30">
      <nav className="container mx-auto px-4 py-4 max-w-4xl relative">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            我的博客
          </Link>
          
          {/* 桌面端导航 */}
          <div className="hidden lg:flex items-center space-x-6">
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
            
            {/* 登录用户可以看到聊天室、写文章和我的文章 */}
            {isLoggedIn() && (
              <>
                <Link href="/chat" className={getLinkStyle('/chat')}>
                  💬 聊天室
                </Link>
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
          </div>

          {/* 右侧按钮组 */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* 通知铃铛 */}
            <NotificationBell />
            
            {/* 主题切换按钮 */}
            <ThemeToggle />
            
            {/* 桌面端用户信息 */}
            <div className="hidden md:flex items-center space-x-4">
              {isLoggedIn() ? (
                <>
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
                </>
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

            {/* 移动端汉堡菜单按钮 */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="菜单"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* 移动端下拉菜单 */}
        {isMenuOpen && (
          <>
            {/* 遮罩层 */}
            <div 
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* 菜单内容 */}
            <div className="lg:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-lg z-50">
              <div className="px-4 py-4 space-y-1">
                <Link 
                  href="/" 
                  className={`${getLinkStyle('/')} block px-3 py-2 rounded-md text-base font-medium`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  首页
                </Link>
                <Link 
                  href="/blog" 
                  className={`${getLinkStyle('/blog')} block px-3 py-2 rounded-md text-base font-medium`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  博客
                </Link>
                <Link 
                  href="/about" 
                  className={`${getLinkStyle('/about')} block px-3 py-2 rounded-md text-base font-medium`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  关于
                </Link>
                <Link 
                  href="/contact" 
                  className={`${getLinkStyle('/contact')} block px-3 py-2 rounded-md text-base font-medium`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  联系
                </Link>
                
                {/* 移动端登录用户菜单 */}
                {isLoggedIn() && (
                  <>
                    <div className="border-t dark:border-gray-700 my-2"></div>
                    <Link 
                      href="/chat" 
                      className={`${getLinkStyle('/chat')} block px-3 py-2 rounded-md text-base font-medium`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      💬 聊天室
                    </Link>
                    <Link 
                      href="/write" 
                      className={`${getLinkStyle('/write')} block px-3 py-2 rounded-md text-base font-medium`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      写文章
                    </Link>
                    <Link 
                      href="/my-posts" 
                      className={`${getLinkStyle('/my-posts')} block px-3 py-2 rounded-md text-base font-medium`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      我的文章
                    </Link>
                    {isAdmin() && (
                      <Link 
                        href="/admin" 
                        className={`${getLinkStyle('/admin')} block px-3 py-2 rounded-md text-base font-medium`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        管理
                      </Link>
                    )}
                    <div className="border-t dark:border-gray-700 my-2"></div>
                    <Link 
                      href="/profile" 
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors block px-3 py-2 rounded-md text-base font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center justify-between">
                        <span>个人资料</span>
                        {isAdmin() && (
                          <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                            管理员
                          </span>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleLogout();
                      }}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left px-3 py-2 rounded-md text-base font-medium"
                    >
                      登出
                    </button>
                  </>
                )}

                {/* 移动端未登录用户菜单 */}
                {!isLoggedIn() && (
                  <>
                    <div className="border-t dark:border-gray-700 my-2"></div>
                    <Link 
                      href="/login" 
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors block px-3 py-2 rounded-md text-base font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      登录
                    </Link>
                    <Link 
                      href="/register" 
                      className="bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors block px-3 py-2 rounded-md text-base font-medium text-center mx-3 mt-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      注册
                    </Link>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </nav>
    </header>
  )
} 