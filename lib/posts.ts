import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

const postsDirectory = path.join(process.cwd(), 'posts')

export interface Post {
  slug: string
  title: string
  date: string
  author: string
  excerpt: string
  content: string
  category: string
  tags: string[]
}

export function getAllPosts(): Post[] {
  // 如果posts目录不存在，返回示例数据
  if (!fs.existsSync(postsDirectory)) {
    return [
      {
        slug: 'hello-world',
        title: '欢迎来到我的博客',
        date: '2024-01-01',
        author: '博主',
        excerpt: '这是我的第一篇博客文章，欢迎大家来到我的博客。',
        content: '<p>这是我的第一篇博客文章，欢迎大家来到我的博客。</p>',
        category: 'life',
        tags: ['欢迎', '开始']
      },
      {
        slug: 'getting-started-with-nextjs',
        title: 'Next.js 入门指南',
        date: '2024-01-02',
        author: '博主',
        excerpt: '学习如何使用 Next.js 构建现代化的 React 应用程序。',
        content: '<p>学习如何使用 Next.js 构建现代化的 React 应用程序。</p>',
        category: 'tech',
        tags: ['Next.js', 'React', '前端']
      },
      {
        slug: 'thoughts-on-web-development',
        title: '对 Web 开发的一些思考',
        date: '2024-01-03',
        author: '博主',
        excerpt: '分享我在 Web 开发领域的一些经验和思考。',
        content: '<p>分享我在 Web 开发领域的一些经验和思考。</p>',
        category: 'thoughts',
        tags: ['Web开发', '思考', '经验分享']
      }
    ]
  }

  const fileNames = fs.readdirSync(postsDirectory)
  const allPostsData = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '')
      const fullPath = path.join(postsDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const matterResult = matter(fileContents)

      return {
        slug,
        title: matterResult.data.title || '',
        date: matterResult.data.date || '',
        author: matterResult.data.author || '博主',
        excerpt: matterResult.data.excerpt || '',
        content: matterResult.content,
        category: matterResult.data.category || 'uncategorized',
        tags: matterResult.data.tags || []
      }
    })

  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getPostBySlug(slug: string): Post | null {
  const posts = getAllPosts()
  return posts.find(post => post.slug === slug) || null
}

export async function getPostContent(slug: string): Promise<string> {
  const post = getPostBySlug(slug)
  if (!post) return ''

  const processedContent = await remark()
    .use(html)
    .process(post.content)
  
  return processedContent.toString()
}

export function getPostsByCategory(category: string): Post[] {
  const posts = getAllPosts()
  return posts.filter(post => post.category === category)
}

export function getAllCategories(): string[] {
  const posts = getAllPosts()
  const categories = posts.map(post => post.category)
  return Array.from(new Set(categories))
}

export function getAllTags(): string[] {
  const posts = getAllPosts()
  const tags = posts.flatMap(post => post.tags)
  return Array.from(new Set(tags))
} 