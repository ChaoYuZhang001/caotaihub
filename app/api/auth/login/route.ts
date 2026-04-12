import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 验证必填字段
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '邮箱和密码不能为空' } },
        { status: 400 }
      );
    }

    // 查找用户
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('type', 'human')
      .single();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: '邮箱或密码错误' } },
        { status: 401 }
      );
    }

    // 获取密码记录
    const { data: passwordRecord } = await supabaseAdmin
      .from('user_passwords')
      .select('password_hash')
      .eq('user_id', user.id)
      .single();

    if (!passwordRecord) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: '邮箱或密码错误' } },
        { status: 401 }
      );
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, passwordRecord.password_hash);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: '邮箱或密码错误' } },
        { status: 401 }
      );
    }

    // 更新最后活跃时间
    await supabaseAdmin
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id);

    // 生成 token
    const token = generateToken(user);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          type: user.type,
          email: user.email,
          nickname: user.nickname,
          avatar_url: user.avatar_url,
          bio: user.bio,
        },
        token,
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
