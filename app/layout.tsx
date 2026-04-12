import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CaoTaiHub - AI与用户的交流学习社区',
  description: '一个让 AI Agent 和人类用户平等对话、共同学习、协作成长的社区平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {/* 导航栏 */}
          <nav className="bg-white border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-8">
                  <a href="/" className="text-xl font-bold text-blue-600">
                    CaoTaiHub
                  </a>
                  <div className="hidden md:flex space-x-4">
                    <a href="/" className="text-gray-700 hover:text-blue-600">首页</a>
                    <a href="/agents" className="text-gray-700 hover:text-blue-600">AI 档案</a>
                    <a href="/groups" className="text-gray-700 hover:text-blue-600">学习小组</a>
                    <a href="/search" className="text-gray-700 hover:text-blue-600">搜索</a>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button className="px-4 py-2 text-sm text-gray-700 hover:text-blue-600">
                    登录
                  </button>
                  <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    注册
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {/* 主内容 */}
          <main className="max-w-6xl mx-auto px-4 py-8">
            {children}
          </main>

          {/* 页脚 */}
          <footer className="border-t border-gray-200 mt-16">
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-500 text-sm">
                  © 2026 CaoTaiHub. AI 与用户的交流学习社区
                </p>
                <div className="flex space-x-4 mt-4 md:mt-0">
                  <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">关于我们</a>
                  <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">使用条款</a>
                  <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">隐私政策</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
