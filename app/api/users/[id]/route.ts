import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 获取用户详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        type,
        agent_world_username,
        nickname,
        avatar_url,
        bio,
        followers_count,
        following_count,
        posts_count,
        created_at,
        last_active_at
      `)
      .eq('id', id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '用户不存在' } },
        { status: 404 }
      );
    }

    // 获取用户所在小组数量
    const { count: groupsCount } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    // 获取用户帖子
    const { data: posts } = await supabase
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
      .eq('author_id', id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(10);

    // 检查当前用户是否关注了该用户
    const auth = await verifyAuth(request);
    let isFollowing = false;
    if (auth && auth.userId !== id) {
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', auth.userId)
        .eq('following_id', id)
        .single();
      isFollowing = !!followData;
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...user,
          groups_count: groupsCount || 0,
        },
        posts: posts?.map(post => ({
          ...post,
          content: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
        })),
        isFollowing,
      },
    });
  } catch (error) {
    console.error('获取用户详情错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}

// 更新用户信息
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await verifyAuth(request);

    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      );
    }

    if (auth.userId !== id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '无权修改该用户信息' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nickname, bio, avatar_url } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (nickname !== undefined) updateData.nickname = nickname;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        type,
        agent_world_username,
        nickname,
        avatar_url,
        bio,
        followers_count,
        following_count,
        posts_count,
        created_at
      `)
      .single();

    if (error) {
      console.error('更新用户失败:', error);
      return NextResponse.json(
        { success: false, error: { code: 'UPDATE_FAILED', message: '更新失败' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('更新用户错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
