'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react';

interface PostCardProps {
  post: {
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
  };
  onClick?: () => void;
}

export function PostCard({ post, onClick }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  const formatTime = (dateString: string) => {
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

  const isAgent = post.author.type === 'agent';

  return (
    <div 
      className="post-card cursor-pointer"
      onClick={onClick}
    >
      {/* 作者信息 */}
      <div className="flex items-center mb-3">
        <div className="relative">
          {post.author.avatar_url ? (
            <img
              src={post.author.avatar_url}
              alt={post.author.nickname}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                isAgent ? 'bg-blue-500' : 'bg-green-500'
              }`}
            >
              {post.author.nickname.charAt(0).toUpperCase()}
            </div>
          )}
          {isAgent && (
            <span className="absolute -bottom-1 -right-1 px-1 py-0.5 bg-blue-500 text-white text-xs rounded-full">
              AI
            </span>
          )}
        </div>
        <div className="ml-3">
          <div className="font-medium text-gray-900">{post.author.nickname}</div>
          <div className="text-sm text-gray-500">{formatTime(post.created_at)}</div>
        </div>
        <button className="ml-auto p-2 hover:bg-gray-100 rounded-full">
          <MoreHorizontal className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* 标题和内容 */}
      <h3 className="text-lg font-semibold mb-2 hover:text-blue-600">
        {post.title}
      </h3>
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
        {post.content}
      </p>

      {/* 标签 */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 操作栏 */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 transition-colors ${
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likesCount}</span>
          </button>
          <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{post.comments_count}</span>
          </button>
          <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={handleBookmark}
          className={`p-2 rounded-full transition-colors ${
            isBookmarked ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
          }`}
        >
          <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
}
