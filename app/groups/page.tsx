'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Plus, Search, Filter, Lock, Globe, Loader2, UserPlus } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  creator: {
    id: string;
    nickname: string;
    avatar_url?: string;
  };
  is_public: boolean;
  members_count: number;
  posts_count: number;
  tags?: string[];
  created_at: string;
}

export default function GroupsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    is_public: true,
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/groups?limit=50&sort=new');
      const data = await response.json();
      
      if (data.success) {
        setGroups(data.data.groups || []);
      } else {
        setError(data.error?.message || '获取小组列表失败');
      }
    } catch (err) {
      console.error('获取小组列表错误:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      alert('请输入小组名称');
      return;
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('请先登录');
      window.location.href = '/auth/login';
      return;
    }
    
    try {
      setIsCreating(true);
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newGroup),
      });
      const data = await response.json();
      
      if (data.success) {
        // 添加新小组到列表
        setGroups([data.data.group, ...groups]);
        setShowCreateModal(false);
        setNewGroup({ name: '', description: '', is_public: true });
        alert('小组创建成功！');
      } else {
        alert(data.error?.message || '创建失败');
      }
    } catch (err) {
      console.error('创建小组错误:', err);
      alert('网络错误，请稍后重试');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async (groupId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('请先登录');
      window.location.href = '/auth/login';
      return;
    }
    
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        alert('加入成功！');
        fetchGroups(); // 刷新列表
      } else {
        alert(data.error?.message || '加入失败');
      }
    } catch (err) {
      console.error('加入小组错误:', err);
      alert('网络错误，请稍后重试');
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* 页面标题 */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="w-8 h-8 mr-3 text-purple-500" />
            学习小组
          </h1>
          <p className="text-gray-500 mt-2">
            创建或加入学习小组，与 AI 和同伴一起成长
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          创建小组
        </button>
      </div>

      {/* 搜索 */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索小组名称或话题..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 小组列表 */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <span className="ml-3 text-gray-500">加载中...</span>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={fetchGroups}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            重试
          </button>
        </div>
      ) : filteredGroups.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredGroups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
            >
              <div className="p-6">
                <div className="flex items-start">
                  {/* 小组头像 */}
                  {group.avatar_url ? (
                    <img
                      src={group.avatar_url}
                      alt={group.name}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold">
                      {group.name.charAt(0)}
                    </div>
                  )}
                  
                  <div className="ml-4 flex-1">
                    <div className="flex items-center">
                      <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {group.name}
                      </h3>
                      {group.is_public ? (
                        <Globe className="w-4 h-4 text-gray-400 ml-2" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-400 ml-2" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {group.description || '暂无简介'}
                    </p>
                  </div>
                </div>

                {/* 标签 */}
                {group.tags && group.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {group.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 统计信息 */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-1" />
                    {group.members_count || 0} 成员
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="text-gray-400">创建者：</span>
                    <span className="text-gray-700">{group.creator?.nickname || '未知'}</span>
                  </div>
                </div>
                
                {group.is_public && (
                  <div className="mt-3">
                    <button
                      onClick={(e) => handleJoinGroup(group.id, e)}
                      className="w-full px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors flex items-center justify-center"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      加入小组
                    </button>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到相关小组</h3>
          <p className="text-gray-500">成为第一个创建这个主题小组的人！</p>
        </div>
      )}

      {/* 创建小组弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">创建学习小组</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  小组名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="给你的小组起个名字"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  小组简介
                </label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="描述小组的目标和主题"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={3}
                  maxLength={200}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  可见性
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      checked={newGroup.is_public}
                      onChange={() => setNewGroup({ ...newGroup, is_public: true })}
                      className="w-4 h-4 text-purple-600"
                    />
                    <Globe className="w-4 h-4 ml-2 mr-1 text-gray-400" />
                    <span className="text-sm text-gray-700">公开</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      checked={!newGroup.is_public}
                      onChange={() => setNewGroup({ ...newGroup, is_public: false })}
                      className="w-4 h-4 text-purple-600"
                    />
                    <Lock className="w-4 h-4 ml-2 mr-1 text-gray-400" />
                    <span className="text-sm text-gray-700">私密（需邀请）</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={isCreating}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {isCreating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
