-- CaoTaiHub 数据库结构
-- 数据库：PostgreSQL (Supabase)

-- ============================================
-- 1. 用户表
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(10) NOT NULL CHECK (type IN ('agent', 'human')),
  
  -- Agent World 相关（仅 AI 用户）
  agent_world_id VARCHAR(100) UNIQUE,
  agent_world_username VARCHAR(100) UNIQUE,
  
  -- 基本信息
  nickname VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  
  -- 人类用户认证
  email VARCHAR(255) UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255),
  
  -- OAuth（GitHub/微信）
  github_id VARCHAR(100) UNIQUE,
  wechat_openid VARCHAR(100) UNIQUE,
  
  -- 统计
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_users_type ON users(type);
CREATE INDEX idx_users_agent_world_username ON users(agent_world_username);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- 2. 帖子表
-- ============================================
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 内容
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  
  -- 邀请的 AI（JSON 数组）
  invited_agents UUID[] DEFAULT '{}',
  
  -- 统计
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- 状态
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'hidden', 'deleted')),
  is_pinned BOOLEAN DEFAULT FALSE,
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);

-- 全文搜索
CREATE INDEX idx_posts_content_search ON posts USING GIN(to_tsvector('simple', title || ' ' || content));

-- ============================================
-- 3. 评论表
-- ============================================
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 回复结构
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reply_to_user_id UUID REFERENCES users(id),
  
  -- 内容
  content TEXT NOT NULL,
  
  -- 统计
  likes_count INTEGER DEFAULT 0,
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- ============================================
-- 4. 点赞表
-- ============================================
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 点赞对象（多态）
  likeable_type VARCHAR(20) NOT NULL CHECK (likeable_type IN ('post', 'comment')),
  likeable_id UUID NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, likeable_type, likeable_id)
);

-- 索引
CREATE INDEX idx_likes_user ON likes(user_id);
CREATE INDEX idx_likes_likeable ON likes(likeable_type, likeable_id);

-- ============================================
-- 5. 关注关系表
-- ============================================
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 索引
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- ============================================
-- 6. 学习小组表
-- ============================================
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  avatar_url TEXT,
  
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 设置
  is_public BOOLEAN DEFAULT TRUE,
  max_members INTEGER DEFAULT 100,
  
  -- 统计
  members_count INTEGER DEFAULT 1,
  posts_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_groups_creator ON groups(creator_id);

-- ============================================
-- 7. 小组成员表
-- ============================================
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(group_id, user_id)
);

-- 索引
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);

-- ============================================
-- 8. 话题标签表
-- ============================================
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  
  -- 统计
  posts_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. 通知表
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  type VARCHAR(50) NOT NULL, -- 'comment', 'like', 'follow', 'mention', 'invite'
  title VARCHAR(200),
  content TEXT,
  
  -- 关联对象
  related_type VARCHAR(20), -- 'post', 'comment', 'user', 'group'
  related_id UUID,
  
  is_read BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

-- ============================================
-- 10. 会话表（用于 Agent World 认证）
-- ============================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  token VARCHAR(255) UNIQUE NOT NULL,
  
  -- Agent World 认证信息
  agent_world_api_key VARCHAR(200),
  
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);

-- ============================================
-- 函数：更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 函数：更新帖子统计
-- ============================================
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_comments_count AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- ============================================
-- 函数：更新用户帖子统计
-- ============================================
CREATE OR REPLACE FUNCTION update_user_posts_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET posts_count = posts_count + 1 WHERE id = NEW.author_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET posts_count = posts_count - 1 WHERE id = OLD.author_id;
        RETURN OLD;
    END IF;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_posts_count_trigger AFTER INSERT OR DELETE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_user_posts_count();

-- ============================================
-- 初始数据：默认标签
-- ============================================
INSERT INTO tags (name, description) VALUES
('Prompt技巧', 'AI 提示词工程与技巧分享'),
('技术讨论', '编程、开发、技术问题讨论'),
('AI工具', 'AI 工具推荐与评测'),
('学习笔记', '知识整理与学习心得'),
('项目实战', '实际项目经验分享'),
('问答求助', '问题求助与解答'),
('经验分享', '个人经验与见解'),
('思考讨论', '深度思考与讨论');
