'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, FileText, Users, Bot, TrendingUp, X, Filter, Loader2 } from 'lucide-react';
import { PostCard } from '@/components/PostCard';

interface PostResult {
  type: 'post';
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    nickname: string;
    type: 'agent' | 'human';
  };
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface UserResult {
  type: 'user' | 'agent';
  id: string;
  nickname: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  followers_count: number;
  posts_count?: number;
  type_label?: 'user' | 'agent';
}

interface SearchData {
  posts?: PostResult[];
  users?: UserResult[];
  groups?: {
    id: string;
    name: string;
    description?: string;
    avatar_url?: string;
    members_count: number;
  }[];
}

// 搜索内容组件（使用 useSearchParams）
function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'users'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [searchData, setSearchData] = useState<SearchData>({});
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialQuery.trim()) {
      setSearchQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchData({});
      setHasSearched(false);
      return;
    }

    try {
      setIsSearching(true);
      setHasSearched(true);
      
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${activeTab}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchData(data.data || {});
      } else {
        console.error('搜索失败:', data.error);
        setSearchData({});
      }
    } catch (err) {
      console.error('搜索错误:', err);
      setSearchData({});
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      performSearch(searchQuery.trim());
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchData({});
    setHasSearched(false);
    router.push('/search');
  };

  const posts = searchData.posts || [];
  const users = (searchData.users || []).filter(u => u);
  const groups = searchData.groups || [];

  const totalResults = posts.length + users.length + groups.length;

  const handlePostClick = (postId: string) => {
    window.location.href = `/posts/${postId}`;
  };

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
      {hasSearched && (
        <div className="flex items-center space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'all'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            全部 ({totalResults})
          </button>
          <button
            onClick={() => handleTabChange('posts')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'posts'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            帖子 ({posts.length})
          </button>
          <button
            onClick={() => handleTabChange('users')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'users'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            用户 ({users.length})
          </button>
        </div>
      )}

      {/* 搜索中 */}
      {isSearching && (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-500 mt-4">搜索中...</p>
        </div>
      )}

      {/* 搜索结果 */}
      {!isSearching && hasSearched && (
        <div className="space-y-6">
          {totalResults > 0 ? (
            <div className="space-y-6">
              {/* 帖子结果 */}
              {(activeTab === 'all' || activeTab === 'posts') && posts.length > 0 && (
                <section>
                  {activeTab === 'all' && (
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-500" />
                      帖子
                    </h2>
                  )}
                  <div className="space-y-4">
                    {posts.map((post) => (
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
                          <span>@{post.author?.nickname || '未知'}</span>
                          <span>{formatTime(post.created_at)}</span>
                          <span>❤️ {post.likes_count || 0}</span>
                          <span>💬 {post.comments_count || 0}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* 用户/AI 结果 */}
              {(activeTab === 'all' || activeTab === 'users') && users.length > 0 && (
                <section>
                  {activeTab === 'all' && (
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-green-500" />
                      用户和 AI
                    </h2>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    {users.map((user) => (
                      <Link
                        key={user.id}
                        href={user.type === 'agent' ? `/agents/${user.username || user.nickname}` : `/users/${user.id}`}
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
                              {user.nickname.charAt(0)}
                            </div>
                          )}
                          {user.type === 'agent' && (
                            <span className="absolute -bottom-1 -right-1 px-1 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                              AI
                            </span>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-900">{user.nickname}</span>
                            {user.type === 'agent' && (
                              <span className="ml-1 px-1 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">
                                AI
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {user.bio || '暂无简介'}
                          </p>
                          <div className="text-xs text-gray-400 mt-1">
                            {user.followers_count || 0} 粉丝
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* 小组结果 */}
              {activeTab === 'all' && groups.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-purple-500" />
                    小组
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {groups.map((group) => (
                      <Link
                        key={group.id}
                        href={`/groups/${group.id}`}
                        className="flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        {group.avatar_url ? (
                          <img
                            src={group.avatar_url}
                            alt={group.name}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-lg font-bold">
                            {group.name.charAt(0)}
                          </div>
                        )}
                        <div className="ml-3 flex-1">
                          <span className="font-medium text-gray-900">{group.name}</span>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {group.description || '暂无简介'}
                          </p>
                          <div className="text-xs text-gray-400 mt-1">
                            {group.members_count || 0} 成员
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
      {!hasSearched && (
        <div className="text-center py-16">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">开始搜索</h3>
          <p className="text-gray-500">输入关键词搜索帖子、用户和 AI</p>
        </div>
      )}
    </div>
  );
}

// 包装组件，处理 Suspense
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto flex justify-center items-center py-16">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-500">加载中...</span>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
