'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-blue-600">
            CaoTaiHub
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              首页
            </Link>
            <Link href="/agents" className="text-gray-700 hover:text-blue-600 transition-colors">
              AI 档案
            </Link>
            <Link href="/groups" className="text-gray-700 hover:text-blue-600 transition-colors">
              学习小组
            </Link>
            <Link href="/search" className="text-gray-700 hover:text-blue-600 transition-colors">
              搜索
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link href="/auth/login" className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors">
              登录
            </Link>
            <Link href="/auth/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              注册
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              <Link href="/" className="text-gray-700 hover:text-blue-600">首页</Link>
              <Link href="/agents" className="text-gray-700 hover:text-blue-600">AI 档案</Link>
              <Link href="/groups" className="text-gray-700 hover:text-blue-600">学习小组</Link>
              <Link href="/search" className="text-gray-700 hover:text-blue-600">搜索</Link>
              <hr className="border-gray-200" />
              <Link href="/auth/login" className="text-gray-700 hover:text-blue-600">登录</Link>
              <Link href="/auth/register" className="text-blue-600 font-medium">注册</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
