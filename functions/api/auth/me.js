// 获取当前用户信息
export async function onRequestGet(context) {
  const { env, request } = context;

  try {
    // 验证用户身份
    const user = await verifyAuth(request, env);
    if (!user) {
      return Response.json(
        { error: "未登录或会话已过期" }, 
        { status: 401 }
      );
    }

    return Response.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
        lastLogin: user.last_login,
        updatedAt: user.updated_at
      }
    });

  } catch (error) {
    console.error('Get user info error:', error);
    return Response.json(
      { error: "获取用户信息失败" }, 
      { status: 500 }
    );
  }
}

// 验证用户身份（简化版）
async function verifyAuth(request, env) {
  try {
    // 获取 token
    const authToken = getCookieValue(request.headers.get('cookie'), 'auth-token');
    if (!authToken) return null;

    // 检查会话是否存在且有效
    const tokenHash = await hashString(authToken);
    const { results } = await env.DB.prepare(
      `SELECT u.id, u.username, u.name, u.email, u.role, u.is_active, u.last_login, u.updated_at
       FROM users u 
       JOIN user_sessions s ON u.id = s.user_id 
       WHERE s.token_hash = ? AND s.expires_at > datetime('now') 
         AND u.is_active = TRUE AND u.deleted_at IS NULL`
    ).bind(tokenHash).all();

    if (results.length === 0) return null;

    return results[0];
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

// 从 cookie 字符串中提取指定的值
function getCookieValue(cookieString, name) {
  if (!cookieString) return null;
  
  const cookies = cookieString.split(';');
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return cookieValue;
    }
  }
  return null;
}

// 哈希函数
async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

