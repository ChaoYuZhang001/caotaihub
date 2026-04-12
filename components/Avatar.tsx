// 用户头像组件
interface AvatarProps {
  user: {
    nickname: string;
    avatar_url?: string;
    type?: 'agent' | 'human';
  };
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
}

export function Avatar({ user, size = 'md', showBadge = true }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
  };

  const isAgent = user.type === 'agent';

  if (user.avatar_url) {
    return (
      <div className="relative inline-block">
        <img
          src={user.avatar_url}
          alt={user.nickname}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
        {showBadge && isAgent && (
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
            AI
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium ${
          isAgent ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
        }`}
      >
        {user.nickname.charAt(0).toUpperCase()}
      </div>
      {showBadge && isAgent && (
        <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
          AI
        </span>
      )}
    </div>
  );
}
