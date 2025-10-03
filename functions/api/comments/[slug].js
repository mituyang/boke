// 获取上海时区时间的ISO字符串（用于数据库）
function getShanghaiTimeISO() {
  const now = new Date();
  // 获取上海时区的时间
  const shanghaiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  return shanghaiTime.toISOString().replace('Z', '+08:00');
}

// 获取帖子评论
export async function onRequestGet(context) {
  const { params, env } = context;
  const slug = params.slug;

  try {
    const { results } = await env.DB.prepare(
      `SELECT c.id, u.name as user_name, u.username, c.content, c.created_at, c.parent_id 
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_slug = ? AND c.is_approved = TRUE AND u.is_active = TRUE AND u.deleted_at IS NULL
       ORDER BY c.created_at ASC`
    ).bind(slug).all();

    // 组织评论为树形结构（支持回复）
    const commentsMap = new Map();
    const rootComments = [];

    results.forEach(comment => {
      comment.replies = [];
      commentsMap.set(comment.id, comment);
      
      if (comment.parent_id) {
        const parent = commentsMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    return Response.json(rootComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return Response.json(
      { error: "获取评论失败" }, 
      { status: 500 }
    );
  }
}

// 添加新评论（只有登录用户可以评论）
export async function onRequestPost(context) {
  const { params, env, request } = context;
  const slug = params.slug;

  try {
    // 验证用户是否登录
    const user = await verifyAuth(request, env);
    if (!user) {
      return Response.json(
        { error: "请先登录后再发表评论" }, 
        { status: 401 }
      );
    }

    const { content, parent_id } = await request.json();

    // 基本验证
    if (!content || content.trim() === '') {
      return Response.json(
        { error: "评论内容不能为空" }, 
        { status: 400 }
      );
    }

    // 内容长度验证
    if (content.length > 1000) {
      return Response.json(
        { error: "评论内容不能超过 1000 字" }, 
        { status: 400 }
      );
    }

    // 插入评论（使用上海时区）
    const shanghaiTime = getShanghaiTimeISO();
    const { success } = await env.DB.prepare(
      `INSERT INTO comments (post_slug, user_id, user_name, user_email, content, parent_id, is_approved, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(slug, user.id, user.name, user.email, content.trim(), parent_id || null, true, shanghaiTime).run();

    if (success) {
      // 更新帖子评论数量
      await env.DB.prepare(
        `INSERT INTO post_stats (post_slug, view_count, comment_count, updated_at) 
         VALUES (?, 0, 1, ?) 
         ON CONFLICT(post_slug) 
         DO UPDATE SET comment_count = comment_count + 1, updated_at = ?`
      ).bind(slug, shanghaiTime, shanghaiTime).run();

      // 更新网站总评论数
      await env.DB.prepare(
        "UPDATE site_stats SET total_comments = total_comments + 1, updated_at = ?"
      ).bind(shanghaiTime).run();

      // 创建评论通知
      try {
        let notificationTargets = [];

        if (parent_id) {
          // 回复评论：通知被回复的用户
          const parentComment = await env.DB.prepare(`
            SELECT c.user_id, u.username, u.name as display_name, c.content
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ? AND u.deleted_at IS NULL
          `).bind(parent_id).first();

          if (parentComment && parentComment.user_id !== user.id) {
            notificationTargets.push({
              userId: parentComment.user_id,
              title: '收到新回复',
              content: `${user.name || user.username} 回复了你的评论`
            });
          }
        }

        // 通知文章作者（如果不是作者自己评论）
        // 对slug进行URL解码，处理中文slug
        const decodedSlug = decodeURIComponent(slug);
        const postAuthor = await env.DB.prepare(`
          SELECT p.author_id, p.title, u.username, u.name as display_name
          FROM user_posts p
          JOIN users u ON p.author_id = u.id
          WHERE p.slug = ? AND u.deleted_at IS NULL
        `).bind(decodedSlug).first();

        if (postAuthor && postAuthor.author_id !== user.id) {
          // 检查是否已经在通知列表中（避免重复通知）
          const alreadyNotified = notificationTargets.some(target => target.userId === postAuthor.author_id);
          if (!alreadyNotified) {
            notificationTargets.push({
              userId: postAuthor.author_id,
              title: '文章收到新评论',
              content: `${user.name || user.username} 评论了你的文章《${postAuthor.title}》`
            });
          }
        }

        // 批量创建通知
        if (notificationTargets.length > 0) {
          const notificationInserts = notificationTargets.map(target =>
                         env.DB.prepare(`
               INSERT INTO notifications (user_id, type, title, content, source_user_id, source_post_slug, created_at)
               VALUES (?, 'comment', ?, ?, ?, ?, ?)
             `).bind(target.userId, target.title, target.content, user.id, decodedSlug, shanghaiTime)
          );

          await env.DB.batch(notificationInserts);
        }
      } catch (notificationError) {
        console.error('创建评论通知失败:', notificationError);
        // 通知失败不影响评论功能
      }

      return Response.json({ 
        message: "评论发表成功！", 
        success: true 
      });
    } else {
      return Response.json(
        { error: "评论发表失败" }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error adding comment:', error);
    return Response.json(
      { error: "服务器错误，请稍后重试" }, 
      { status: 500 }
    );
  }
}

// 验证用户身份
async function verifyAuth(request, env) {
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

 