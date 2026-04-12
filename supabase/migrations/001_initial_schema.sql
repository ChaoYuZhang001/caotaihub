-- ============================================
-- CaoTaiHub 数据库表和函数
-- ============================================

-- 用户密码表（存储加密后的密码）
CREATE TABLE IF NOT EXISTS user_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 帖子点赞表
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 评论点赞表
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 关注表
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 小组表
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  avatar_url TEXT,
  creator_id UUID NOT NULL REFERENCES users(id),
  is_public BOOLEAN DEFAULT true,
  max_members INTEGER DEFAULT 100,
  members_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 小组关系表
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_groups_creator_id ON groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_groups_is_public ON groups(is_public);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_agent_world_username ON users(agent_world_username);

-- ============================================
-- 辅助函数
-- ============================================

-- 增加帖子评论数
CREATE OR REPLACE FUNCTION increment_post_comments_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET comments_count = comments_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 减少帖子评论数
CREATE OR REPLACE FUNCTION decrement_post_comments_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 增加帖子点赞数
CREATE OR REPLACE FUNCTION increment_post_likes_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 减少帖子点赞数
CREATE OR REPLACE FUNCTION decrement_post_likes_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 增加用户帖子数
CREATE OR REPLACE FUNCTION increment_user_posts_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users SET posts_count = posts_count + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 减少用户帖子数
CREATE OR REPLACE FUNCTION decrement_user_posts_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users SET posts_count = GREATEST(0, posts_count - 1) WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Row Level Security (RLS) 策略
-- ============================================

-- 启用 RLS
ALTER TABLE user_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- user_passwords 策略：仅用户本人和管理员可访问
CREATE POLICY "Users can view own password" ON user_passwords
  FOR SELECT USING (auth.uid() = user_id);

-- post_likes 策略：所有人可查看，用户可管理自己的点赞
CREATE POLICY "Anyone can view likes" ON post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes" ON post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- comment_likes 策略：同上
CREATE POLICY "Anyone can view likes" ON comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes" ON comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON comment_likes
  FOR DELETE USING (auth.uid() = user_id);

-- follows 策略：所有人可查看，用户可管理自己的关注
CREATE POLICY "Anyone can view follows" ON follows
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own follows" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- groups 策略：公开小组所有人可查看，小组创建者可管理
CREATE POLICY "Anyone can view public groups" ON groups
  FOR SELECT USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Authenticated users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creator can update groups" ON groups
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Creator can delete groups" ON groups
  FOR DELETE USING (creator_id = auth.uid());

-- group_members 策略：公开小组的所有成员可查看，成员可退出
CREATE POLICY "Members can view group members" ON group_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM groups WHERE id = group_id AND is_public = true)
    OR user_id = auth.uid()
  );

CREATE POLICY "Anyone can join public groups" ON group_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM groups WHERE id = group_id AND is_public = true)
  );

CREATE POLICY "Members can leave groups" ON group_members
  FOR DELETE USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.group_id = group_members.group_id 
    AND gm.user_id = auth.uid() 
    AND gm.role = 'owner'
  ));

-- notifications 策略：用户只能查看自己的通知
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid());
