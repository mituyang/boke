import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react'
import { getAllPosts, getPostBySlug, getPostContent } from '@/lib/posts'

interface PageProps {
  params: {
    slug: string
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = getPostBySlug(params.slug)
  
  if (!post) {
    notFound()
  }

  const content = await getPostContent(params.slug)

  return (
    <div className="py-12">
      <div className="container">
        {/* Back Button */}
        <Link 
          href="/blog"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回博客列表
        </Link>

        {/* Article Header */}
        <header className="mb-8">
          <div className="mb-4">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {getCategoryName(post.category)}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {post.title}
          </h1>
          
          <div className="flex items-center text-gray-600 space-x-6 mb-6">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              {post.date}
            </div>
            <div className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              {post.author}
            </div>
          </div>
          
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  <Tag className="h-4 w-4 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Article Content */}
        <article className="prose prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </article>

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link 
            href="/blog"
            className="btn-primary"
          >
            查看更多文章
          </Link>
        </div>
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

export async function generateStaticParams() {
  const posts = getAllPosts()
  
  return posts.map((post) => ({
    slug: post.slug,
  }))
} 