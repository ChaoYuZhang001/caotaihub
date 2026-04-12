import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 加入/退出小组
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: groupId } = await params;
    const auth = await verifyAuth(request);

    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      );
    }

    // 检查小组是否存在
    const { data: group } = await supabase
      .from('groups')
      .select('id, name, is_public, max_members, members_count')
      .eq('id', groupId)
      .single();

    if (!group) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '小组不存在' } },
        { status: 404 }
      );
    }

    // 不能加入私有小组
    if (!group.is_public) {
      return NextResponse.json(
        { success: false, error: { code: 'GROUP_PRIVATE', message: '不能加入私有小组' } },
        { status: 403 }
      );
    }

    // 检查是否已经加入
    const { data: existingMembership } = await supabase
      .from('group_members')
      .select('id, role')
      .eq('group_id', groupId)
      .eq('user_id', auth.userId)
      .single();

    let joined: boolean;

    if (existingMembership) {
      // 退出小组
      // 所有者不能退出，只能删除小组
      if (existingMembership.role === 'owner') {
        return NextResponse.json(
          { success: false, error: { code: 'CANNOT_LEAVE_OWN', message: '所有者不能退出小组，请先转让所有权或删除小组' } },
          { status: 400 }
        );
      }

      await supabaseAdmin
        .from('group_members')
        .delete()
        .eq('id', existingMembership.id);

      // 减少成员数
      await supabaseAdmin
        .from('groups')
        .update({ members_count: group.members_count - 1 })
        .eq('id', groupId);

      joined = false;
    } else {
      // 检查是否达到人数上限
      if (group.members_count >= group.max_members) {
        return NextResponse.json(
          { success: false, error: { code: 'GROUP_FULL', message: '小组已满员' } },
          { status: 400 }
        );
      }

      // 加入小组
      await supabaseAdmin
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: auth.userId,
          role: 'member',
        });

      // 增加成员数
      await supabaseAdmin
        .from('groups')
        .update({ members_count: group.members_count + 1 })
        .eq('id', groupId);

      joined = true;
    }

    // 获取更新后的成员数
    const { data: updatedGroup } = await supabaseAdmin
      .from('groups')
      .select('members_count')
      .eq('id', groupId)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        joined,
        members_count: updatedGroup?.members_count || 0,
      },
    });
  } catch (error) {
    console.error('加入/退出小组错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}

// 获取加入状态
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: groupId } = await params;
    const auth = await verifyAuth(request);

    // 获取成员数
    const { data: group } = await supabaseAdmin
      .from('groups')
      .select('members_count')
      .eq('id', groupId)
      .single();

    let joined = false;
    let role: string | null = null;

    if (auth) {
      const { data: membership } = await supabaseAdmin
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', auth.userId)
        .single();

      if (membership) {
        joined = true;
        role = membership.role;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        joined,
        role,
        members_count: group?.members_count || 0,
      },
    });
  } catch (error) {
    console.error('获取加入状态错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
