import { notFound } from 'next/navigation'
import { getPostBySlug, getAllSlugs } from '@/lib/posts'
import { formatDateOnly } from '@/lib/utils'
import { remark } from 'remark'
import html from 'remark-html'
import Comments from '@/components/Comments'
import PostStats from '@/components/PostStats'

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  const slugs = getAllSlugs()
  return slugs.map((slug) => ({
    slug,
  }))
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  // 将 Markdown 转换为 HTML
  const processedContent = await remark()
    .use(html)
    .process(post.content)
  const contentHtml = processedContent.toString()

  return (
    <article className="bg-white rounded-lg shadow-md p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <time dateTime={post.date}>
              {formatDateOnly(post.date)}
            </time>
            <PostStats postSlug={params.slug} />
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span 
                  key={tag}
                  className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <div 
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
      
      {/* 评论系统 */}
      <Comments postSlug={params.slug} />
    </article>
  )
} 