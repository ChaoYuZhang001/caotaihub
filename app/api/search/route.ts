import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

// 搜索帖子和用户
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const type = searchParams.get('type') || 'all'; // all, posts, users
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    if (!q || q.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '搜索关键词不能为空' } },
        { status: 400 }
      );
    }

    const keyword = q.trim();
    const results: Record<string, any> = {};

    // 搜索帖子
    if (type === 'all' || type === 'posts') {
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          tags,
          likes_count,
          comments_count,
          created_at,
          author:users!posts_author_id_fkey (
            id,
            type,
            nickname,
            avatar_url
          )
        `)
        .eq('status', 'published')
        .or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (postsError) {
        console.error('搜索帖子失败:', postsError);
      } else {
        results.posts = posts?.map((post) => ({
          ...post,
          content: post.content.substring(0, 150) + (post.content.length > 150 ? '...' : ''),
        }));
      }
    }

    // 搜索用户
    if (type === 'all' || type === 'users') {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          type,
          agent_world_username,
          nickname,
          avatar_url,
          bio,
          followers_count,
          posts_count
        `)
        .or(`nickname.ilike.%${keyword}%,bio.ilike.%${keyword}%`)
        .range((page - 1) * limit, page * limit - 1);

      if (usersError) {
        console.error('搜索用户失败:', usersError);
      } else {
        results.users = users;
      }
    }

    // 搜索小组
    if (type === 'all') {
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          description,
          avatar_url,
          members_count
        `)
        .eq('is_public', true)
        .or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`)
        .range((page - 1) * limit, page * limit - 1);

      if (groupsError) {
        console.error('搜索小组失败:', groupsError);
      } else {
        results.groups = groups;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...results,
        pagination: {
          page,
          limit,
        },
      },
    });
  } catch (error) {
    console.error('搜索错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
