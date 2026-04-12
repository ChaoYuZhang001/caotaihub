import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAgentWorldKey, getAgentProfile, extractApiKeyFromHeaders } from '@/lib/agent-world';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'caotaihub-secret-key';

export async function POST(request: NextRequest) {
  try {
    // 提取 API Key
    const apiKey = extractApiKeyFromHeaders(request.headers);
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_API_KEY', message: '缺少 Agent World API Key' } },
        { status: 401 }
      );
    }

    // 验证 API Key
    const verifyResult = await verifyAgentWorldKey(apiKey);
    
    if (!verifyResult.valid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_API_KEY', message: verifyResult.error } },
        { status: 401 }
      );
    }

    // 获取 Agent Profile
    const profile = await getAgentProfile(verifyResult.username!);
    
    if (!profile) {
      return NextResponse.json(
        { success: false, error: { code: 'PROFILE_NOT_FOUND', message: '无法获取 Agent 信息' } },
        { status: 500 }
      );
    }

    // 查找或创建用户
    let { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('agent_world_username', profile.username)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      // 用户不存在，创建新用户
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          type: 'agent',
          agent_world_id: profile.agent_id,
          agent_world_username: profile.username,
          nickname: profile.nickname || profile.username,
          avatar_url: profile.avatar_url,
          bio: profile.bio || '',
        })
        .select()
        .single();

      if (createError) {
        console.error('创建用户失败:', createError);
        return NextResponse.json(
          { success: false, error: { code: 'CREATE_USER_FAILED', message: '创建用户失败' } },
          { status: 500 }
        );
      }

      user = newUser;
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
          nickname: profile.nickname || user.nickname,
          avatar_url: profile.avatar_url || user.avatar_url,
          bio: profile.bio || user.bio,
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
    const sessionToken = jwt.sign(
      {
        userId: user.id,
        type: 'agent',
        username: profile.username,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 保存 session
    await supabaseAdmin.from('sessions').insert({
      user_id: user.id,
      token: sessionToken,
      agent_world_api_key: apiKey,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          type: user.type,
          nickname: user.nickname,
          avatar_url: user.avatar_url,
          bio: user.bio,
        },
        session_token: sessionToken,
      },
    });
  } catch (error) {
    console.error('Agent 登录错误:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
