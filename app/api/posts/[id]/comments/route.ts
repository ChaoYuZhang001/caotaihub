import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 构建嵌套评论结构
function buildCommentTree(comments: any[]): any[] {
  const commentMap = new Map<string, any>();
  const rootComments: any[] = [];

  // 先把所有评论放入 map
  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // 构建树结构
  comments.forEach((comment) => {
    const node = commentMap.get(comment.id);
    if (comment.parent_id && commentMap.has(comment.parent_id)) {
      commentMap.get(comment.parent_id)!.replies.push(node);
    } else {
      rootComments.push(node);
    }
  });

  return rootComments;
}

// 获取评论列表
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId } = await params;

    // 获取顶级评论及其回复
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        likes_count,
        parent_id,
        created_at,
        author:users!comments_author_id_fkey (
          id,
          type,
          nickname,
          avatar_url
        ),
        reply_to_user:users!comments_reply_to_user_id_fkey (
          id,
          nickname
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('获取评论失败:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: '获取评论失败' } },
        { status: 500 }
      );
    }

    // 构建嵌套结构
    const nestedComments = buildCommentTree(comments || []);

    // 获取评论总数
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    return NextResponse.json({
      success: true,
      data: {
        comments: nestedComments,
        total: count || 0,
      },
    });
  } catch (error) {
    console.error('获取评论列表错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}

// 创建评论
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

    const body = await request.json();
    const { content, parent_id, reply_to_user_id } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '评论内容不能为空' } },
        { status: 400 }
      );
    }

    // 检查帖子是否存在
    const { data: post } = await supabase
      .from('posts')
      .select('id, status')
      .eq('id', postId)
      .single();

    if (!post || post.status !== 'published') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '帖子不存在' } },
        { status: 404 }
      );
    }

    // 如果是回复，验证父评论
    if (parent_id) {
      const { data: parentComment } = await supabase
        .from('comments')
        .select('id')
        .eq('id', parent_id)
        .eq('post_id', postId)
        .single();

      if (!parentComment) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_PARENT', message: '父评论不存在' } },
          { status: 400 }
        );
      }
    }

    const { data: comment, error } = await supabaseAdmin
      .from('comments')
      .insert({
        post_id: postId,
        author_id: auth.userId,
        content: content.trim(),
        parent_id: parent_id || null,
        reply_to_user_id: reply_to_user_id || null,
      })
      .select(`
        id,
        content,
        likes_count,
        parent_id,
        created_at,
        author:users!comments_author_id_fkey (
          id,
          type,
          nickname,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('创建评论失败:', error);
      return NextResponse.json(
        { success: false, error: { code: 'CREATE_FAILED', message: '创建评论失败' } },
        { status: 500 }
      );
    }

    // 更新帖子评论数
    await supabaseAdmin.rpc('increment_post_comments_count', { post_id: postId });

    return NextResponse.json({
      success: true,
      data: { comment },
    });
  } catch (error) {
    console.error('创建评论错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
