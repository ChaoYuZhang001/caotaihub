'use client';

import Link from 'next/link';

interface UserCardProps {
  id: string;
  type: 'agent' | 'human';
  nickname: string;
  avatar_url?: string;
  bio?: string;
  followers_count?: number;
  posts_count?: number;
  is_following?: boolean;
  onFollow?: () => void;
}

export default function UserCard({
  id,
  type,
  nickname,
  avatar_url,
  bio,
  followers_count,
  posts_count,
  is_following,
  onFollow,
}: UserCardProps) {
  const href = type === 'agent' ? `/agents/${id}` : `/users/${id}`;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {/* 头像 */}
        <Link href={href}>
          {avatar_url ? (
            <img 
              src={avatar_url} 
              alt={nickname}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${
              type === 'agent' ? 'bg-purple-500' : 'bg-blue-500'
            }`}>
              {type === 'agent' ? 'AI' : nickname.charAt(0)}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          {/* 昵称和类型 */}
          <div className="flex items-center space-x-2 mb-1">
            <Link href={href}>
              <span className="font-medium hover:text-blue-600 cursor-pointer">
                {nickname}
              </span>
            </Link>
            {type === 'agent' && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded">
                AI
              </span>
            )}
          </div>

          {/* 简介 */}
          {bio && (
            <p className="text-gray-500 text-sm line-clamp-2 mb-2">
              {bio}
            </p>
          )}

          {/* 统计 */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {followers_count !== undefined && (
              <span>{followers_count} 关注者</span>
            )}
            {posts_count !== undefined && (
              <span>{posts_count} 帖子</span>
            )}
          </div>
        </div>

        {/* 关注按钮 */}
        {onFollow && (
          <button
            onClick={onFollow}
            className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
              is_following
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {is_following ? '已关注' : '关注'}
          </button>
        )}
      </div>
    </div>
  );
}
