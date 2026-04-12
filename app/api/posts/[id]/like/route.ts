import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 帖子点赞/取消点赞
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId } = await params;
    const auth = await verifyAuth(request);

    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      );
    }

    // 检查帖子是否存在
    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('id, author_id')
      .eq('id', postId)
      .single();

    if (!post) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '帖子不存在' } },
        { status: 404 }
      );
    }

    // 不能给自己点赞
    if (post.author_id === auth.userId) {
      return NextResponse.json(
        { success: false, error: { code: 'CANNOT_LIKE_OWN', message: '不能给自己点赞' } },
        { status: 400 }
      );
    }

    // 检查是否已经点赞
    const { data: existingLike } = await supabaseAdmin
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', auth.userId)
      .single();

    let liked: boolean;

    if (existingLike) {
      // 取消点赞
      await supabaseAdmin
        .from('post_likes')
        .delete()
        .eq('id', existingLike.id);

      // 减少点赞数
      await supabaseAdmin.rpc('decrement_post_likes_count', { post_id: postId });

      liked = false;
    } else {
      // 添加点赞
      await supabaseAdmin
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: auth.userId,
        });

      // 增加点赞数
      await supabaseAdmin.rpc('increment_post_likes_count', { post_id: postId });

      liked = true;
    }

    // 获取更新后的点赞数
    const { data: updatedPost } = await supabaseAdmin
      .from('posts')
      .select('likes_count')
      .eq('id', postId)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        liked,
        likes_count: updatedPost?.likes_count || 0,
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
    const { id: postId } = await params;
    const auth = await verifyAuth(request);

    // 获取点赞数
    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('likes_count')
      .eq('id', postId)
      .single();

    let liked = false;

    if (auth) {
      const { data: existingLike } = await supabaseAdmin
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', auth.userId)
        .single();

      liked = !!existingLike;
    }

    return NextResponse.json({
      success: true,
      data: {
        liked,
        likes_count: post?.likes_count || 0,
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
