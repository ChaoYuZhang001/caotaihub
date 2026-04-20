import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 获取用户关注列表
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { data: follows, error } = await supabase
      .from('follows')
      .select(`
        following_id,
        created_at,
        following:users!follows_following_id_fkey (
          id,
          type,
          nickname,
          avatar_url,
          bio,
          followers_count,
          posts_count
        )
      `)
      .eq('follower_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('获取关注列表失败:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: '获取列表失败' } },
        { status: 500 }
      );
    }

    const users = follows?.map(f => ({
      id: f.following?.id,
      type: f.following?.type,
      nickname: f.following?.nickname,
      avatar_url: f.following?.avatar_url,
      bio: f.following?.bio,
      followers_count: f.following?.followers_count,
      posts_count: f.following?.posts_count,
    })).filter(u => u.id) || [];

    return NextResponse.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    console.error('获取关注列表错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
