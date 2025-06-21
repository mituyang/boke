import Link from 'next/link'
import { Calendar, User, Tag, Search } from 'lucide-react'
import { getAllPosts, getAllCategories } from '@/lib/posts'

export default function BlogPage() {
  const posts = getAllPosts()
  const categories = getAllCategories()

  return (
    <div className="py-12">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">博客文章</h1>
          <p className="text-lg text-gray-600">
            分享技术心得、生活感悟和个人思考
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/blog"
              className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium"
            >
              全部
            </Link>
            {categories.map((category) => (
              <Link
                key={category}
                href={`/blog?category=${category}`}
                className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-full text-sm font-medium transition-colors"
              >
                {getCategoryName(category)}
              </Link>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article key={post.slug} className="card hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                    {getCategoryName(post.category)}
                  </span>
                </div>
                
                <h2 className="text-xl font-bold mb-3 hover:text-blue-600 transition-colors">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h2>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {post.date}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {post.author}
                    </div>
                  </div>
                </div>
                
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-4">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              暂无文章
            </h3>
            <p className="text-gray-500">
              目前还没有发布任何文章，请稍后再来查看。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function getCategoryName(category: string): string {
  const categoryMap: Record<string, string> = {
    tech: '技术',
    life: '生活',
    thoughts: '思考',
    uncategorized: '其他'
  }
  return categoryMap[category] || category
} 