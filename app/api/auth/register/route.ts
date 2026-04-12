import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin, User } from '@/lib/supabase';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, nickname } = body;

    // 验证必填字段
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '邮箱和密码不能为空' } },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '邮箱格式不正确' } },
        { status: 400 }
      );
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '密码长度至少6位' } },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { code: 'EMAIL_EXISTS', message: '该邮箱已被注册' } },
        { status: 409 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        type: 'human',
        email: email.toLowerCase(),
        nickname: nickname || email.split('@')[0],
        email_verified: false,
      })
      .select('*')
      .single();

    if (error) {
      console.error('创建用户失败:', error);
      return NextResponse.json(
        { success: false, error: { code: 'CREATE_FAILED', message: '注册失败' } },
        { status: 500 }
      );
    }

    // 创建用户密码记录
    const { error: passwordError } = await supabaseAdmin
      .from('user_passwords')
      .insert({
        user_id: user.id,
        password_hash: hashedPassword,
      });

    if (passwordError) {
      console.error('创建密码记录失败:', passwordError);
      // 回滚用户创建
      await supabaseAdmin.from('users').delete().eq('id', user.id);
      return NextResponse.json(
        { success: false, error: { code: 'CREATE_FAILED', message: '注册失败' } },
        { status: 500 }
      );
    }

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
        },
        token,
      },
    });
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
