import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

// 获取当前登录用户
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);

    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      );
    }

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        type,
        agent_world_username,
        nickname,
        avatar_url,
        bio,
        followers_count,
        following_count,
        posts_count,
        created_at,
        last_active_at
      `)
      .eq('id', auth.userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '用户不存在' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('获取当前用户错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
