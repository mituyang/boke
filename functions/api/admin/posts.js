export async function onRequestGet({ request, env }) {
  try {
    // 基本健康检查
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: '数据库未配置',
        env_keys: Object.keys(env)
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 验证管理员权限
    const authHeader = request.headers.get('Cookie');
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: '未授权访问' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 从 cookie 中获取 token
    const tokenMatch = authHeader.match(/auth-token=([^;]+)/);
    if (!tokenMatch) {
      return new Response(JSON.stringify({ error: '未找到认证令牌' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = tokenMatch[1];
    
    // 哈希token以查找会话
    const tokenHash = await hashString(token);
    
    // 查询用户信息（通过会话表）
    const userQuery = `
      SELECT u.id, u.username, u.role, u.is_active, u.deleted_at 
      FROM users u
      INNER JOIN user_sessions s ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > datetime('now') AND u.deleted_at IS NULL
    `;
    
    const userResult = await env.DB.prepare(userQuery).bind(tokenHash).first();
    
    if (!userResult || !userResult.is_active) {
      return new Response(JSON.stringify({ error: '用户未找到或已被禁用' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查管理员权限
    if (userResult.role !== 'admin' && userResult.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: '权限不足' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 先尝试简单的文章查询
    const simpleQuery = `SELECT COUNT(*) as count FROM user_posts WHERE status != 'deleted'`;
    const countResult = await env.DB.prepare(simpleQuery).first();
    
    // 获取所有文章 - 简化查询
    const postsQuery = `
      SELECT 
        p.id,
        p.slug,
        p.title,
        p.excerpt,
        p.status,
        p.view_count,
        p.like_count,
        p.comment_count,
        p.created_at,
        p.updated_at,
        p.published_at,
        p.author_id as user_id
      FROM user_posts p
      WHERE p.status != 'deleted'
      ORDER BY p.created_at DESC
      LIMIT 50
    `;

    const posts = await env.DB.prepare(postsQuery).all();
    
    // 为每个文章添加作者信息
    const postsWithAuthors = [];
    
    for (const post of posts.results || []) {
      try {
        const authorQuery = `SELECT id, username, name, role FROM users WHERE id = ?`;
        const author = await env.DB.prepare(authorQuery).bind(post.user_id).first();
        
        postsWithAuthors.push({
          ...post,
          view_count: post.view_count || 0,
          like_count: post.like_count || 0,
          comment_count: post.comment_count || 0,
          author_id: author?.id || null,
          username: author?.username || 'unknown',
          author_name: author?.name || 'Unknown User',
          is_official: (author?.role === 'admin' || author?.role === 'super_admin') ? true : false
        });
      } catch (authorError) {
        // 添加一个默认的作者信息
        postsWithAuthors.push({
          ...post,
          view_count: post.view_count || 0,
          like_count: post.like_count || 0,
          comment_count: post.comment_count || 0,
          author_id: null,
          username: 'unknown',
          author_name: 'Unknown User',
          is_official: false
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      debug: {
        total_posts: countResult?.count || 0,
        returned_posts: postsWithAuthors.length,
        user_role: userResult.role
      },
      posts: postsWithAuthors
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('获取文章列表失败:', error);
    return new Response(JSON.stringify({ 
      error: '服务器内部错误',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    // 基本健康检查
    if (!env.DB) {
      return new Response(JSON.stringify({ error: '数据库未配置' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 验证管理员权限
    const authHeader = request.headers.get('Cookie');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: '未授权访问' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 从 cookie 中获取 token
    const tokenMatch = authHeader.match(/auth-token=([^;]+)/);
    if (!tokenMatch) {
      return new Response(JSON.stringify({ error: '未找到认证令牌' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = tokenMatch[1];
    
    // 哈希token以查找会话
    const tokenHash = await hashString(token);
    
    // 查询用户信息（通过会话表）
    const userQuery = `
      SELECT u.id, u.username, u.role, u.is_active, u.deleted_at 
      FROM users u
      INNER JOIN user_sessions s ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > datetime('now') AND u.deleted_at IS NULL
    `;
    
    const userResult = await env.DB.prepare(userQuery).bind(tokenHash).first();
    
    if (!userResult || !userResult.is_active) {
      return new Response(JSON.stringify({ error: '用户未找到或已被禁用' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查管理员权限
    if (userResult.role !== 'admin' && userResult.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: '权限不足' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取要删除的文章ID
    const url = new URL(request.url);
    const postId = url.searchParams.get('postId');
    
    if (!postId) {
      return new Response(JSON.stringify({ error: '缺少文章ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查文章是否存在
    const postQuery = `
      SELECT p.id, p.slug, p.title, p.author_id as user_id, u.username, u.name as author_name, u.role as author_role
      FROM user_posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = ? AND p.status != 'deleted'
    `;
    const post = await env.DB.prepare(postQuery).bind(postId).first();
    
    if (!post) {
      return new Response(JSON.stringify({ error: '文章不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 权限检查：普通管理员只能删除普通用户的文章
    if (userResult.role !== 'super_admin') {
      if (post.author_role === 'admin' || post.author_role === 'super_admin') {
        return new Response(JSON.stringify({ error: '只有超级管理员可以删除管理员的文章' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 获取当前时间（上海时区）
    const getShanghaiTimeISO = () => {
      const now = new Date();
      const shanghaiTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
      return shanghaiTime.toISOString();
    };

    // 软删除文章（设置状态为deleted）
    const deleteQuery = `
      UPDATE user_posts 
      SET status = 'deleted', updated_at = ? 
      WHERE id = ?
    `;
    
    await env.DB.prepare(deleteQuery).bind(getShanghaiTimeISO(), postId).run();

    // 删除相关的评论（comments表中没有deleted_at字段，直接删除）
    const deleteCommentsQuery = `
      DELETE FROM comments 
      WHERE post_slug = ?
    `;
    
    await env.DB.prepare(deleteCommentsQuery).bind(post.slug).run();

    // 删除相关的点赞记录
    const deleteLikesQuery = `
      DELETE FROM post_likes 
      WHERE post_slug = ?
    `;
    
    await env.DB.prepare(deleteLikesQuery).bind(post.slug).run();

    return new Response(JSON.stringify({
      success: true,
      message: '文章删除成功',
      deletedPost: {
        id: post.id,
        title: post.title,
        author: post.author_name
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('删除文章失败:', error);
    return new Response(JSON.stringify({ 
      error: '服务器内部错误',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 哈希函数（与登录API中的相同）
async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
} 