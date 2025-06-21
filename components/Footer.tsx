export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center">
          <p className="text-gray-300">
            © {new Date().getFullYear()} 我的个人博客. 由 Next.js 强力驱动
          </p>
        </div>
      </div>
    </footer>
  )
} 