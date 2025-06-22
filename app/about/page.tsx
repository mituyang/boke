export default function AboutPage() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        关于我
      </h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
          欢迎来到我的个人博客！我是一名热爱技术的开发者，专注于 Web 开发和软件工程。
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">技能专长</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>前端开发：React, Next.js, TypeScript, Vue.js</li>
          <li>后端开发：Node.js, Python, Go</li>
          <li>数据库：PostgreSQL, MongoDB, Redis</li>
          <li>云服务：AWS, Cloudflare, Vercel</li>
          <li>开发工具：Git, Docker, VS Code</li>
        </ul>
        
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">博客主题</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          在这个博客中，我分享：
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>技术教程和最佳实践</li>
          <li>项目开发经验分享</li>
          <li>新技术探索和学习心得</li>
          <li>编程思考和个人见解</li>
        </ul>
        
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">联系方式</h2>
        <p className="text-gray-700 dark:text-gray-300">
          如果你有任何问题或想法，欢迎通过邮件与我联系。我很乐意与志同道合的朋友交流技术和分享经验。
        </p>
      </div>
    </div>
  )
} 