import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateToken } from '@/lib/auth';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// GitHub OAuth 回调处理
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_CODE', message: '缺少 GitHub 授权码' } },
        { status: 400 }
      );
    }

    // 用 code 换取 access_token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error('GitHub OAuth 错误:', tokenData);
      return NextResponse.json(
        { success: false, error: { code: 'OAUTH_FAILED', message: 'GitHub 授权失败' } },
        { status: 400 }
      );
    }

    const accessToken = tokenData.access_token;

    // 获取 GitHub 用户信息
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const githubUser = await userResponse.json();

    if (!githubUser.id) {
      return NextResponse.json(
        { success: false, error: { code: 'GET_USER_FAILED', message: '获取 GitHub 用户信息失败' } },
        { status: 400 }
      );
    }

    // 查找或创建用户
    let { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('github_id', githubUser.id.toString())
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      // 用户不存在，检查是否通过邮箱关联
      if (githubUser.email) {
        const { data: emailUser } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', githubUser.email)
          .single();

        if (emailUser) {
          // 关联 GitHub 账号
          const { data: updatedUser, error: updateError } = await supabaseAdmin
            .from('users')
            .update({
              github_id: githubUser.id.toString(),
              avatar_url: githubUser.avatar_url || emailUser.avatar_url,
              email_verified: true,
              last_active_at: new Date().toISOString(),
            })
            .eq('id', emailUser.id)
            .select()
            .single();

          if (updateError) {
            console.error('关联 GitHub 失败:', updateError);
            return NextResponse.json(
              { success: false, error: { code: 'LINK_FAILED', message: 'GitHub 账号关联失败' } },
              { status: 500 }
            );
          }

          user = updatedUser;
        }
      }

      // 如果仍然没有用户，创建新用户
      if (!user) {
        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            type: 'human',
            github_id: githubUser.id.toString(),
            email: githubUser.email || null,
            nickname: githubUser.name || githubUser.login,
            avatar_url: githubUser.avatar_url,
            bio: githubUser.bio || '',
            email_verified: !!githubUser.email,
          })
          .select()
          .single();

        if (createError) {
          console.error('创建用户失败:', createError);
          return NextResponse.json(
            { success: false, error: { code: 'CREATE_FAILED', message: '创建用户失败' } },
            { status: 500 }
          );
        }

        user = newUser;
      }
    } else if (fetchError) {
      console.error('查询用户失败:', fetchError);
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: '数据库错误' } },
        { status: 500 }
      );
    } else {
      // 用户已存在，更新信息
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          nickname: githubUser.name || githubUser.login || user.nickname,
          avatar_url: githubUser.avatar_url || user.avatar_url,
          bio: githubUser.bio || user.bio,
          email_verified: githubUser.email ? true : user.email_verified,
          last_active_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (!updateError) {
        user = updatedUser;
      }
    }

    // 生成 JWT token
    const token = generateToken(user);

    // 重定向到前端并携带 token
    const redirectUrl = new URL(`${SITE_URL}/auth/callback`);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('type', 'github');

    if (state) {
      redirectUrl.searchParams.set('state', state);
    }

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('GitHub OAuth 回调错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}

// 获取 GitHub OAuth 授权链接
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const state = body.state || crypto.randomUUID();

    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID || '',
      redirect_uri: `${SITE_URL}/api/auth/github`,
      scope: 'user:email',
      state,
    });

    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

    return NextResponse.json({
      success: true,
      data: {
        auth_url: authUrl,
        state,
      },
    });
  } catch (error) {
    console.error('生成 GitHub 授权链接错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
