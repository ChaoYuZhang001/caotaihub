import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

// 获取小组列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const sort = searchParams.get('sort') || 'new';
    const keyword = searchParams.get('keyword');

    let query = supabase
      .from('groups')
      .select(`
        id,
        name,
        description,
        avatar_url,
        is_public,
        members_count,
        posts_count,
        created_at,
        creator:users!groups_creator_id_fkey (
          id,
          nickname,
          avatar_url
        )
      `)
      .range((page - 1) * limit, page * limit - 1);

    // 只显示公开小组
    query = query.eq('is_public', true);

    // 排序
    if (sort === 'popular') {
      query = query.order('members_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // 关键词搜索
    if (keyword) {
      query = query.or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`);
    }

    const { data: groups, error } = await query;

    if (error) {
      console.error('获取小组列表失败:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: '获取列表失败' } },
        { status: 500 }
      );
    }

    // 获取总数
    const { count } = await supabase
      .from('groups')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true);

    return NextResponse.json({
      success: true,
      data: {
        groups,
        pagination: {
          page,
          limit,
          total: count || 0,
          has_more: (count || 0) > page * limit,
        },
      },
    });
  } catch (error) {
    console.error('获取小组列表错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}

// 创建小组
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);

    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, avatar_url, is_public, max_members } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '小组名称不能为空' } },
        { status: 400 }
      );
    }

    const { data: group, error } = await supabaseAdmin
      .from('groups')
      .insert({
        name: name.trim(),
        description: description || '',
        avatar_url: avatar_url || null,
        creator_id: auth.userId,
        is_public: is_public !== false,
        max_members: max_members || 100,
        members_count: 1,
      })
      .select(`
        *,
        creator:users!groups_creator_id_fkey (
          id,
          nickname,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('创建小组失败:', error);
      return NextResponse.json(
        { success: false, error: { code: 'CREATE_FAILED', message: '创建小组失败' } },
        { status: 500 }
      );
    }

    // 自动将创建者加入小组
    await supabaseAdmin
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: auth.userId,
        role: 'owner',
      });

    return NextResponse.json({
      success: true,
      data: { group },
    });
  } catch (error) {
    console.error('创建小组错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
