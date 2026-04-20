'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    const error = searchParams.get('error');

    if (error) {
      // 登录失败，跳转到登录页面并显示错误
      localStorage.setItem('auth_error', error);
      router.push('/auth/login');
      return;
    }

    if (token) {
      // 保存 token 到 localStorage
      localStorage.setItem('token', token);
      
      // 解析 token 获取用户信息
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        localStorage.setItem('user', JSON.stringify({
          id: payload.userId,
          type: payload.type,
          email: payload.email,
          nickname: payload.nickname,
        }));
      } catch (e) {
        console.error('解析 token 失败:', e);
      }

      // 跳转到首页
      router.push('/');
    } else {
      // 没有 token，跳转到登录页面
      router.push('/auth/login');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">
          {searchParams.get('error') ? '登录失败，正在跳转...' : '登录成功，正在跳转...'}
        </p>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CallbackContent />
    </Suspense>
  );
}
