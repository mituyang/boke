// 用户登出
export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    // 获取 token
    const authToken = getCookieValue(request.headers.get('cookie'), 'auth-token');
    
    if (authToken) {
      // 删除数据库中的会话记录
      const tokenHash = await hashString(authToken);
      await env.DB.prepare(
        "DELETE FROM user_sessions WHERE token_hash = ?"
      ).bind(tokenHash).run();
    }

    // 清除 cookie
    const response = Response.json({
      success: true,
      message: "登出成功"
    });

    response.headers.set('Set-Cookie', 'auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/');

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return Response.json(
      { error: "登出失败" }, 
      { status: 500 }
    );
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