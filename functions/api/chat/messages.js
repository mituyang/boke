// 时间工具函数
function getShanghaiTimeISO() {
  const now = new Date();
  const shanghaiTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // UTC+8
  return shanghaiTime.toISOString().replace('T', ' ').substring(0, 19);
}

// 验证用户身份
async function authenticateUser(request, env) {
  try {
    // 获取 auth-token
    const authToken = getCookieValue(request.headers.get('cookie'), 'auth-token');
    if (!authToken) return null;

    // 检查会话是否存在且有效
    const tokenHash = await hashString(authToken);
    const user = await env.DB.prepare(`
      SELECT u.id, u.username, u.name, u.email, u.role, u.is_active
      FROM users u 
      JOIN user_sessions s ON u.id = s.user_id 
      WHERE s.token_hash = ? AND s.expires_at > datetime('now') 
        AND u.is_active = TRUE AND u.deleted_at IS NULL
    `).bind(tokenHash).first();

    return user;
  } catch (error) {
    console.error('认证失败:', error);
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

export async function onRequestGet({ request, env, params }) {
  try {
    // 验证用户身份
    const user = await authenticateUser(request, env);
    if (!user) {
      return new Response(JSON.stringify({ error: '请先登录' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const roomId = url.searchParams.get('roomId') || '1';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // 获取聊天消息
    const messages = await env.DB.prepare(`
      SELECT 
        id, user_id, username, user_name, content, message_type,
        created_at, updated_at, deleted_at, deleted_by, is_edited
      FROM chat_messages 
      WHERE room_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(roomId, limit, offset).all();

    // 反转顺序，让最新消息在底部
    const sortedMessages = messages.results.reverse();

    return new Response(JSON.stringify({
      messages: sortedMessages,
      hasMore: messages.results.length === limit
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('获取消息失败:', error);
    return new Response(JSON.stringify({ error: '获取消息失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    // 验证用户身份
    const user = await authenticateUser(request, env);
    if (!user) {
      return new Response(JSON.stringify({ error: '请先登录' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!user.is_active) {
      return new Response(JSON.stringify({ error: '账户已被禁用' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { roomId = 1, content, messageType = 'text' } = await request.json();

    // 验证消息内容
    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: '消息内容不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return new Response(JSON.stringify({ error: '消息内容不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (trimmedContent.length > 500) {
      return new Response(JSON.stringify({ error: '消息长度不能超过500字符' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 取消频率限制 - 根据用户要求
    // const recentMessages = await env.DB.prepare(`
    //   SELECT COUNT(*) as count
    //   FROM chat_messages 
    //   WHERE user_id = ? AND created_at > datetime('now', '-1 minute')
    // `).bind(user.id).first();

    // if (recentMessages.count >= 10) {
    //   return new Response(JSON.stringify({ error: '发送消息过于频繁，请稍后再试' }), {
    //     status: 429,
    //     headers: { 'Content-Type': 'application/json' }
    //   });
    // }

    const now = getShanghaiTimeISO();

    // 插入新消息
    const result = await env.DB.prepare(`
      INSERT INTO chat_messages (
        room_id, user_id, username, user_name, content, message_type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      roomId,
      user.id,
      user.username,
      user.name,
      trimmedContent,
      messageType,
      now,
      now
    ).run();

    if (!result.success) {
      throw new Error('插入消息失败');
    }

    // 返回新创建的消息
    const newMessage = await env.DB.prepare(`
      SELECT id, user_id, username, user_name, content, message_type, created_at, is_edited
      FROM chat_messages 
      WHERE id = ?
    `).bind(result.meta.last_row_id).first();

    return new Response(JSON.stringify({
      message: newMessage,
      success: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('发送消息失败:', error);
    return new Response(JSON.stringify({ error: '发送消息失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    // 验证用户身份
    const user = await authenticateUser(request, env);
    if (!user) {
      return new Response(JSON.stringify({ error: '请先登录' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const messageId = url.searchParams.get('messageId');

    if (!messageId) {
      return new Response(JSON.stringify({ error: '缺少消息ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取要删除的消息
    const message = await env.DB.prepare(`
      SELECT id, user_id, deleted_at
      FROM chat_messages 
      WHERE id = ?
    `).bind(messageId).first();

    if (!message) {
      return new Response(JSON.stringify({ error: '消息不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (message.deleted_at) {
      return new Response(JSON.stringify({ error: '消息已被删除' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查删除权限
    const canDelete = user.role === 'admin' || 
                     user.role === 'super_admin' || 
                     message.user_id === user.id;

    if (!canDelete) {
      return new Response(JSON.stringify({ error: '没有权限删除此消息' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = getShanghaiTimeISO();

    // 软删除消息
    const result = await env.DB.prepare(`
      UPDATE chat_messages 
      SET deleted_at = ?, deleted_by = ?, updated_at = ?
      WHERE id = ?
    `).bind(now, user.id, now, messageId).run();

    if (!result.success) {
      throw new Error('删除消息失败');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('删除消息失败:', error);
    return new Response(JSON.stringify({ error: '删除消息失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 