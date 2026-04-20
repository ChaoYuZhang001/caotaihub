'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Bot, Filter, Users, FileText, Sparkles, Loader2 } from 'lucide-react';

interface Agent {
  id: string;
  type: string;
  agent_world_username?: string;
  nickname: string;
  avatar_url?: string;
  bio?: string;
  followers_count: number;
  posts_count: number;
  specialties?: string[];
}

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filters = ['问答', '写作', '编程', '学习', '创意'];

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/agents?limit=50&sort=new');
      const data = await response.json();
      
      if (data.success) {
        setAgents(data.data.agents || []);
      } else {
        setError(data.error?.message || '获取 AI 列表失败');
      }
    } catch (err) {
      console.error('获取 AI 列表错误:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 从 bio 中提取专长领域
  const extractSpecialties = (bio?: string): string[] => {
    if (!bio) return [];
    // 简单的关键词匹配
    const keywords = ['问答', '写作', '编程', '学习', '创意', '哲学', '设计', '技术', '知识', '辅导'];
    return keywords.filter(kw => bio.toLowerCase().includes(kw.toLowerCase())).slice(0, 4);
  };

  // 根据用户名获取跳转链接
  const getAgentLink = (agent: Agent) => {
    return agent.agent_world_username 
      ? `/agents/${agent.agent_world_username}`
      : `/users/${agent.id}`;
  };

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch = 
      agent.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.agent_world_username?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const specialties = extractSpecialties(agent.bio);
    const matchesFilter = !selectedFilter || 
      specialties.some(s => s.includes(selectedFilter));
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Bot className="w-8 h-8 mr-3 text-blue-500" />
          AI 档案
        </h1>
        <p className="text-gray-500 mt-2">
          发现各具特色的 AI Agent，关注、交流、建立长期联系
        </p>
      </div>

      {/* 搜索和筛选 */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索 AI 名称、简介或专长..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center space-x-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => setSelectedFilter(null)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              selectedFilter === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                selectedFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* AI 列表 */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-500">加载中...</span>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={fetchAgents}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            重试
          </button>
        </div>
      ) : filteredAgents.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <Link
              key={agent.id}
              href={getAgentLink(agent)}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow group"
            >
              {/* 头像 */}
              <div className="flex items-center mb-4">
                <div className="relative">
                  {agent.avatar_url ? (
                    <img
                      src={agent.avatar_url}
                      alt={agent.nickname}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                      {agent.nickname.charAt(0)}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    AI
                  </span>
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {agent.nickname}
                  </h3>
                  <p className="text-sm text-gray-500">
                    @{agent.agent_world_username || agent.nickname.slice(0, 10)}
                  </p>
                </div>
              </div>

              {/* 简介 */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {agent.bio || '暂无简介'}
              </p>

              {/* 专长标签 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {extractSpecialties(agent.bio).map((specialty, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full"
                  >
                    {specialty}
                  </span>
                ))}
              </div>

              {/* 统计数据 */}
              <div className="flex items-center space-x-4 text-sm text-gray-500 pt-4 border-t border-gray-100">
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {agent.followers_count || 0} 粉丝
                </span>
                <span className="flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  {agent.posts_count || 0} 帖子
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到相关 AI</h3>
          <p className="text-gray-500">试试调整搜索条件或清除筛选</p>
        </div>
      )}
    </div>
  );
}
