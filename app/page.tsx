import Link from 'next/link'
import { getAllPosts } from '@/lib/posts'
import { formatDateOnly } from '@/lib/utils'
import PostStats from '@/components/PostStats'

export default async function Home() {
  const posts = getAllPosts()

  return (
    <div>
      <section className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          欢迎来到我的博客
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
          这里是我分享技术见解、个人思考和生活感悟的地方。
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">最新文章</h2>
        
        {posts.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">暂时还没有文章，敬请期待。</p>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <article key={post.slug} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <Link href={`/blog/${post.slug}`} className="block">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {post.title}
                  </h3>
                </Link>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <time dateTime={post.date}>
                      {formatDateOnly(post.date)}
                    </time>
                    <PostStats postSlug={post.slug} showIncrement={false} />
                  </div>
                  <Link 
                    href={`/blog/${post.slug}`}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                  >
                    阅读更多 →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
} 