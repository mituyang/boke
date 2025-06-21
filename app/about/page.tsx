import Link from 'next/link'
import { Github, Twitter, Mail, MapPin, Briefcase, GraduationCap } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="py-12">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-32 h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center text-white text-4xl font-bold">
              我
            </div>
            <h1 className="text-4xl font-bold mb-4">关于我</h1>
            <p className="text-xl text-gray-600">
              一名热爱技术和分享的开发者
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Introduction */}
            <section className="card p-8">
              <h2 className="text-2xl font-bold mb-4">个人简介</h2>
              <div className="prose prose-lg">
                <p>
                  你好！我是一名充满热情的全栈开发者，专注于现代 Web 技术的学习和应用。
                  我热衷于探索新技术，解决复杂问题，并通过代码创造有价值的产品。
                </p>
                <p>
                  通过这个博客，我希望能够分享我的学习心得、技术经验和生活感悟，
                  同时也希望能够帮助其他开发者成长。我相信知识的分享能够创造更大的价值。
                </p>
              </div>
            </section>

            {/* Skills */}
            <section className="card p-8">
              <h2 className="text-2xl font-bold mb-6">技能专长</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">前端技术</h3>
                  <div className="flex flex-wrap gap-2">
                    {['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Vue.js'].map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">后端技术</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Node.js', 'Python', 'Express', 'FastAPI', 'PostgreSQL'].map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Experience */}
            <section className="card p-8">
              <h2 className="text-2xl font-bold mb-6">工作经历</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Briefcase className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold">全栈开发工程师</h3>
                    <p className="text-gray-600">某科技公司 • 2022年至今</p>
                    <p className="text-gray-700 mt-2">
                      负责公司核心产品的前后端开发，参与架构设计，
                      提升了系统性能和用户体验。
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <GraduationCap className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold">计算机科学学士</h3>
                    <p className="text-gray-600">某大学 • 2018-2022</p>
                    <p className="text-gray-700 mt-2">
                      主修计算机科学与技术，专注于软件工程和Web开发。
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="card p-8">
              <h2 className="text-2xl font-bold mb-6">联系方式</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <a 
                    href="mailto:hello@example.com"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    hello@example.com
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <Github className="h-5 w-5 text-gray-600" />
                  <a 
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    GitHub
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <Twitter className="h-5 w-5 text-gray-600" />
                  <a 
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Twitter
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700">中国，北京</span>
                </div>
              </div>
            </section>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <p className="text-lg text-gray-600 mb-6">
              想要了解更多或者有合作机会？
            </p>
            <Link href="/contact" className="btn-primary">
              联系我
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 