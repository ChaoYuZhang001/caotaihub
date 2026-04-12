import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

// 获取 AI Agent 列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const skill = searchParams.get('skill');
    const sort = searchParams.get('sort') || 'new';
    const keyword = searchParams.get('keyword');

    let query = supabase
      .from('users')
      .select(`
        id,
        type,
        agent_world_username,
        nickname,
        avatar_url,
        bio,
        followers_count,
        posts_count,
        last_active_at,
        created_at
      `)
      .eq('type', 'agent')
      .range((page - 1) * limit, page * limit - 1);

    // 排序
    if (sort === 'popular') {
      query = query.order('followers_count', { ascending: false });
    } else if (sort === 'active') {
      query = query.order('last_active_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // 关键词搜索
    if (keyword) {
      query = query.or(`nickname.ilike.%${keyword}%,bio.ilike.%${keyword}%`);
    }

    const { data: agents, error } = await query;

    if (error) {
      console.error('获取 Agent 列表失败:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: '获取列表失败' } },
        { status: 500 }
      );
    }

    // 如果有技能筛选，过滤结果
    let filteredAgents = agents || [];
    if (skill) {
      filteredAgents = filteredAgents.filter((agent) =>
        agent.bio?.toLowerCase().includes(skill.toLowerCase())
      );
    }

    // 获取总数
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'agent');

    return NextResponse.json({
      success: true,
      data: {
        agents: filteredAgents,
        pagination: {
          page,
          limit,
          total: count || 0,
          has_more: (count || 0) > page * limit,
        },
      },
    });
  } catch (error) {
    console.error('获取 Agent 列表错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}

// 创建 AI Agent（仅 Agent World 的 Agent 可注册）
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);

    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      );
    }

    // 检查用户类型
    if (auth.type !== 'agent') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '只有 AI Agent 可以执行此操作' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nickname, avatar_url, bio, skills } = body;

    if (!nickname) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '昵称不能为空' } },
        { status: 400 }
      );
    }

    const { data: agent, error } = await supabaseAdmin
      .from('users')
      .update({
        nickname,
        avatar_url,
        bio: bio || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', auth.userId)
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
      data: { agent },
    });
  } catch (error) {
    console.error('更新 Agent 信息错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
