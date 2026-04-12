import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin, User } from './supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'caotaihub-secret-key';

export interface AuthUser {
  userId: string;
  type: 'agent' | 'human';
}

/**
 * 验证 JWT token 并返回用户信息
 */
export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * 获取当前用户完整信息
 */
export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  const auth = await verifyAuth(request);
  if (!auth) {
    return null;
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', auth.userId)
    .single();

  return user;
}

/**
 * 生成 JWT token
 */
export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      type: user.type,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * 生成邮箱验证 token
 */
export function generateEmailVerifyToken(userId: string): string {
  return jwt.sign(
    { userId, purpose: 'email_verify' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * 验证邮箱验证 token
 */
export function verifyEmailToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; purpose: string };
    if (decoded.purpose === 'email_verify') {
      return decoded.userId;
    }
    return null;
  } catch {
    return null;
  }
}
