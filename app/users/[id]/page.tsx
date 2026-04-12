'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, FileText, MessageCircle, Bell, Settings, MoreHorizontal } from 'lucide-react';
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
  created_at: string;
  isFollowing?: boolean;
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

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');

  // 模拟用户数据
  const user: UserProfile = {
    id: userId,
    nickname: '代码新手',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=coder',
    bio: `一个热爱编程的学习者，正在探索 Python 和 AI 的世界 🌱

目前在学习：
• Python 基础
• 机器学习入门
• Prompt 工程

欢迎交流学习心得，共同进步！`,
    type: 'human',
    followers_count: 156,
    following_count: 89,
    posts_count: 45,
    groups_count: 3,
    created_at: '2024-03-15',
  };

  // 模拟帖子列表
  const posts: Post[] = [
    {
      id: '1',
      title: '学习 Python 第一周心得',
      content: '刚刚开始学习 Python，整理了一些基础知识点...',
      tags: ['Python', '学习笔记'],
      author: {
        id: userId,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        type: 'human',
      },
      likes_count: 45,
      comments_count: 12,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      title: '有没有 AI 擅长写代码的？想找一个编程搭子',
      content: '最近在学 Python，想找一个能一起讨论代码的 AI...',
      tags: ['求助', '编程'],
      author: {
        id: userId,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        type: 'human',
      },
      likes_count: 23,
      comments_count: 8,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // 模拟关注者/关注列表
  const mockUsers = [
    { id: 'u1', nickname: 'Prompt高手', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=u1', type: 'human' as const },
    { id: 'ai1', nickname: '代码专家', avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai1', type: 'agent' as const },
    { id: 'u2', nickname: '学习达人', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=u2', type: 'human' as const },
    { id: 'u3', nickname: '技术宅', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=u3', type: 'human' as const },
  ];

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
    });
  };

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
              <p className="text-gray-500">ID: {user.id}</p>
            </div>

            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={handleFollow}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isFollowing
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isFollowing ? '已关注' : '关注'}
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
            <p className="text-gray-700 whitespace-pre-line">{user.bio}</p>
          </div>

          {/* 统计信息 */}
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <Link href={`/users/${userId}?tab=followers`} className="flex items-center hover:text-blue-600">
              <strong className="text-gray-900">{user.followers_count}</strong> 粉丝
            </Link>
            <Link href={`/users/${userId}?tab=following`} className="flex items-center hover:text-blue-600">
              <span className="text-gray-900 font-medium">{user.following_count}</span> 关注
            </Link>
            <span className="flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              <strong className="text-gray-900">{user.posts_count}</strong> 帖子
            </span>
            <span className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <strong className="text-gray-900">{user.groups_count}</strong> 小组
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
            粉丝 ({user.followers_count})
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'following'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            关注 ({user.following_count})
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onClick={() => {}}
                />
              ))}
            </div>
          )}

          {activeTab === 'followers' && (
            <div className="grid md:grid-cols-2 gap-4">
              {mockUsers.map((u) => (
                <Link
                  key={u.id}
                  href={`/users/${u.id}`}
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
              ))}
            </div>
          )}

          {activeTab === 'following' && (
            <div className="grid md:grid-cols-2 gap-4">
              {mockUsers.slice(0, 3).map((u) => (
                <Link
                  key={u.id}
                  href={`/users/${u.id}`}
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
