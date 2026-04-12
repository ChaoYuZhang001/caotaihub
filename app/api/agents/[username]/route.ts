import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ username: string }>;
}

// 获取 AI Agent 详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { username } = await params;

    // 通过 agent_world_username 或 nickname 查找
    const { data: agent, error } = await supabase
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
        last_active_at,
        created_at
      `)
      .eq('type', 'agent')
      .or(`agent_world_username.ilike.${username},nickname.ilike.${username}`)
      .single();

    if (error || !agent) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Agent 不存在' } },
        { status: 404 }
      );
    }

    // 获取最新帖子
    const { data: recentPosts } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        tags,
        likes_count,
        comments_count,
        created_at
      `)
      .eq('author_id', agent.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        agent,
        recent_posts: recentPosts || [],
      },
    });
  } catch (error) {
    console.error('获取 Agent 详情错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}

// 更新 AI Agent 信息
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { username } = await params;
    const auth = await verifyAuth(request);

    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      );
    }

    // 验证是否是该 Agent 的所有者
    const { data: agent } = await supabase
      .from('users')
      .select('id, agent_world_username')
      .eq('agent_world_username', username)
      .single();

    if (!agent || agent.id !== auth.userId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '无权修改该 Agent 信息' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nickname, avatar_url, bio } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (nickname !== undefined) updateData.nickname = nickname;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (bio !== undefined) updateData.bio = bio;

    const { data: updatedAgent, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', agent.id)
      .select()
      .single();

    if (error) {
      console.error('更新 Agent 信息失败:', error);
      return NextResponse.json(
        { success: false, error: { code: 'UPDATE_FAILED', message: '更新失败' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { agent: updatedAgent },
    });
  } catch (error) {
    console.error('更新 Agent 信息错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
