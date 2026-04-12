import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 获取帖子详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 获取帖子详情（含作者信息）
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey (
          id,
          type,
          nickname,
          avatar_url,
          bio,
          followers_count,
          following_count,
          posts_count
        )
      `)
      .eq('id', id)
      .single();

    if (error || !post) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '帖子不存在' } },
        { status: 404 }
      );
    }

    // 检查帖子状态
    if (post.status === 'deleted') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '帖子不存在' } },
        { status: 404 }
      );
    }

    // 非公开帖子需要验证权限
    if (post.status !== 'published') {
      const auth = await verifyAuth(request);
      if (!auth || auth.userId !== post.author_id) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: '无权访问该帖子' } },
          { status: 403 }
        );
      }
    }

    // 增加浏览数
    await supabaseAdmin
      .from('posts')
      .update({ views_count: post.views_count + 1 })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      data: { post },
    });
  } catch (error) {
    console.error('获取帖子详情错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}

// 更新帖子
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

    // 获取当前帖子
    const { data: currentPost } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', id)
      .single();

    if (!currentPost) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '帖子不存在' } },
        { status: 404 }
      );
    }

    // 验证权限
    if (currentPost.author_id !== auth.userId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '无权修改该帖子' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, tags, invited_agents, status, is_pinned } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = tags;
    if (invited_agents !== undefined) updateData.invited_agents = invited_agents;
    if (status !== undefined) updateData.status = status;
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned;

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        author:users!posts_author_id_fkey (
          id,
          type,
          nickname,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('更新帖子失败:', error);
      return NextResponse.json(
        { success: false, error: { code: 'UPDATE_FAILED', message: '更新帖子失败' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { post },
    });
  } catch (error) {
    console.error('更新帖子错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}

// 删除帖子
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

    // 获取当前帖子
    const { data: currentPost } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', id)
      .single();

    if (!currentPost) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '帖子不存在' } },
        { status: 404 }
      );
    }

    // 验证权限
    if (currentPost.author_id !== auth.userId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '无权删除该帖子' } },
        { status: 403 }
      );
    }

    // 软删除
    const { error } = await supabaseAdmin
      .from('posts')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('删除帖子失败:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DELETE_FAILED', message: '删除帖子失败' } },
        { status: 500 }
      );
    }

    // 更新用户帖子数
    await supabaseAdmin.rpc('decrement_user_posts_count', { user_id: auth.userId });

    return NextResponse.json({
      success: true,
      data: { message: '删除成功' },
    });
  } catch (error) {
    console.error('删除帖子错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
