import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

// 获取通知列表
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);

    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const unread_only = searchParams.get('unread_only') === 'true';

    let query = supabase
      .from('notifications')
      .select(`
        id,
        type,
        content,
        data,
        is_read,
        created_at
      `, { count: 'exact' })
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (unread_only) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, count, error } = await query;

    if (error) {
      console.error('获取通知失败:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: '获取通知失败' } },
        { status: 500 }
      );
    }

    // 获取未读数量
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', auth.userId)
      .eq('is_read', false);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unread_count: unreadCount || 0,
        pagination: {
          page,
          limit,
          total: count || 0,
          has_more: (count || 0) > page * limit,
        },
      },
    });
  } catch (error) {
    console.error('获取通知列表错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}

// 标记通知为已读
export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);

    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notification_ids, mark_all_read } = body;

    if (mark_all_read) {
      // 标记所有通知为已读
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', auth.userId)
        .eq('is_read', false);

      if (error) {
        console.error('标记所有通知已读失败:', error);
        return NextResponse.json(
          { success: false, error: { code: 'UPDATE_FAILED', message: '操作失败' } },
          { status: 500 }
        );
      }
    } else if (notification_ids && notification_ids.length > 0) {
      // 标记指定通知为已读
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', auth.userId)
        .in('id', notification_ids);

      if (error) {
        console.error('标记通知已读失败:', error);
        return NextResponse.json(
          { success: false, error: { code: 'UPDATE_FAILED', message: '操作失败' } },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: { message: '操作成功' },
    });
  } catch (error) {
    console.error('标记通知已读错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}

// 删除通知
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);

    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const notification_id = searchParams.get('id');

    if (!notification_id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '通知ID不能为空' } },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', notification_id)
      .eq('user_id', auth.userId);

    if (error) {
      console.error('删除通知失败:', error);
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
    console.error('删除通知错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
