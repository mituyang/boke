import { getUserFromToken } from './auth/me.js';

// 获取通知列表
export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const pageSize = parseInt(url.searchParams.get('pageSize')) || 20;
    const onlyUnread = url.searchParams.get('unread') === 'true';
    
    // 验证用户身份
    const currentUser = await getUserFromToken(request, env);
    if (!currentUser.success) {
      return new Response(JSON.stringify({
        success: false,
        message: '请先登录'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 构建查询条件
    let whereClause = 'WHERE n.user_id = ?';
    const params = [currentUser.user.id];
    
    if (onlyUnread) {
      whereClause += ' AND n.is_read = FALSE';
    }

    // 获取通知总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications n
      ${whereClause}
    `;
    const countResult = await env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult.total;

    // 获取通知列表（带源用户信息）
    const offset = (page - 1) * pageSize;
    const notificationsQuery = `
      SELECT 
        n.*,
        u.username as source_username,
        u.name as source_display_name
      FROM notifications n
      LEFT JOIN users u ON n.source_user_id = u.id AND u.deleted_at IS NULL
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const notifications = await env.DB.prepare(notificationsQuery)
      .bind(...params, pageSize, offset)
      .all();

    // 获取未读通知数量
    const unreadCountResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE'
    ).bind(currentUser.user.id).first();

    return new Response(JSON.stringify({
      success: true,
      notifications: notifications.results.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        content: n.content,
        isRead: !!n.is_read,
        sourceUser: n.source_user_id ? {
          username: n.source_username,
          displayName: n.source_display_name
        } : null,
        postSlug: n.source_post_slug,
        createdAt: n.created_at
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      },
      unreadCount: unreadCountResult.count
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('获取通知失败:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '获取通知失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 标记通知为已读
export async function onRequestPut(context) {
  try {
    const { request, env } = context;
    const { notificationIds, markAllAsRead } = await request.json();
    
    // 验证用户身份
    const currentUser = await getUserFromToken(request, env);
    if (!currentUser.success) {
      return new Response(JSON.stringify({
        success: false,
        message: '请先登录'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (markAllAsRead) {
      // 标记所有通知为已读
      await env.DB.prepare(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE'
      ).bind(currentUser.user.id).run();

      return new Response(JSON.stringify({
        success: true,
        message: '所有通知已标记为已读'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } else if (notificationIds && Array.isArray(notificationIds)) {
      // 标记指定通知为已读
      const placeholders = notificationIds.map(() => '?').join(',');
      await env.DB.prepare(
        `UPDATE notifications SET is_read = TRUE WHERE id IN (${placeholders}) AND user_id = ?`
      ).bind(...notificationIds, currentUser.user.id).run();

      return new Response(JSON.stringify({
        success: true,
        message: '通知已标记为已读'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } else {
      return new Response(JSON.stringify({
        success: false,
        message: '请提供要标记的通知ID或标记全部已读'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('标记通知失败:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '操作失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 删除通知
export async function onRequestDelete(context) {
  try {
    const { request, env } = context;
    const { notificationIds } = await request.json();
    
    // 验证用户身份
    const currentUser = await getUserFromToken(request, env);
    if (!currentUser.success) {
      return new Response(JSON.stringify({
        success: false,
        message: '请先登录'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return new Response(JSON.stringify({
        success: false,
        message: '请提供要删除的通知ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 删除指定通知
    const placeholders = notificationIds.map(() => '?').join(',');
    await env.DB.prepare(
      `DELETE FROM notifications WHERE id IN (${placeholders}) AND user_id = ?`
    ).bind(...notificationIds, currentUser.user.id).run();

    return new Response(JSON.stringify({
      success: true,
      message: '通知已删除'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('删除通知失败:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '删除失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 