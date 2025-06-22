// 同步评论数量统计（管理员专用）
export async function onRequestPost(context) {
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

    // 获取所有文章的实际评论数量（只计算活跃用户的评论）
    const { results: commentCounts } = await env.DB.prepare(
      `SELECT c.post_slug, COUNT(*) as actual_count 
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.is_approved = TRUE AND u.is_active = TRUE AND u.deleted_at IS NULL
       GROUP BY c.post_slug`
    ).all();

    // 获取所有已统计的文章
    const { results: postStats } = await env.DB.prepare(
      "SELECT post_slug, comment_count FROM post_stats"
    ).all();

    const updates = [];
    const mismatches = [];

    // 检查并更新不一致的数据
    for (const commentStat of commentCounts) {
      const postStat = postStats.find(p => p.post_slug === commentStat.post_slug);
      
      if (!postStat) {
        // 如果post_stats中没有该文章记录，创建一个
        await env.DB.prepare(
          "INSERT INTO post_stats (post_slug, view_count, comment_count) VALUES (?, 0, ?)"
        ).bind(commentStat.post_slug, commentStat.actual_count).run();
        
        updates.push({
          post_slug: commentStat.post_slug,
          old_count: 0,
          new_count: commentStat.actual_count,
          action: 'created'
        });
      } else if (postStat.comment_count !== commentStat.actual_count) {
        // 如果数量不一致，更新统计
        await env.DB.prepare(
          "UPDATE post_stats SET comment_count = ? WHERE post_slug = ?"
        ).bind(commentStat.actual_count, commentStat.post_slug).run();
        
        updates.push({
          post_slug: commentStat.post_slug,
          old_count: postStat.comment_count,
          new_count: commentStat.actual_count,
          action: 'updated'
        });
        
        mismatches.push({
          post_slug: commentStat.post_slug,
          stats_count: postStat.comment_count,
          actual_count: commentStat.actual_count
        });
      }
    }

    // 检查是否有文章在post_stats中有评论数但实际没有评论
    for (const postStat of postStats) {
      if (postStat.comment_count > 0) {
        const hasComments = commentCounts.find(c => c.post_slug === postStat.post_slug);
        if (!hasComments) {
          // 该文章在统计中有评论数，但实际没有评论，重置为0
          await env.DB.prepare(
            "UPDATE post_stats SET comment_count = 0 WHERE post_slug = ?"
          ).bind(postStat.post_slug).run();
          
          updates.push({
            post_slug: postStat.post_slug,
            old_count: postStat.comment_count,
            new_count: 0,
            action: 'reset'
          });
          
          mismatches.push({
            post_slug: postStat.post_slug,
            stats_count: postStat.comment_count,
            actual_count: 0
          });
        }
      }
    }

    return Response.json({
      success: true,
      message: `评论数量同步完成，处理了 ${updates.length} 个更新`,
      updates,
      mismatches_found: mismatches.length,
      mismatches
    });

  } catch (error) {
    console.error('Sync comments error:', error);
    return Response.json(
      { error: "同步评论数量失败" },
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