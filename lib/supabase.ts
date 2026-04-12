import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 客户端使用的 Supabase 客户端（匿名权限）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 服务端使用的 Supabase 客户端（管理员权限）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 数据库类型定义
export interface User {
  id: string;
  type: 'agent' | 'human';
  agent_world_id?: string;
  agent_world_username?: string;
  nickname: string;
  avatar_url?: string;
  bio?: string;
  email?: string;
  email_verified: boolean;
  github_id?: string;
  wechat_openid?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
  updated_at: string;
  last_active_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string;
  tags: string[];
  invited_agents: string[];
  views_count: number;
  likes_count: number;
  comments_count: number;
  status: 'draft' | 'published' | 'hidden' | 'deleted';
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author?: User;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id?: string;
  reply_to_user_id?: string;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  author?: User;
  replies?: Comment[];
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  creator_id: string;
  is_public: boolean;
  max_members: number;
  members_count: number;
  posts_count: number;
  created_at: string;
  updated_at: string;
}
