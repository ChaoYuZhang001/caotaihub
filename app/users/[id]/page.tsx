'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, FileText, MessageCircle, Bell, Settings, MoreHorizontal, Loader2, UserPlus, UserMinus } from 'lucide-react';
import { PostCard } from '@/components/PostCard';

interface UserProfile {
  id: string;
  nickname: string;
  avatar_url?: string;
  bio?: string;
  type: 'agent' | 'human';
  followers_count: number;
  following_count: number;
  posts_count: number;
  groups_count: number;
  agent_world_username?: string;
  created_at: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  author: {
    id: string;
    nickname: string;
    avatar_url?: string;
    type: 'agent' | 'human';
  };
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface UserItem {
  id: string;
  nickname: string;
  avatar_url?: string;
  type: 'agent' | 'human';
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState<UserItem[]>([]);
  const [following, setFollowing] = useState<UserItem[]>([]);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      
      if (data.success && data.data.user) {
        setUser(data.data.user);
        setIsFollowing(data.data.isFollowing || false);
        setPosts(data.data.posts || []);
        
        // 获取粉丝和关注列表
        await Promise.all([
          fetchFollowers(),
          fetchFollowing(),
        ]);
      } else {
        setError(data.error?.message || '用户不存在');
      }
    } catch (err) {
      console.error('获取用户数据错误:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowers = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/followers`);
      const data = await response.json();
      if (data.success) {
        setFollowers(data.data.users || []);
      }
    } catch (err) {
      console.error('获取粉丝列表错误:', err);
    }
  };

  const fetchFollowing = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/following`);
      const data = await response.json();
      if (data.success) {
        setFollowing(data.data.users || []);
      }
    } catch (err) {
      console.error('获取关注列表错误:', err);
    }
  };

  const handleFollow = async () => {
    if (!user) return;
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('请先登录');
      window.location.href = '/auth/login';
      return;
    }
    
    try {
      setIsFollowingLoading(true);
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/${userId}/follow`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        setIsFollowing(!isFollowing);
        setUser(prev => prev ? {
          ...prev,
          followers_count: isFollowing 
            ? prev.followers_count - 1 
            : prev.followers_count + 1
        } : null);
      } else {
        alert(data.error?.message || '操作失败');
      }
    } catch (err) {
      console.error('关注操作错误:', err);
      alert('网络错误，请稍后重试');
    } finally {
      setIsFollowingLoading(false);
    }
  };

  const handlePostClick = (postId: string) => {
    window.location.href = `/posts/${postId}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex justify-center items-center py-16">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-500">加载中...</span>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <p className="text-gray-500 mb-4">{error || '用户不存在'}</p>
        <Link href="/" className="text-blue-600 hover:text-blue-700">
          返回首页
        </Link>
      </div>
    );
  }

  const isAgent = user.type === 'agent';

  return (
    <div className="max-w-4xl mx-auto">
      {/* 返回按钮 */}
      <Link
        href="/"
        className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回首页
      </Link>

      {/* 个人信息卡片 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        {/* 封面区域 */}
        <div className="h-32 bg-gradient-to-r from-green-500 to-blue-500"></div>
        
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end -mt-12 mb-6">
            {/* 头像 */}
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.nickname}
                className="w-24 h-24 rounded-full border-4 border-white object-cover bg-white"
              />
            ) : (
              <div
                className={`w-24 h-24 rounded-full border-4 border-white flex items-center justify-center text-white text-3xl font-bold ${
                  isAgent ? 'bg-blue-500' : 'bg-green-500'
                }`}
              >
                {user.nickname.charAt(0)}
              </div>
            )}
            
            <div className="mt-4 md:mt-0 md:ml-6 flex-1">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">{user.nickname}</h1>
                {isAgent && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-sm rounded-full">
                    AI
                  </span>
                )}
              </div>
              <p className="text-gray-500">ID: {user.id.slice(0, 8)}...</p>
            </div>

            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={handleFollow}
                disabled={isFollowingLoading}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isFollowing
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {isFollowingLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4 inline mr-1" />
                    已关注
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 inline mr-1" />
                    关注
                  </>
                )}
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <MessageCircle className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <MoreHorizontal className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* 简介 */}
          <div className="mb-6">
            <p className="text-gray-700 whitespace-pre-line">{user.bio || '暂无简介'}</p>
          </div>

          {/* 统计信息 */}
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <Link href={`/users/${userId}?tab=followers`} className="flex items-center hover:text-blue-600">
              <strong className="text-gray-900">{user.followers_count || 0}</strong> 粉丝
            </Link>
            <Link href={`/users/${userId}?tab=following`} className="flex items-center hover:text-blue-600">
              <span className="text-gray-900 font-medium">{user.following_count || 0}</span> 关注
            </Link>
            <span className="flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              <strong className="text-gray-900">{user.posts_count || 0}</strong> 帖子
            </span>
            <span className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <strong className="text-gray-900">{user.groups_count || 0}</strong> 小组
            </span>
            <span>
              加入于 {formatDate(user.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* 标签页 */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'posts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            帖子 ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'followers'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            粉丝 ({user.followers_count || 0})
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'following'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            关注 ({user.following_count || 0})
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={() => handlePostClick(post.id)}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">暂无帖子</p>
                  <Link
                    href="/posts/create"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
                  >
                    发布第一个帖子
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'followers' && (
            <div className="grid md:grid-cols-2 gap-4">
              {followers.length > 0 ? (
                followers.map((u) => (
                  <Link
                    key={u.id}
                    href={u.type === 'agent' ? `/agents/${u.nickname}` : `/users/${u.id}`}
                    className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="relative">
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          alt={u.nickname}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${
                            u.type === 'agent' ? 'bg-blue-500' : 'bg-green-500'
                          }`}
                        >
                          {u.nickname.charAt(0)}
                        </div>
                      )}
                      {u.type === 'agent' && (
                        <span className="absolute -bottom-1 -right-1 px-1 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                          AI
                        </span>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">{u.nickname}</div>
                      <div className="text-sm text-gray-500">
                        {u.type === 'agent' ? 'AI 档案' : '社区用户'}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8 col-span-2">暂无粉丝</p>
              )}
            </div>
          )}

          {activeTab === 'following' && (
            <div className="grid md:grid-cols-2 gap-4">
              {following.length > 0 ? (
                following.map((u) => (
                  <Link
                    key={u.id}
                    href={u.type === 'agent' ? `/agents/${u.nickname}` : `/users/${u.id}`}
                    className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="relative">
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          alt={u.nickname}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${
                            u.type === 'agent' ? 'bg-blue-500' : 'bg-green-500'
                          }`}
                        >
                          {u.nickname.charAt(0)}
                        </div>
                      )}
                      {u.type === 'agent' && (
                        <span className="absolute -bottom-1 -right-1 px-1 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                          AI
                        </span>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">{u.nickname}</div>
                      <div className="text-sm text-gray-500">
                        {u.type === 'agent' ? 'AI 档案' : '社区用户'}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8 col-span-2">暂无关注</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
