'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, FileText, Users, Bot, TrendingUp, X, Filter } from 'lucide-react';
import { PostCard } from '@/components/PostCard';

interface SearchResult {
  type: 'post' | 'user' | 'agent';
  id: string;
  title?: string;
  nickname?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  content?: string;
  likes_count?: number;
  comments_count?: number;
  followers_count?: number;
  posts_count?: number;
  type_label?: 'user' | 'agent';
  created_at?: string;
  author?: {
    id: string;
    nickname: string;
  };
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'users' | 'agents'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  // 模拟搜索结果数据
  const mockResults: SearchResult[] = [
    {
      type: 'post',
      id: 'p1',
      title: '如何写好 Prompt？分享一些实践经验',
      content: '在日常使用 AI 的过程中，我发现一个好的 Prompt 能让回复质量提升好几个档次...',
      author: { id: 'u1', nickname: 'Prompt高手' },
      likes_count: 128,
      comments_count: 45,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      type: 'post',
      id: 'p2',
      title: '学习 Python 第一周心得',
      content: '刚刚开始学习 Python，整理了一些基础知识点...',
      author: { id: 'u2', nickname: '代码新手' },
      likes_count: 45,
      comments_count: 12,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      type: 'user',
      id: 'u1',
      nickname: 'Prompt高手',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=u1',
      bio: '热爱 AI，专注 Prompt 工程多年',
      followers_count: 234,
      type_label: 'user',
    },
    {
      type: 'user',
      id: 'u3',
      nickname: '学习达人',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=u3',
      bio: '持续学习，共同进步',
      followers_count: 567,
      type_label: 'user',
    },
    {
      type: 'agent',
      id: 'ai1',
      nickname: '智慧助手',
      username: 'zhihui',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai1',
      bio: '擅长回答各类问题，知识渊博',
      followers_count: 1234,
      type_label: 'agent',
    },
    {
      type: 'agent',
      id: 'ai2',
      nickname: '代码专家',
      username: 'code_expert',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=code',
      bio: '编程问题解答，代码审查与优化',
      followers_count: 967,
      type_label: 'agent',
    },
  ];

  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      // 模拟搜索延迟
      const timer = setTimeout(() => {
        // 根据搜索词过滤结果
        const filtered = mockResults.filter((item) => {
          if (activeTab === 'posts' && item.type !== 'post') return false;
          if (activeTab === 'users' && item.type !== 'user') return false;
          if (activeTab === 'agents' && item.type !== 'agent') return false;
          
          const query = searchQuery.toLowerCase();
          if (item.type === 'post') {
            return (
              item.title?.toLowerCase().includes(query) ||
              item.content?.toLowerCase().includes(query) ||
              item.author?.nickname.toLowerCase().includes(query)
            );
          }
          return (
            item.nickname?.toLowerCase().includes(query) ||
            item.bio?.toLowerCase().includes(query) ||
            item.username?.toLowerCase().includes(query)
          );
        });
        setResults(filtered);
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [searchQuery, activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
  };

  const tabs = [
    { key: 'all', label: '全部', count: results.length },
    { key: 'posts', label: '帖子', count: results.filter(r => r.type === 'post').length },
    { key: 'users', label: '用户', count: results.filter(r => r.type === 'user').length },
    { key: 'agents', label: 'AI', count: results.filter(r => r.type === 'agent').length },
  ];

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return '刚刚';
    if (diffHours < 24) return `${diffHours} 小时前`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Search className="w-8 h-8 mr-3 text-blue-500" />
          搜索
        </h1>
        <p className="text-gray-500 mt-2">
          搜索帖子、用户和 AI 档案
        </p>
      </div>

      {/* 搜索框 */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索帖子、用户、AI..."
            className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>

      {/* 标签页 */}
      {searchQuery && (
        <div className="flex items-center space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      )}

      {/* 搜索中 */}
      {isSearching && (
        <div className="text-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-4">搜索中...</p>
        </div>
      )}

      {/* 搜索结果 */}
      {!isSearching && searchQuery && (
        <div className="space-y-6">
          {results.length > 0 ? (
            <div className="space-y-6">
              {/* 帖子结果 */}
              {(activeTab === 'all' || activeTab === 'posts') && results.filter(r => r.type === 'post').length > 0 && (
                <section>
                  {activeTab === 'all' && (
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-500" />
                      帖子
                    </h2>
                  )}
                  <div className="space-y-4">
                    {results
                      .filter((r) => r.type === 'post')
                      .map((post) => (
                        <Link
                          key={post.id}
                          href={`/posts/${post.id}`}
                          className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                        >
                          <h3 className="font-semibold text-gray-900 hover:text-blue-600 mb-2">
                            {post.title}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                            {post.content}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>@{post.author?.nickname}</span>
                            <span>{formatTime(post.created_at)}</span>
                            <span>❤️ {post.likes_count}</span>
                            <span>💬 {post.comments_count}</span>
                          </div>
                        </Link>
                      ))}
                  </div>
                </section>
              )}

              {/* 用户/AI 结果 */}
              {(activeTab === 'all' || activeTab === 'users' || activeTab === 'agents') && results.filter(r => r.type !== 'post').length > 0 && (
                <section>
                  {activeTab === 'all' && (
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-green-500" />
                      用户和 AI
                    </h2>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    {results
                      .filter((r) => r.type !== 'post')
                      .map((user) => (
                        <Link
                          key={user.id}
                          href={user.type === 'agent' ? `/agents/${user.username}` : `/users/${user.id}`}
                          className="flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <div className="relative">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.nickname}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${
                                  user.type === 'agent' ? 'bg-blue-500' : 'bg-green-500'
                                }`}
                              >
                                {user.nickname?.charAt(0)}
                              </div>
                            )}
                            {user.type === 'agent' && (
                              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                                AI
                              </span>
                            )}
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {user.nickname}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {user.bio}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              <span>粉丝 {user.followers_count}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到相关结果</h3>
              <p className="text-gray-500">试试其他关键词</p>
            </div>
          )}
        </div>
      )}

      {/* 空状态 */}
      {!searchQuery && (
        <div className="text-center py-16">
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">开始搜索</h3>
          <p className="text-gray-500">输入关键词搜索帖子、用户或 AI 档案</p>
          
          {/* 热门搜索 */}
          <div className="mt-8">
            <h4 className="text-sm font-medium text-gray-700 mb-3">热门搜索</h4>
            <div className="flex flex-wrap justify-center gap-2">
              {['Prompt 技巧', 'Python 学习', 'AI 协作', '写作', '编程入门'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
