// 获取上海时区时间
function getShanghaiTimeISO() {
  const now = new Date();
  const shanghaiTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // UTC+8
  return shanghaiTime.toISOString().replace('T', ' ').substring(0, 19);
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

// 验证用户token（使用cookie认证）
async function verifyUser(request, env) {
  try {
    // 获取 token
    const authToken = getCookieValue(request.headers.get('cookie'), 'auth-token');
    if (!authToken) return null;

    // 检查会话是否存在且有效
    const tokenHash = await hashString(authToken);
    const { results } = await env.DB.prepare(
      `SELECT u.id, u.username, u.name, u.email, u.role, u.is_active
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

// 服务端解密函数
function decryptData(encryptedData) {
  try {
    // 从base64解码
    const binaryString = atob(encryptedData);
    const combined = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      combined[i] = binaryString.charCodeAt(i);
    }
    
    // 提取盐值和加密数据
    const salt = combined.slice(0, 16);
    const encrypted = combined.slice(16);
    
    // 解密
    const decrypted = new Uint8Array(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ salt[i % salt.length];
    }
    
    // 转换为字符串
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData; // 解密失败时返回原数据
  }
}

// 更新用户资料
export async function onRequestPut(context) {
  const { env, request } = context;

  try {
    // 验证用户登录状态
    const user = await verifyUser(request, env);
    if (!user) {
      return Response.json(
        { error: "请先登录" }, 
        { status: 401 }
      );
    }

    const requestData = await request.json();
    let { nickname, userId, email, encrypted } = requestData;

    // 如果数据已加密，先解密
    if (encrypted) {
      nickname = decryptData(nickname);
      userId = decryptData(userId);
      email = decryptData(email);
    }

    // 基本验证
    if (!nickname || !userId || !email) {
      return Response.json(
        { error: "所有字段都是必填的" }, 
        { status: 400 }
      );
    }

    // 验证用户ID格式
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(userId)) {
      return Response.json(
        { error: "用户ID只能包含字母、数字和下划线，长度3-20位" }, 
        { status: 400 }
      );
    }

    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { error: "请输入有效的邮箱地址" }, 
        { status: 400 }
      );
    }

    // 检查用户ID是否已被其他用户使用
    if (userId !== user.username) {
      const existingUser = await env.DB.prepare(
        "SELECT id FROM users WHERE username = ? AND id != ?"
      ).bind(userId, user.id).first();

      if (existingUser) {
        return Response.json(
          { error: "用户ID已被其他用户使用" }, 
          { status: 409 }
        );
      }
    }

    // 检查邮箱是否已被其他用户使用
    if (email !== user.email) {
      const existingEmail = await env.DB.prepare(
        "SELECT id FROM users WHERE email = ? AND id != ?"
      ).bind(email, user.id).first();

      if (existingEmail) {
        return Response.json(
          { error: "邮箱已被其他用户使用" }, 
          { status: 409 }
        );
      }
    }

    // 更新用户信息
    const shanghaiTime = getShanghaiTimeISO();
    await env.DB.prepare(
      "UPDATE users SET username = ?, name = ?, email = ?, updated_at = ? WHERE id = ?"
    ).bind(userId, nickname, email, shanghaiTime, user.id).run();

    // 获取更新后的用户信息
    const { results } = await env.DB.prepare(
      "SELECT id, username, name, email, role, is_active, last_login, updated_at FROM users WHERE id = ?"
    ).bind(user.id).all();

    const updatedUser = results[0];

    return Response.json({
      success: true,
      message: "个人资料更新成功",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.is_active,
        lastLogin: updatedUser.last_login,
        updatedAt: updatedUser.updated_at
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return Response.json(
      { error: "更新失败，请稍后重试" }, 
      { status: 500 }
    );
  }
} 