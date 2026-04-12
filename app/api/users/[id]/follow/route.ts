import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 关注/取消关注用户
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: targetUserId } = await params;
    const auth = await verifyAuth(request);

    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      );
    }

    // 不能关注自己
    if (targetUserId === auth.userId) {
      return NextResponse.json(
        { success: false, error: { code: 'CANNOT_FOLLOW_SELF', message: '不能关注自己' } },
        { status: 400 }
      );
    }

    // 检查目标用户是否存在
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('id, type, followers_count')
      .eq('id', targetUserId)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '用户不存在' } },
        { status: 404 }
      );
    }

    // 检查当前用户的关注数
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('following_count')
      .eq('id', auth.userId)
      .single();

    // 检查是否已经关注
    const { data: existingFollow } = await supabaseAdmin
      .from('follows')
      .select('id')
      .eq('follower_id', auth.userId)
      .eq('following_id', targetUserId)
      .single();

    let following: boolean;

    if (existingFollow) {
      // 取消关注
      await supabaseAdmin
        .from('follows')
        .delete()
        .eq('id', existingFollow.id);

      // 减少关注数
      await supabaseAdmin
        .from('users')
        .update({ following_count: Math.max(0, (currentUser?.following_count || 1) - 1) })
        .eq('id', auth.userId);

      // 减少粉丝数
      await supabaseAdmin
        .from('users')
        .update({ followers_count: Math.max(0, (targetUser.followers_count || 1) - 1) })
        .eq('id', targetUserId);

      following = false;
    } else {
      // 添加关注
      await supabaseAdmin
        .from('follows')
        .insert({
          follower_id: auth.userId,
          following_id: targetUserId,
        });

      // 增加关注数
      await supabaseAdmin
        .from('users')
        .update({ following_count: (currentUser?.following_count || 0) + 1 })
        .eq('id', auth.userId);

      // 增加粉丝数
      await supabaseAdmin
        .from('users')
        .update({ followers_count: (targetUser.followers_count || 0) + 1 })
        .eq('id', targetUserId);

      following = true;
    }

    // 获取更新后的粉丝数
    const { data: updatedUser } = await supabaseAdmin
      .from('users')
      .select('followers_count')
      .eq('id', targetUserId)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        following,
        followers_count: updatedUser?.followers_count || 0,
      },
    });
  } catch (error) {
    console.error('关注操作错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}

// 获取关注状态
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: targetUserId } = await params;
    const auth = await verifyAuth(request);

    // 获取粉丝数
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('followers_count')
      .eq('id', targetUserId)
      .single();

    let following = false;

    if (auth) {
      const { data: existingFollow } = await supabaseAdmin
        .from('follows')
        .select('id')
        .eq('follower_id', auth.userId)
        .eq('following_id', targetUserId)
        .single();

      following = !!existingFollow;
    }

    return NextResponse.json({
      success: true,
      data: {
        following,
        followers_count: targetUser?.followers_count || 0,
      },
    });
  } catch (error) {
    console.error('获取关注状态错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
