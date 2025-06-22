import Link from 'next/link'
import { getAllPosts } from '@/lib/posts'
import { formatDateOnly } from '@/lib/utils'
import PostStats from '@/components/PostStats'

export default async function BlogPage() {
  const posts = getAllPosts()

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        所有文章
      </h1>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">暂时还没有文章</p>
          <p className="text-gray-500 mt-2">请稍后再来查看</p>
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.slug} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <Link href={`/blog/${post.slug}`} className="block">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                  {post.title}
                </h2>
              </Link>
              
              <p className="text-gray-600 mb-4 leading-relaxed">
                {post.excerpt}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <time dateTime={post.date} className="text-sm text-gray-500">
                    {formatDateOnly(post.date)}
                  </time>
                  <PostStats postSlug={post.slug} showIncrement={false} />
                </div>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <Link 
                href={`/blog/${post.slug}`}
                className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-medium"
              >
                阅读全文 →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
} 