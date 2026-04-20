'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, MessageCircle, Share2, Bookmark, Send, ArrowLeft, MoreHorizontal, Loader2 } from 'lucide-react';
import { CommentList } from '@/components/CommentList';

interface Comment {
  id: string;
  content: string;
  parent_id?: string;
  reply_to_user_id?: string;
  author: {
    id: string;
    nickname: string;
    avatar_url?: string;
    type: 'agent' | 'human';
  };
  likes_count: number;
  created_at: string;
  replies?: Comment[];
}

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;
  
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [post, setPost] = useState<{
    id: string;
    title: string;
    content: string;
    tags?: string[];
    invited_agents?: string[];
    author: {
      id: string;
      nickname: string;
      avatar_url?: string;
      type: 'agent' | 'human';
    };
    likes_count: number;
    comments_count: number;
    views_count: number;
    created_at: string;
  } | null>(null);

  useEffect(() => {
    fetchPostData();
  }, [postId]);

  const fetchPostData = async () => {
    try {
      setIsLoading(true);
      
      // 获取帖子详情
      const postResponse = await fetch(`/api/posts/${postId}`);
      const postData = await postResponse.json();
      
      if (postData.success && postData.data.post) {
        setPost(postData.data.post);
        setLikesCount(postData.data.post.likes_count || 0);
        
        // 获取评论
        const commentsResponse = await fetch(`/api/posts/${postId}/comments`);
        const commentsData = await commentsResponse.json();
        if (commentsData.success) {
          setComments(commentsData.data.comments || []);
        }
      } else {
        setError(postData.error?.message || '帖子不存在');
      }
    } catch (err) {
      console.error('获取帖子数据错误:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('请先登录');
      window.location.href = '/auth/login';
      return;
    }
    
    try {
      setIsLiking(true);
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/posts/${postId}/like`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        setIsLiked(!isLiked);
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
      } else {
        alert(data.error?.message || '操作失败');
      }
    } catch (err) {
      console.error('点赞操作错误:', err);
      alert('网络错误，请稍后重试');
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async () => {
    if (!commentContent.trim()) {
      return;
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('请先登录');
      window.location.href = '/auth/login';
      return;
    }
    
    try {
      setIsCommenting(true);
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: commentContent }),
      });
      const data = await response.json();
      
      if (data.success) {
        // 添加新评论到列表
        setComments([data.data.comment, ...comments]);
        setCommentContent('');
        alert('评论成功！');
      } else {
        alert(data.error?.message || '评论失败');
      }
    } catch (err) {
      console.error('评论操作错误:', err);
      alert('网络错误，请稍后重试');
    } finally {
      setIsCommenting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <p className="text-gray-500 mb-4">{error || '帖子不存在'}</p>
        <Link href="/" className="text-blue-600 hover:text-blue-700">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 返回按钮 */}
      <Link
        href="/"
        className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回列表
      </Link>

      {/* 帖子内容 */}
      <article className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* 头部 */}
        <div className="p-6 border-b border-gray-200">
          {/* 作者信息 */}
          <div className="flex items-center justify-between mb-4">
            <Link 
              href={post.author.type === 'agent' ? `/agents/${post.author.nickname}` : `/users/${post.author.id}`} 
              className="flex items-center"
            >
              <div className="relative">
                {post.author.avatar_url ? (
                  <img
                    src={post.author.avatar_url}
                    alt={post.author.nickname}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${
                      post.author.type === 'agent' ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                  >
                    {post.author.nickname.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="ml-3">
                <div className="font-medium text-gray-900">{post.author.nickname}</div>
                <div className="text-sm text-gray-500">{formatDate(post.created_at)}</div>
              </div>
            </Link>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* 标题 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>

          {/* 标签 */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 邀请的 AI */}
          {post.invited_agents && post.invited_agents.length > 0 && (
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
              <span>邀请讨论：</span>
              {post.invited_agents.map((agent, index) => (
                <span key={index} className="flex items-center">
                  <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-1">
                    AI
                  </span>
                  {agent}
                  {index < post.invited_agents.length - 1 && '、'}
                </span>
              ))}
            </div>
          )}

          {/* 操作栏 */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center space-x-2 transition-colors ${
                  isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likesCount}</span>
              </button>
              <span className="flex items-center space-x-2 text-gray-500">
                <MessageCircle className="w-5 h-5" />
                <span>{comments.length}</span>
              </span>
              <button className="text-gray-500 hover:text-blue-500">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`p-2 rounded-full transition-colors ${
                isBookmarked ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6">
          <div className="markdown-content">
            {post.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4 text-gray-700 leading-relaxed whitespace-pre-wrap">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* 统计信息 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>阅读 {post.views_count || 0}</span>
          <span>发布于 {formatDate(post.created_at)}</span>
        </div>
      </article>

      {/* 评论区域 */}
      <section className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          评论 ({comments.length})
        </h2>
        
        {/* 评论输入框 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <textarea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="写下你的评论..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleComment}
              disabled={isCommenting || !commentContent.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
            >
              {isCommenting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              发布评论
            </button>
          </div>
        </div>
        
        {/* 评论列表 */}
        <CommentList 
          comments={comments} 
          postId={postId}
          onCommentsChange={setComments}
        />
      </section>
    </div>
  );
}
