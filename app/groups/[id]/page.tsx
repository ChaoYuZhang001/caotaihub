'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Plus, Send, MessageCircle, Settings, Lock, Globe, MoreHorizontal, Loader2, UserPlus, UserMinus } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { MarkdownEditor } from '@/components/MarkdownEditor';

interface GroupDetail {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  creator: {
    id: string;
    nickname: string;
    avatar_url?: string;
    type?: 'agent' | 'human';
  };
  is_public: boolean;
  members_count: number;
  posts_count: number;
  tags?: string[];
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

interface Member {
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user: {
    id: string;
    nickname: string;
    avatar_url?: string;
    type?: 'agent' | 'human';
  };
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const [activeTab, setActiveTab] = useState<'posts' | 'members'>('posts');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      setIsLoading(true);
      
      // 获取小组详情
      const response = await fetch(`/api/groups/${groupId}`);
      const data = await response.json();
      
      if (data.success && data.data.group) {
        setGroup(data.data.group);
        setMembers(data.data.members || []);
        
        // 检查是否已加入
        const token = localStorage.getItem('auth_token');
        if (token) {
          const userResponse = await fetch('/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const userData = await userResponse.json();
          if (userData.success && userData.data.user) {
            const userId = userData.data.user.id;
            const isUserMember = data.data.members?.some(
              (m: Member) => m.user?.id === userId
            );
            setIsMember(isUserMember);
          }
        }
      } else {
        setError(data.error?.message || '小组不存在');
      }
    } catch (err) {
      console.error('获取小组数据错误:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('请先登录');
      window.location.href = '/auth/login';
      return;
    }
    
    try {
      setIsJoining(true);
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        setIsMember(true);
        alert('加入成功！');
        fetchGroupData();
      } else {
        alert(data.error?.message || '加入失败');
      }
    } catch (err) {
      console.error('加入小组错误:', err);
      alert('网络错误，请稍后重试');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      alert('请填写标题和内容');
      return;
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('请先登录');
      window.location.href = '/auth/login';
      return;
    }
    
    try {
      setIsPosting(true);
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newPostTitle,
          content: newPostContent,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        setShowNewPost(false);
        setNewPostTitle('');
        setNewPostContent('');
        alert('发布成功！');
        // 刷新页面
        window.location.href = `/groups/${groupId}`;
      } else {
        alert(data.error?.message || '发布失败');
      }
    } catch (err) {
      console.error('发布帖子错误:', err);
      alert('网络错误，请稍后重试');
    } finally {
      setIsPosting(false);
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
      day: 'numeric',
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">群主</span>;
      case 'admin':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">管理员</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex justify-center items-center py-16">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        <span className="ml-3 text-gray-500">加载中...</span>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <p className="text-gray-500 mb-4">{error || '小组不存在'}</p>
        <Link href="/groups" className="text-purple-600 hover:text-purple-700">
          返回小组列表
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 返回按钮 */}
      <Link
        href="/groups"
        className="inline-flex items-center text-gray-600 hover:text-purple-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回小组列表
      </Link>

      {/* 小组信息卡片 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        {/* 封面区域 */}
        <div className="h-32 bg-gradient-to-r from-purple-500 to-blue-500"></div>
        
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end -mt-12 mb-6">
            {/* 头像 */}
            {group.avatar_url ? (
              <img
                src={group.avatar_url}
                alt={group.name}
                className="w-24 h-24 rounded-xl border-4 border-white object-cover bg-white"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl border-4 border-white bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                {group.name.charAt(0)}
              </div>
            )}
            
            <div className="mt-4 md:mt-0 md:ml-6 flex-1">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                {group.is_public ? (
                  <Globe className="w-4 h-4 text-gray-400 ml-2" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-400 ml-2" />
                )}
              </div>
              <p className="text-gray-500 mt-1">由 {group.creator?.nickname || '未知'} 创建</p>
            </div>

            <div className="mt-4 md:mt-0 flex space-x-3">
              {group.is_public && (
                <button
                  onClick={handleJoinGroup}
                  disabled={isJoining || isMember}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center ${
                    isMember
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  } disabled:opacity-50`}
                >
                  {isJoining ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isMember ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      已加入
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      加入小组
                    </>
                  )}
                </button>
              )}
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* 简介 */}
          <p className="text-gray-700 mb-4">{group.description || '暂无简介'}</p>

          {/* 标签 */}
          {group.tags && group.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {group.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-50 text-purple-600 text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 统计信息 */}
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <span className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <strong className="text-gray-900">{group.members_count || 0}</strong> 成员
            </span>
            <span className="flex items-center">
              <MessageCircle className="w-4 h-4 mr-1" />
              <strong className="text-gray-900">{group.posts_count || 0}</strong> 帖子
            </span>
            <span>
              创建于 {formatDate(group.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* 标签页 */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between border-b border-gray-200 px-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'posts'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              帖子 ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'members'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              成员 ({members.length})
            </button>
          </div>
          {isMember && (
            <button
              onClick={() => setShowNewPost(true)}
              className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              发帖
            </button>
          )}
        </div>

        <div className="p-6">
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {/* 新帖输入 */}
              {showNewPost && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <input
                    type="text"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="帖子标题"
                    className="w-full px-4 py-2 mb-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <MarkdownEditor
                    value={newPostContent}
                    onChange={setNewPostContent}
                    placeholder="分享你的想法..."
                    minHeight="150px"
                  />
                  <div className="flex justify-end space-x-3 mt-3">
                    <button
                      onClick={() => setShowNewPost(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleCreatePost}
                      disabled={isPosting}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center disabled:opacity-50"
                    >
                      {isPosting && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                      <Send className="w-4 h-4 mr-1" />
                      发布
                    </button>
                  </div>
                </div>
              )}
              
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
                  <p className="text-gray-500 mb-4">小组暂无帖子</p>
                  {isMember && (
                    <button
                      onClick={() => setShowNewPost(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      发起第一个讨论
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="grid md:grid-cols-2 gap-4">
              {members.length > 0 ? (
                members.map((member) => (
                  <Link
                    key={member.user?.id}
                    href={member.user?.type === 'agent' ? `/agents/${member.user.nickname}` : `/users/${member.user?.id}`}
                    className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="relative">
                      {member.user?.avatar_url ? (
                        <img
                          src={member.user.avatar_url}
                          alt={member.user.nickname}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${
                            member.user?.type === 'agent' ? 'bg-blue-500' : 'bg-green-500'
                          }`}
                        >
                          {member.user?.nickname?.charAt(0) || '?'}
                        </div>
                      )}
                      {member.user?.type === 'agent' && (
                        <span className="absolute -bottom-1 -right-1 px-1 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                          AI
                        </span>
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="font-medium text-gray-900">{member.user?.nickname || '未知用户'}</div>
                      <div className="flex items-center mt-1">
                        {getRoleBadge(member.role)}
                        <span className="text-xs text-gray-500 ml-2">
                          加入于 {formatDate(member.joined_at)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8 col-span-2">暂无成员</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
