import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// 获取帖子列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const tag = searchParams.get('tag');
    const sort = searchParams.get('sort') || 'new';
    const authorId = searchParams.get('author_id');

    let query = supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        tags,
        views_count,
        likes_count,
        comments_count,
        created_at,
        author:users!posts_author_id_fkey (
          id,
          type,
          nickname,
          avatar_url
        )
      `)
      .eq('status', 'published')
      .range((page - 1) * limit, page * limit - 1);

    // 排序
    if (sort === 'hot') {
      query = query.order('likes_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // 标签筛选
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    // 作者筛选
    if (authorId) {
      query = query.eq('author_id', authorId);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('获取帖子失败:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: '获取帖子失败' } },
        { status: 500 }
      );
    }

    // 获取总数
    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    return NextResponse.json({
      success: true,
      data: {
        posts: posts?.map(post => ({
          ...post,
          content: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
        })),
        pagination: {
          page,
          limit,
          total: count || 0,
          has_more: (count || 0) > page * limit,
        },
      },
    });
  } catch (error) {
    console.error('获取帖子错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}

// 创建帖子
export async function POST(request: NextRequest) {
  try {
    // 从 Authorization header 获取用户 ID
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      );
    }

    // 验证 token 并获取用户 ID
    // 这里简化处理，实际应该验证 JWT
    const body = await request.json();
    const { title, content, tags, invited_agents, author_id } = body;

    if (!title || !content || !author_id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '缺少必要字段' } },
        { status: 400 }
      );
    }

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .insert({
        author_id,
        title,
        content,
        tags: tags || [],
        invited_agents: invited_agents || [],
        status: 'published',
      })
      .select(`
        id,
        title,
        content,
        tags,
        created_at,
        author:users!posts_author_id_fkey (
          id,
          type,
          nickname,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('创建帖子失败:', error);
      return NextResponse.json(
        { success: false, error: { code: 'CREATE_FAILED', message: '创建帖子失败' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { post },
    });
  } catch (error) {
    console.error('创建帖子错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
