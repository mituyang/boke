// 获取上海时区时间的ISO字符串（用于数据库）
function getShanghaiTimeISO() {
  const now = new Date();
  // 获取上海时区的时间
  const shanghaiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  return shanghaiTime.toISOString().replace('Z', '+08:00');
}

// 获取所有用户（管理员）
export async function onRequestGet(context) {
  const { env, request } = context;

  try {
    // 验证管理员权限
    const admin = await verifyAdminAuth(request, env);
    if (!admin) {
      return Response.json(
        { error: "需要管理员权限" },
        { status: 403 }
      );
    }

    // 获取所有用户列表（包括已删除用户）
    const { results } = await env.DB.prepare(
      `SELECT id, username, name, email, role, is_active, last_login, created_at, deleted_at 
       FROM users 
       ORDER BY created_at DESC`
    ).all();

    return Response.json({ users: results });

  } catch (error) {
    console.error('Get users error:', error);
    return Response.json(
      { error: "获取用户列表失败" },
      { status: 500 }
    );
  }
}

// 更新用户信息 (PUT)
export async function onRequestPut(context) {
  const { env, request } = context;

  try {
    // 验证管理员权限
    const admin = await verifyAdminAuth(request, env);
    if (!admin) {
      return Response.json(
        { error: "需要管理员权限" },
        { status: 403 }
      );
    }

    const { userId, role, isActive } = await request.json();

    if (!userId) {
      return Response.json(
        { error: "用户ID是必填的" },
        { status: 400 }
      );
    }

    // 检查是否试图修改角色 - 只有超级管理员(admin)可以分配角色
    if (role !== undefined) {
      if (admin.username !== 'admin') {
        return Response.json(
          { error: "只有超级管理员才能分配用户角色" },
          { status: 403 }
        );
      }

      // 验证角色值
      if (!['user', 'admin'].includes(role)) {
        return Response.json(
          { error: "无效的角色值" },
          { status: 400 }
        );
      }

      // 防止修改自己的角色
      if (userId == admin.id) {
        return Response.json(
          { error: "不能修改自己的角色" },
          { status: 400 }
        );
      }
    }

    // 构建更新语句
    const updates = [];
    const values = [];

    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }

    if (isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(isActive ? 1 : 0);
    }

    if (updates.length === 0) {
      return Response.json(
        { error: "没有要更新的字段" },
        { status: 400 }
      );
    }

    // 添加更新时间
    const shanghaiTime = getShanghaiTimeISO();
    updates.push('updated_at = ?');
    values.push(shanghaiTime);
    values.push(userId);

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await env.DB.prepare(sql).bind(...values).run();

    return Response.json({
      success: true,
      message: "用户信息更新成功"
    });

  } catch (error) {
    console.error('Update user error:', error);
    return Response.json(
      { error: "更新用户信息失败" },
      { status: 500 }
    );
  }
}

// 删除用户 (DELETE)
export async function onRequestDelete(context) {
  const { env, request } = context;

  try {
    // 只有超级管理员(admin)可以删除用户
    const admin = await verifyAdminAuth(request, env);
    if (!admin || admin.username !== 'admin') {
      return Response.json(
        { error: "只有超级管理员才能删除用户" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return Response.json(
        { error: "用户ID是必填的" },
        { status: 400 }
      );
    }

    // 防止删除自己
    if (userId == admin.id) {
      return Response.json(
        { error: "不能删除自己的账号" },
        { status: 400 }
      );
    }

    // 软删除用户（标记为已删除，但保留记录）
    const shanghaiTime = getShanghaiTimeISO();
    await env.DB.prepare("DELETE FROM user_sessions WHERE user_id = ?").bind(userId).run();
    await env.DB.prepare(
      "UPDATE users SET deleted_at = ?, is_active = 0, updated_at = ? WHERE id = ?"
    ).bind(shanghaiTime, shanghaiTime, userId).run();

    return Response.json({
      success: true,
      message: "用户删除成功"
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return Response.json(
      { error: "删除用户失败" },
      { status: 500 }
    );
  }
}

// 验证管理员权限
async function verifyAdminAuth(request, env) {
  try {
    // 获取 token
    const authToken = getCookieValue(request.headers.get('cookie'), 'auth-token');
    if (!authToken) return null;

    // 检查会话是否存在且有效，并验证管理员权限
    const tokenHash = await hashString(authToken);
    const { results } = await env.DB.prepare(
      `SELECT u.id, u.username, u.name, u.email, u.role, u.is_active
       FROM users u 
       JOIN user_sessions s ON u.id = s.user_id 
       WHERE s.token_hash = ? AND s.expires_at > datetime('now') 
         AND u.is_active = TRUE AND u.role = 'admin' AND u.deleted_at IS NULL`
    ).bind(tokenHash).all();

    if (results.length === 0) return null;

    return results[0];
  } catch (error) {
    console.error('Admin auth verification error:', error);
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

 