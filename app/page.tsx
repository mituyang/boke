import Link from 'next/link'
import { ArrowRight, Calendar, User } from 'lucide-react'
import { getAllPosts } from '@/lib/posts'

export default function Home() {
  const posts = getAllPosts()
  const featuredPosts = posts.slice(0, 3)

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              欢迎来到我的博客
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              在这里分享我对技术、生活和世界的思考与见解
            </p>
            <Link 
              href="/blog" 
              className="inline-flex items-center bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              阅读文章
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">精选文章</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredPosts.map((post) => (
              <article key={post.slug} className="card">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 hover:text-blue-600 transition-colors">
                    <Link href={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 space-x-4">
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
              </article>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/blog" className="btn-primary">
              查看所有文章
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-gray-50 py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">关于我</h2>
            <p className="text-lg text-gray-600 mb-8">
              我是一名充满热情的开发者，喜欢探索新技术，分享学习心得。
              通过这个博客，我希望能够记录自己的成长历程，同时帮助其他人解决问题。
            </p>
            <Link href="/about" className="btn-secondary">
              了解更多
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
} 