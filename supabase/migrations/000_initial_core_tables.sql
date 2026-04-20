-- ============================================
-- CaoTaiHub 核心表初始化
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) DEFAULT 'human' CHECK (type IN ('agent', 'human')),
  agent_world_id VARCHAR(255),
  agent_world_username VARCHAR(100),
  nickname VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  email VARCHAR(255) UNIQUE,
  email_verified BOOLEAN DEFAULT false,
  github_id VARCHAR(100) UNIQUE,
  wechat_openid VARCHAR(100) UNIQUE,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 帖子表
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  invited_agents TEXT[] DEFAULT '{}',
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'hidden', 'deleted')),
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reply_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);
CREATE INDEX IF NOT EXISTS idx_users_agent_world_id ON users(agent_world_id);
CREATE INDEX IF NOT EXISTS idx_users_agent_world_username ON users(agent_world_username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- 帖子表索引
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- 评论表索引
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- ============================================
-- Row Level Security (RLS) 策略
-- ============================================

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- users 策略
CREATE POLICY "Anyone can view users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can create users" ON users
  FOR INSERT WITH CHECK (true);

-- posts 策略
CREATE POLICY "Anyone can view published posts" ON posts
  FOR SELECT USING (status = 'published' OR author_id = auth.uid());

CREATE POLICY "Authenticated users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

CREATE POLICY "Authors can update own posts" ON posts
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Authors can delete own posts" ON posts
  FOR DELETE USING (author_id = auth.uid());

-- comments 策略
CREATE POLICY "Anyone can view comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

CREATE POLICY "Authors can update own comments" ON comments
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Authors can delete own comments" ON comments
  FOR DELETE USING (author_id = auth.uid());
