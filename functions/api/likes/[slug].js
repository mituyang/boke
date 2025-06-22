// functions/api/likes/[slug].js
// 点赞功能API

// 获取上海时区时间
function getShanghaiTimeISO() {
  const now = new Date();
  const shanghaiTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // UTC+8
  return shanghaiTime.toISOString().replace('T', ' ').substring(0, 19);
}

// 简单解密函数
function simpleDecrypt(encryptedData, salt) {
  if (!encryptedData || !salt) return encryptedData;
  
  let decrypted = '';
  const saltBytes = new TextEncoder().encode(salt);
  const dataBytes = new TextEncoder().encode(encryptedData);
  
  for (let i = 0; i < dataBytes.length; i++) {
    decrypted += String.fromCharCode(dataBytes[i] ^ saltBytes[i % saltBytes.length]);
  }
  
  return decrypted;
}

// 检测并解密请求数据
function detectAndDecryptData(data) {
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (parsed.encrypted && parsed.salt) {
        const decrypted = simpleDecrypt(parsed.encrypted, parsed.salt);
        return JSON.parse(decrypted);
      }
    } catch (e) {
      // 不是加密数据，直接返回
    }
  }
  return data;
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

export async function onRequest(context) {
  const { request, env, params } = context;
  const { slug } = params;
  const method = request.method;

  // 设置CORS头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (method === 'GET') {
      // 获取文章点赞信息
      const authHeader = request.headers.get('Authorization');
      let userId = null;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const user = await verifyUser(request, env);
        if (user) {
          userId = user.id;
        }
      }

      // 获取总点赞数
      const likeCount = await env.DB.prepare(`
        SELECT COUNT(*) as count 
        FROM post_likes pl 
        JOIN users u ON pl.user_id = u.id 
        WHERE pl.post_slug = ? AND u.is_active = 1 AND u.deleted_at IS NULL
      `).bind(slug).first();

      // 检查用户是否已点赞
      let userLiked = false;
      if (userId) {
        const userLike = await env.DB.prepare(`
          SELECT id FROM post_likes WHERE post_slug = ? AND user_id = ?
        `).bind(slug, userId).first();
        userLiked = !!userLike;
      }

      return new Response(JSON.stringify({
        success: true,
        likeCount: likeCount.count,
        userLiked: userLiked
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (method === 'POST') {
      // 添加或取消点赞
      const user = await verifyUser(request, env);
      if (!user) {
        return new Response(JSON.stringify({
          success: false,
          message: '请先登录'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 检查是否已点赞
      const existingLike = await env.DB.prepare(`
        SELECT id FROM post_likes WHERE post_slug = ? AND user_id = ?
      `).bind(slug, user.id).first();

      const currentTime = getShanghaiTimeISO();

      if (existingLike) {
        // 已点赞，取消点赞
        await env.DB.prepare(`
          DELETE FROM post_likes WHERE post_slug = ? AND user_id = ?
        `).bind(slug, user.id).run();

        // 更新统计
        await env.DB.prepare(`
          UPDATE post_stats SET like_count = like_count - 1 WHERE post_slug = ?
        `).bind(slug).run();

        await env.DB.prepare(`
          UPDATE site_stats SET total_likes = total_likes - 1
        `).run();

        return new Response(JSON.stringify({
          success: true,
          action: 'unliked',
          message: '已取消点赞'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } else {
        // 未点赞，添加点赞
        await env.DB.prepare(`
          INSERT INTO post_likes (post_slug, user_id, created_at) VALUES (?, ?, ?)
        `).bind(slug, user.id, currentTime).run();

        // 更新或插入文章统计
        const existingStats = await env.DB.prepare(`
          SELECT post_slug FROM post_stats WHERE post_slug = ?
        `).bind(slug).first();

        if (existingStats) {
          await env.DB.prepare(`
            UPDATE post_stats SET like_count = like_count + 1 WHERE post_slug = ?
          `).bind(slug).run();
        } else {
          await env.DB.prepare(`
            INSERT INTO post_stats (post_slug, view_count, comment_count, like_count) 
            VALUES (?, 0, 0, 1)
          `).bind(slug).run();
        }

        await env.DB.prepare(`
          UPDATE site_stats SET total_likes = total_likes + 1
        `).run();

        return new Response(JSON.stringify({
          success: true,
          action: 'liked',
          message: '点赞成功'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

    } else {
      return new Response(JSON.stringify({
        success: false,
        message: '不支持的请求方法'
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('点赞API错误:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '服务器错误'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
} 