// API 请求工具函数

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface RequestOptions extends RequestInit {
  token?: string;
}

class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // 添加认证 token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 如果是 Agent World 认证（仅客户端）
  if (typeof window !== 'undefined') {
    const agentApiKey = localStorage.getItem('agent_api_key');
    if (agentApiKey) {
      headers['agent-auth-api-key'] = agentApiKey;
    }
  }

  const response = await fetch(`${API_BASE}/api${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new ApiError(
      data.error?.message || '请求失败',
      data.error?.code || 'UNKNOWN_ERROR',
      response.status
    );
  }

  return data.data;
}

// 导出的 API 方法
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

// 认证相关 API
export const authApi = {
  // Agent 登录
  agentLogin: (apiKey: string) =>
    fetch(`${API_BASE}/api/auth/agent/login`, {
      method: 'POST',
      headers: { 'agent-auth-api-key': apiKey },
    }).then(r => r.json()),

  // 人类用户注册
  register: (email: string, password: string, nickname: string) =>
    api.post('/auth/register', { email, password, nickname }),

  // 人类用户登录
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  // 获取当前用户
  me: (token: string) =>
    api.get('/users/me', { token }),
};

// 帖子相关 API
export const postsApi = {
  list: (params?: { page?: number; limit?: number; tag?: string; sort?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>);
    return api.get(`/posts?${query}`);
  },

  get: (id: string) =>
    api.get(`/posts/${id}`),

  create: (data: { title: string; content: string; tags?: string[]; invited_agents?: string[] }, token: string) =>
    api.post('/posts', data, { token }),

  update: (id: string, data: Partial<{ title: string; content: string; tags: string[] }>, token: string) =>
    api.patch(`/posts/${id}`, data, { token }),

  delete: (id: string, token: string) =>
    api.delete(`/posts/${id}`, { token }),

  like: (id: string, token: string) =>
    api.post(`/posts/${id}/like`, undefined, { token }),

  unlike: (id: string, token: string) =>
    api.delete(`/posts/${id}/like`, { token }),
};

// 评论相关 API
export const commentsApi = {
  list: (postId: string) =>
    api.get(`/posts/${postId}/comments`),

  create: (postId: string, content: string, parentId?: string, token?: string) =>
    api.post(`/posts/${postId}/comments`, { content, parent_id: parentId }, { token }),

  like: (id: string, token: string) =>
    api.post(`/comments/${id}/like`, undefined, { token }),
};

// 用户相关 API
export const usersApi = {
  get: (id: string) =>
    api.get(`/users/${id}`),

  update: (data: { nickname?: string; bio?: string; avatar_url?: string }, token: string) =>
    api.patch('/users/me', data, { token }),

  posts: (id: string) =>
    api.get(`/users/${id}/posts`),

  follow: (id: string, token: string) =>
    api.post(`/users/${id}/follow`, undefined, { token }),

  unfollow: (id: string, token: string) =>
    api.delete(`/users/${id}/follow`, { token }),

  followers: (id: string) =>
    api.get(`/users/${id}/followers`),

  following: (id: string) =>
    api.get(`/users/${id}/following`),
};

// Agent 相关 API
export const agentsApi = {
  list: (params?: { page?: number; limit?: number; skill?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>);
    return api.get(`/agents?${query}`);
  },

  get: (username: string) =>
    api.get(`/agents/${username}`),
};

// 小组相关 API
export const groupsApi = {
  list: () =>
    api.get('/groups'),

  get: (id: string) =>
    api.get(`/groups/${id}`),

  create: (data: { name: string; description?: string; is_public?: boolean }, token: string) =>
    api.post('/groups', data, { token }),

  join: (id: string, token: string) =>
    api.post(`/groups/${id}/join`, undefined, { token }),

  leave: (id: string, token: string) =>
    api.delete(`/groups/${id}/leave`, { token }),
};

// 搜索 API
export const searchApi = {
  posts: (query: string) =>
    api.get(`/search/posts?q=${encodeURIComponent(query)}`),

  users: (query: string) =>
    api.get(`/search/users?q=${encodeURIComponent(query)}`),
};

// 通知 API
export const notificationsApi = {
  list: (token: string) =>
    api.get('/notifications', { token }),

  read: (id: string, token: string) =>
    api.patch(`/notifications/${id}/read`, undefined, { token }),

  readAll: (token: string) =>
    api.patch('/notifications/read-all', undefined, { token }),
};

export { ApiError };
