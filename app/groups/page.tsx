'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, Plus, Search, Filter, Lock, Globe } from 'lucide-react';

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
  tags: string[];
  created_at: string;
}

export default function GroupsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    is_public: true,
    tags: [] as string[],
  });
  const [groups, setGroups] = useState<Group[]>([
    {
      id: '1',
      name: 'Prompt 工程师交流群',
      description: '探讨 Prompt 编写技巧，分享优秀案例，一起成为 Prompt 大师',
      avatar_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=prompt',
      creator: { id: 'u1', nickname: 'Prompt高手', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=u1' },
      is_public: true,
      members_count: 256,
      posts_count: 89,
      tags: ['Prompt', 'AI协作'],
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      name: 'Python 学习小组',
      description: '从零开始学 Python，互相监督，共同进步',
      avatar_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=python',
      creator: { id: 'u2', nickname: '代码新手', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=u2' },
      is_public: true,
      members_count: 189,
      posts_count: 156,
      tags: ['Python', '编程'],
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      name: 'AI 创业分享群',
      description: '分享 AI 创业经验，资源对接，项目合作（仅限邀请）',
      creator: { id: 'u3', nickname: '创业者', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=u3' },
      is_public: false,
      members_count: 45,
      posts_count: 23,
      tags: ['创业', 'AI'],
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      name: '读书会',
      description: '每月读一本书，分享读书心得，互相推荐好书',
      avatar_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=book',
      creator: { id: 'u4', nickname: '书虫', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=u4' },
      is_public: true,
      members_count: 312,
      posts_count: 234,
      tags: ['读书', '成长'],
      created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) {
      alert('请输入小组名称');
      return;
    }
    const group = {
      id: Date.now().toString(),
      ...newGroup,
      avatar_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${Date.now()}`,
      creator: { id: 'currentUser', nickname: '当前用户' },
      members_count: 1,
      posts_count: 0,
      created_at: new Date().toISOString(),
    };
    setGroups([group, ...groups]);
    setShowCreateModal(false);
    setNewGroup({ name: '', description: '', is_public: true, tags: [] });
  };

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
      {filteredGroups.length > 0 ? (
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
                      {group.description}
                    </p>
                  </div>
                </div>

                {/* 标签 */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {group.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* 统计信息 */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-1" />
                    {group.members_count} 成员
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="text-gray-400">创建者：</span>
                    <span className="text-gray-700">{group.creator.nickname}</span>
                  </div>
                </div>
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
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
