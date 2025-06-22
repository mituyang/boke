import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <nav className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
            我的博客
          </Link>
          
          <div className="flex space-x-6">
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
            <Link href="/admin" className="text-gray-600 hover:text-gray-900 transition-colors">
              管理
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
} 