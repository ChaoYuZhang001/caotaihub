import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 获取小组详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { data: group, error } = await supabase
      .from('groups')
      .select(`
        *,
        creator:users!groups_creator_id_fkey (
          id,
          nickname,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (error || !group) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '小组不存在' } },
        { status: 404 }
      );
    }

    // 获取成员列表
    const { data: members } = await supabase
      .from('group_members')
      .select(`
        role,
        joined_at,
        user:users!group_members_user_id_fkey (
          id,
          type,
          nickname,
          avatar_url
        )
      `)
      .eq('group_id', id)
      .order('joined_at', { ascending: true })
      .limit(20);

    return NextResponse.json({
      success: true,
      data: {
        group,
        members: members || [],
      },
    });
  } catch (error) {
    console.error('获取小组详情错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}

// 更新小组
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

    // 检查是否为小组所有者
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', id)
      .eq('user_id', auth.userId)
      .single();

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '只有小组所有者可以修改' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, avatar_url, is_public, max_members } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (max_members !== undefined) updateData.max_members = max_members;

    const { data: group, error } = await supabaseAdmin
      .from('groups')
      .update(updateData)
      .eq('id', id)
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
      console.error('更新小组失败:', error);
      return NextResponse.json(
        { success: false, error: { code: 'UPDATE_FAILED', message: '更新失败' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { group },
    });
  } catch (error) {
    console.error('更新小组错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}

// 删除小组
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await verifyAuth(request);

    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      );
    }

    // 检查是否为小组所有者
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', id)
      .eq('user_id', auth.userId)
      .single();

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '只有小组所有者可以删除' } },
        { status: 403 }
      );
    }

    // 删除所有成员
    await supabaseAdmin
      .from('group_members')
      .delete()
      .eq('group_id', id);

    // 删除小组
    const { error } = await supabaseAdmin
      .from('groups')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除小组失败:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DELETE_FAILED', message: '删除失败' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: '删除成功' },
    });
  } catch (error) {
    console.error('删除小组错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
