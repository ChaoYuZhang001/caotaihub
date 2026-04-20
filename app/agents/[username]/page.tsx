'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, FileText, MessageCircle, Bell, MoreHorizontal, Sparkles, Loader2, UserPlus, UserMinus } from 'lucide-react';
import { PostCard } from '@/components/PostCard';

interface AgentProfile {
  id: string;
  type: string;
  agent_world_username?: string;
  nickname: string;
  avatar_url?: string;
  bio?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  specialties?: string[];
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

export default function AgentDetailPage() {
  const params = useParams();
  const username = params.username as string;
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState<UserItem[]>([]);
  const [following, setFollowing] = useState<UserItem[]>([]);

  useEffect(() => {
    fetchAgentData();
  }, [username]);

  const fetchAgentData = async () => {
    try {
      setIsLoading(true);
      // 通过 username 查找 Agent
      const response = await fetch(`/api/agents/${encodeURIComponent(username)}`);
      const data = await response.json();
      
      if (data.success && data.data.agent) {
        setAgent(data.data.agent);
        
        // 获取该 Agent 的帖子
        const postsResponse = await fetch(`/api/posts?author_id=${data.data.agent.id}&limit=10`);
        const postsData = await postsResponse.json();
        if (postsData.success) {
          setPosts(postsData.data.posts || []);
        }
        
        // 获取粉丝和关注列表
        await Promise.all([
          fetchFollowers(data.data.agent.id),
          fetchFollowing(data.data.agent.id),
        ]);
      } else {
        setError(data.error?.message || 'AI 不存在');
      }
    } catch (err) {
      console.error('获取 AI 数据错误:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowers = async (userId: string) => {
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

  const fetchFollowing = async (userId: string) => {
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
    if (!agent) return;
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('请先登录');
      window.location.href = '/auth/login';
      return;
    }
    
    try {
      setIsFollowingLoading(true);
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/${agent.id}/follow`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        setIsFollowing(!isFollowing);
        setAgent(prev => prev ? {
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

  // 从 bio 提取专长
  const extractSpecialties = (bio?: string): string[] => {
    if (!bio) return [];
    const keywords = ['问答', '写作', '编程', '学习', '创意', '哲学', '设计', '技术', '知识', '辅导', '思考'];
    return keywords.filter(kw => bio.toLowerCase().includes(kw.toLowerCase())).slice(0, 5);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex justify-center items-center py-16">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-500">加载中...</span>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <p className="text-gray-500 mb-4">{error || 'AI 不存在'}</p>
        <Link href="/agents" className="text-blue-600 hover:text-blue-700">
          返回 AI 档案
        </Link>
      </div>
    );
  }

  const specialties = extractSpecialties(agent.bio);

  return (
    <div className="max-w-4xl mx-auto">
      {/* 返回按钮 */}
      <Link
        href="/agents"
        className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回 AI 档案
      </Link>

      {/* 个人信息卡片 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        {/* 封面区域 */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        
        <div className="px-6 pb-6">
          {/* 头像和基本信息 */}
          <div className="flex flex-col md:flex-row md:items-end -mt-12 mb-6">
            <div className="relative">
              {agent.avatar_url ? (
                <img
                  src={agent.avatar_url}
                  alt={agent.nickname}
                  className="w-24 h-24 rounded-full border-4 border-white object-cover bg-white"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white bg-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                  {agent.nickname.charAt(0)}
                </div>
              )}
              <span className="absolute bottom-1 right-1 px-2 py-0.5 bg-blue-500 text-white text-sm rounded-full">
                AI
              </span>
            </div>
            
            <div className="mt-4 md:mt-0 md:ml-6 flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{agent.nickname}</h1>
              <p className="text-gray-500">@{agent.agent_world_username || agent.nickname}</p>
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
            <p className="text-gray-700 whitespace-pre-line">{agent.bio || '暂无简介'}</p>
          </div>

          {/* 专长 */}
          {specialties.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {specialties.map((specialty, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full flex items-center"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {specialty}
                </span>
              ))}
            </div>
          )}

          {/* 统计信息 */}
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <span className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <strong className="text-gray-900">{agent.followers_count || 0}</strong> 粉丝
            </span>
            <span className="flex items-center">
              <span className="text-gray-900 font-medium">{agent.following_count || 0}</span> 关注
            </span>
            <span className="flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              <strong className="text-gray-900">{agent.posts_count || 0}</strong> 帖子
            </span>
            <span>
              加入于 {formatDate(agent.created_at)}
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
            粉丝 ({agent.followers_count || 0})
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'following'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            关注 ({agent.following_count || 0})
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
                <p className="text-center text-gray-500 py-8">暂无帖子</p>
              )}
            </div>
          )}

          {activeTab === 'followers' && (
            <div className="grid md:grid-cols-2 gap-4">
              {followers.length > 0 ? (
                followers.map((user) => (
                  <Link
                    key={user.id}
                    href={user.type === 'agent' ? `/agents/${user.nickname}` : `/users/${user.id}`}
                    className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
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
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">{user.nickname}</div>
                      <div className="text-sm text-gray-500">
                        {user.type === 'agent' ? 'AI 档案' : '社区用户'}
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
                following.map((user) => (
                  <Link
                    key={user.id}
                    href={user.type === 'agent' ? `/agents/${user.nickname}` : `/users/${user.id}`}
                    className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
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
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">{user.nickname}</div>
                      <div className="text-sm text-gray-500">
                        {user.type === 'agent' ? 'AI 档案' : '社区用户'}
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
