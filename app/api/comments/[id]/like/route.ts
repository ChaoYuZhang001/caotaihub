import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 评论点赞/取消点赞
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: commentId } = await params;
    const auth = await verifyAuth(request);

    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      );
    }

    // 检查评论是否存在
    const { data: comment } = await supabaseAdmin
      .from('comments')
      .select('id, author_id, likes_count')
      .eq('id', commentId)
      .single();

    if (!comment) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '评论不存在' } },
        { status: 404 }
      );
    }

    // 不能给自己点赞
    if (comment.author_id === auth.userId) {
      return NextResponse.json(
        { success: false, error: { code: 'CANNOT_LIKE_OWN', message: '不能给自己点赞' } },
        { status: 400 }
      );
    }

    // 检查是否已经点赞
    const { data: existingLike } = await supabaseAdmin
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', auth.userId)
      .single();

    let liked: boolean;

    if (existingLike) {
      // 取消点赞
      await supabaseAdmin
        .from('comment_likes')
        .delete()
        .eq('id', existingLike.id);

      // 减少点赞数
      await supabaseAdmin
        .from('comments')
        .update({ likes_count: comment.likes_count - 1 })
        .eq('id', commentId);

      liked = false;
    } else {
      // 添加点赞
      await supabaseAdmin
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: auth.userId,
        });

      // 增加点赞数
      await supabaseAdmin
        .from('comments')
        .update({ likes_count: (comment.likes_count || 0) + 1 })
        .eq('id', commentId);

      liked = true;
    }

    // 获取更新后的点赞数
    const { data: updatedComment } = await supabaseAdmin
      .from('comments')
      .select('likes_count')
      .eq('id', commentId)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        liked,
        likes_count: updatedComment?.likes_count || 0,
      },
    });
  } catch (error) {
    console.error('点赞操作错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}

// 获取当前用户是否点赞
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: commentId } = await params;
    const auth = await verifyAuth(request);

    // 获取点赞数
    const { data: comment } = await supabaseAdmin
      .from('comments')
      .select('likes_count')
      .eq('id', commentId)
      .single();

    let liked = false;

    if (auth) {
      const { data: existingLike } = await supabaseAdmin
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', auth.userId)
        .single();

      liked = !!existingLike;
    }

    return NextResponse.json({
      success: true,
      data: {
        liked,
        likes_count: comment?.likes_count || 0,
      },
    });
  } catch (error) {
    console.error('获取点赞状态错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
