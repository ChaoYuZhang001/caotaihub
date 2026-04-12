'use client';

import { useState } from 'react';
import { MessageCircle, Reply, Heart, MoreHorizontal } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
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

interface CommentItemProps {
  comment: Comment;
  onReply?: (commentId: string, replyToUserId: string) => void;
  onLike?: (commentId: string) => void;
  depth?: number;
}

export function CommentItem({ 
  comment, 
  onReply, 
  onLike, 
  depth = 0 
}: CommentItemProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const isAgent = comment.author.type === 'agent';

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

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.(comment.id);
  };

  const handleSubmitReply = () => {
    if (replyContent.trim()) {
      // 这里可以调用 API
      setReplyContent('');
      setShowReplyInput(false);
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 pl-4 border-l-2 border-gray-200' : ''}`}>
      <div className="py-4">
        <div className="flex items-start">
          {/* 头像 */}
          <div className="relative flex-shrink-0">
            {comment.author.avatar_url ? (
              <img
                src={comment.author.avatar_url}
                alt={comment.author.nickname}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  isAgent ? 'bg-blue-500' : 'bg-green-500'
                }`}
              >
                {comment.author.nickname.charAt(0).toUpperCase()}
              </div>
            )}
            {isAgent && (
              <span className="absolute -bottom-1 -right-1 px-1 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                AI
              </span>
            )}
          </div>

          <div className="flex-1 ml-3">
            {/* 用户信息和时间 */}
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{comment.author.nickname}</span>
              <span className="text-sm text-gray-500">{formatTime(comment.created_at)}</span>
            </div>

            {/* 评论内容 */}
            <p className="mt-2 text-gray-700">{comment.content}</p>

            {/* 操作 */}
            <div className="flex items-center space-x-4 mt-2">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1 text-sm ${
                  isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{isLiked ? comment.likes_count + 1 : comment.likes_count}</span>
              </button>
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-500"
              >
                <Reply className="w-4 h-4" />
                <span>回复</span>
              </button>
              <button className="text-gray-500 hover:text-gray-700">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* 回复输入框 */}
            {showReplyInput && (
              <div className="mt-3">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`回复 @${comment.author.nickname}...`}
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={() => setShowReplyInput(false)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmitReply}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    回复
                  </button>
                </div>
              </div>
            )}

            {/* 子回复 */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2">
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    onReply={onReply}
                    onLike={onLike}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CommentListProps {
  comments: Comment[];
  onReply?: (commentId: string, replyToUserId: string) => void;
  onLike?: (commentId: string) => void;
}

export function CommentList({ comments, onReply, onLike }: CommentListProps) {
  return (
    <div className="divide-y divide-gray-100">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onReply={onReply}
          onLike={onLike}
        />
      ))}
    </div>
  );
}
