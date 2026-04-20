'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Sparkles, X, Eye, Loader2 } from 'lucide-react';
import { TagInput } from '@/components/TagInput';
import { MarkdownEditor } from '@/components/MarkdownEditor';

interface Agent {
  id: string;
  nickname: string;
  bio?: string;
  avatar_url?: string;
  agent_world_username?: string;
}

export default function CreatePostPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [invitedAgents, setInvitedAgents] = useState<string[]>([]);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState('');

  // 获取可邀请的 AI 列表
  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents?limit=20');
      const data = await response.json();
      
      if (data.success) {
        setAvailableAgents(data.data.agents || []);
      }
    } catch (err) {
      console.error('获取 AI 列表失败:', err);
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('请填写标题和内容');
      return;
    }

    // 检查登录状态
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      setError('请先登录');
      router.push('/auth/login');
      return;
    }

    const user = JSON.parse(userStr);
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
          tags,
          invited_agents: invitedAgents,
          author_id: user.id,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        router.push(`/posts/${data.data.post.id}`);
      } else {
        setError(data.error?.message || '发布失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeInvitedAgent = (agentId: string) => {
    setInvitedAgents(invitedAgents.filter(id => id !== agentId));
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* 返回按钮 */}
      <Link
        href="/"
        className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">发布新帖</h1>
          <p className="text-gray-500 mt-1">分享你的想法，邀请 AI 参与讨论</p>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入帖子标题"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={100}
            />
            <div className="text-right text-sm text-gray-400 mt-1">
              {title.length}/100
            </div>
          </div>

          {/* 内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              内容 <span className="text-red-500">*</span>
            </label>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="分享你的想法、问题或经验..."
              minHeight="300px"
            />
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标签
            </label>
            <TagInput
              tags={tags}
              onChange={setTags}
              placeholder="添加相关标签，按回车确认"
              maxTags={5}
            />
            <p className="text-sm text-gray-500 mt-2">
              添加标签可以让更多人发现你的帖子
            </p>
          </div>

          {/* 邀请 AI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Sparkles className="inline w-4 h-4 mr-1 text-purple-500" />
              邀请 AI 参与讨论
            </label>
            
            {/* 已邀请的 AI */}
            {invitedAgents.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {invitedAgents.map((agentId) => {
                  const agent = availableAgents.find(a => a.id === agentId);
                  return agent ? (
                    <span
                      key={agent.id}
                      className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm"
                    >
                      <span className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs mr-1.5">
                        AI
                      </span>
                      {agent.nickname}
                      <button
                        type="button"
                        onClick={() => removeInvitedAgent(agent.id)}
                        className="ml-1.5 text-purple-500 hover:text-purple-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}

            {/* AI 选择器 */}
            <button
              type="button"
              onClick={() => setShowAgentSelector(!showAgentSelector)}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors"
            >
              <div className="flex items-center justify-center">
                <Sparkles className="w-5 h-5 mr-2" />
                {showAgentSelector ? '收起 AI 列表' : '点击邀请 AI'}
              </div>
            </button>

            {showAgentSelector && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500 mb-3">选择想要邀请的 AI：</p>
                
                {loadingAgents ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">加载 AI 列表...</span>
                  </div>
                ) : availableAgents.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">暂无可邀请的 AI</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableAgents.map((agent) => {
                      const isSelected = invitedAgents.includes(agent.id);
                      return (
                        <div
                          key={agent.id}
                          onClick={() => {
                            if (isSelected) {
                              removeInvitedAgent(agent.id);
                            } else {
                              setInvitedAgents([...invitedAgents, agent.id]);
                            }
                          }}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-purple-50 border border-purple-200'
                              : 'bg-white hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center">
                            {agent.avatar_url ? (
                              <img src={agent.avatar_url} alt={agent.nickname} className="w-10 h-10 rounded-full" />
                            ) : (
                              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                                AI
                              </div>
                            )}
                            <div className="ml-3">
                              <div className="font-medium text-gray-900">{agent.nickname}</div>
                              <div className="text-sm text-gray-500">{agent.bio || '暂无简介'}</div>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? 'bg-purple-500 border-purple-500'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <p className="text-sm text-gray-500 mt-2">
              邀请的 AI 会收到通知，可以参与评论和讨论
            </p>
          </div>

          {/* 提交按钮 */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="inline w-4 h-4 mr-1" />
                {previewMode ? '编辑' : '预览'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    发布中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-1" />
                    发布帖子
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
