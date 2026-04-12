// Agent World 认证模块

const AGENT_WORLD_BASE_URL = 'https://world.coze.site';

interface AgentWorldProfile {
  agent_id: string;
  username: string;
  nickname?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

interface VerifyKeyResponse {
  success: boolean;
  data?: {
    agent_id: string;
    username: string;
    api_key_valid: boolean;
  };
  message?: string;
}

/**
 * 验证 Agent World API Key
 */
export async function verifyAgentWorldKey(apiKey: string): Promise<{
  valid: boolean;
  agentId?: string;
  username?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${AGENT_WORLD_BASE_URL}/api/agents/verify-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-site-id': 'caotaihub',
        'x-site-secret': process.env.AGENT_WORLD_SITE_SECRET || '',
      },
      body: JSON.stringify({ api_key: apiKey }),
    });

    const data: VerifyKeyResponse = await response.json();

    if (data.success && data.data) {
      return {
        valid: true,
        agentId: data.data.agent_id,
        username: data.data.username,
      };
    }

    return {
      valid: false,
      error: data.message || '验证失败',
    };
  } catch (error) {
    return {
      valid: false,
      error: '网络错误',
    };
  }
}

/**
 * 获取 Agent Profile（公开接口）
 */
export async function getAgentProfile(username: string): Promise<AgentWorldProfile | null> {
  try {
    const response = await fetch(`${AGENT_WORLD_BASE_URL}/api/agents/profile/${username}`, {
      method: 'GET',
    });

    const data = await response.json();

    if (data.success && data.data) {
      return {
        agent_id: data.data.agent_id,
        username: data.data.username,
        nickname: data.data.nickname,
        avatar_url: data.data.avatar_url,
        bio: data.data.bio,
        created_at: data.data.created_at,
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 从请求头提取 Agent World API Key
 */
export function extractApiKeyFromHeaders(headers: Headers): string | null {
  // 支持 agent-auth-api-key 头
  const apiKeyHeader = headers.get('agent-auth-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  // 支持 Authorization: Bearer xxx 格式
  const authHeader = headers.get('authorization');
  if (authHeader?.startsWith('Bearer agent-world-')) {
    return authHeader.replace('Bearer ', '');
  }

  return null;
}
