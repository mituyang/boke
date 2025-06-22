// functions/api/user-posts.js
// 用户文章管理API

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

// 生成文章slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, '') // 保留中文、英文、数字、空格、横线
    .replace(/\s+/g, '-') // 空格替换为横线
    .replace(/-+/g, '-') // 多个横线替换为一个
    .replace(/^-|-$/g, '') // 去除首尾横线
    .substring(0, 100); // 限制长度
}

// 生成文章摘要
function generateExcerpt(content, maxLength = 200) {
  const text = content.replace(/[#*\[\]()]/g, '').trim(); // 移除markdown标记
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);

  // 设置CORS头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (method === 'GET') {
      // 获取用户文章列表
      const status = url.searchParams.get('status') || 'all';
      const page = parseInt(url.searchParams.get('page')) || 1;
      const limit = parseInt(url.searchParams.get('limit')) || 10;
      const offset = (page - 1) * limit;

      // 如果是获取已发布文章，不需要登录验证（用于首页显示）
      if (status === 'published') {
        let query = `
          SELECT up.*, u.username, u.name as author_name
          FROM user_posts up 
          JOIN users u ON up.author_id = u.id 
          WHERE u.is_active = 1 AND u.deleted_at IS NULL
            AND up.status = 'published'
          ORDER BY up.created_at DESC LIMIT ? OFFSET ?
        `;
        
        let countQuery = `
          SELECT COUNT(*) as total
          FROM user_posts up 
          JOIN users u ON up.author_id = u.id 
          WHERE u.is_active = 1 AND u.deleted_at IS NULL
            AND up.status = 'published'
        `;

        const posts = await env.DB.prepare(query).bind(limit, offset).all();
        const totalResult = await env.DB.prepare(countQuery).first();

        return new Response(JSON.stringify({
          success: true,
          posts: posts.results || [],
          total: totalResult.total,
          page: page,
          limit: limit,
          totalPages: Math.ceil(totalResult.total / limit)
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 其他请求需要登录验证
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

      let query = `
        SELECT up.*, u.username, u.name as author_name
        FROM user_posts up 
        JOIN users u ON up.author_id = u.id 
        WHERE u.is_active = 1 AND u.deleted_at IS NULL
      `;
      
      let countQuery = `
        SELECT COUNT(*) as total
        FROM user_posts up 
        JOIN users u ON up.author_id = u.id 
        WHERE u.is_active = 1 AND u.deleted_at IS NULL
      `;

      const params = [];

      // 权限过滤：普通用户只能看自己的文章，管理员可以看所有文章
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        query += ` AND up.author_id = ?`;
        countQuery += ` AND up.author_id = ?`;
        params.push(user.id);
      }

      // 状态过滤
      if (status !== 'all') {
        query += ` AND up.status = ?`;
        countQuery += ` AND up.status = ?`;
        params.push(status);
      }

      query += ` ORDER BY up.created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const posts = await env.DB.prepare(query).bind(...params).all();
      const totalResult = await env.DB.prepare(countQuery).bind(...params.slice(0, -2)).first();

      return new Response(JSON.stringify({
        success: true,
        posts: posts.results || [],
        total: totalResult.total,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalResult.total / limit)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (method === 'POST') {
      // POST方法需要登录验证
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

      // 创建新文章
      const rawBody = await request.text();
      const body = detectAndDecryptData(rawBody);
      const data = typeof body === 'string' ? JSON.parse(body) : body;

      const { title, content, status = 'draft' } = data;

      if (!title || !content) {
        return new Response(JSON.stringify({
          success: false,
          message: '标题和内容不能为空'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 生成唯一slug
      let baseSlug = generateSlug(title);
      let slug = baseSlug;
      let counter = 1;
      
      while (true) {
        const existing = await env.DB.prepare(`
          SELECT id FROM user_posts WHERE slug = ?
        `).bind(slug).first();
        
        if (!existing) break;
        
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const excerpt = generateExcerpt(content);
      const currentTime = getShanghaiTimeISO();
      const publishedAt = status === 'published' ? currentTime : null;
      
      // 管理员和超级管理员创建的文章标记为官方文章
      const isOfficial = user.role === 'admin' || user.role === 'super_admin';

      const result = await env.DB.prepare(`
        INSERT INTO user_posts 
        (slug, title, content, excerpt, author_id, status, published_at, is_official, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(slug, title, content, excerpt, user.id, status, publishedAt, isOfficial, currentTime, currentTime).run();

      // 如果发布，更新网站统计
      if (status === 'published') {
        await env.DB.prepare(`
          UPDATE site_stats SET total_user_posts = total_user_posts + 1
        `).run();
      }

      return new Response(JSON.stringify({
        success: true,
        message: '文章创建成功',
        postId: result.meta.last_row_id,
        slug: slug
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (method === 'PUT') {
      // PUT方法需要登录验证
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

      // 更新文章
      const rawBody = await request.text();
      const body = detectAndDecryptData(rawBody);
      const data = typeof body === 'string' ? JSON.parse(body) : body;

      const { id, title, content, status } = data;

      if (!id || !title || !content) {
        return new Response(JSON.stringify({
          success: false,
          message: '文章ID、标题和内容不能为空'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 检查文章是否存在且用户有权限编辑
      const existingPost = await env.DB.prepare(`
        SELECT * FROM user_posts WHERE id = ?
      `).bind(id).first();

      if (!existingPost) {
        return new Response(JSON.stringify({
          success: false,
          message: '文章不存在'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 权限检查：只有作者本人或管理员可以编辑
      if (existingPost.author_id !== user.id && user.role !== 'admin' && user.role !== 'super_admin') {
        return new Response(JSON.stringify({
          success: false,
          message: '无权限编辑此文章'
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const excerpt = generateExcerpt(content);
      const currentTime = getShanghaiTimeISO();
      
      // 如果状态从非发布变为发布，设置发布时间
      let publishedAt = existingPost.published_at;
      if (status === 'published' && existingPost.status !== 'published') {
        publishedAt = currentTime;
      } else if (status !== 'published') {
        publishedAt = null;
      }

      await env.DB.prepare(`
        UPDATE user_posts 
        SET title = ?, content = ?, excerpt = ?, status = ?, published_at = ?, updated_at = ?
        WHERE id = ?
      `).bind(title, content, excerpt, status, publishedAt, currentTime, id).run();

      // 更新网站统计
      if (existingPost.status !== 'published' && status === 'published') {
        // 从非发布状态变为发布状态
        await env.DB.prepare(`
          UPDATE site_stats SET total_user_posts = total_user_posts + 1
        `).run();
      } else if (existingPost.status === 'published' && status !== 'published') {
        // 从发布状态变为非发布状态
        await env.DB.prepare(`
          UPDATE site_stats SET total_user_posts = total_user_posts - 1
        `).run();
      }

      return new Response(JSON.stringify({
        success: true,
        message: '文章更新成功'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (method === 'DELETE') {
      // DELETE方法需要登录验证
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

      // 删除文章
      const url = new URL(request.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return new Response(JSON.stringify({
          success: false,
          message: '文章ID不能为空'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 检查文章是否存在且用户有权限删除
      const existingPost = await env.DB.prepare(`
        SELECT * FROM user_posts WHERE id = ?
      `).bind(id).first();

      if (!existingPost) {
        return new Response(JSON.stringify({
          success: false,
          message: '文章不存在'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 权限检查：只有作者本人或管理员可以删除
      if (existingPost.author_id !== user.id && user.role !== 'admin' && user.role !== 'super_admin') {
        return new Response(JSON.stringify({
          success: false,
          message: '无权限删除此文章'
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 软删除：设置状态为deleted
      const currentTime = getShanghaiTimeISO();
      await env.DB.prepare(`
        UPDATE user_posts SET status = 'deleted', updated_at = ? WHERE id = ?
      `).bind(currentTime, id).run();

      // 如果原来是发布状态，更新网站统计
      if (existingPost.status === 'published') {
        await env.DB.prepare(`
          UPDATE site_stats SET total_user_posts = total_user_posts - 1
        `).run();
      }

      return new Response(JSON.stringify({
        success: true,
        message: '文章删除成功'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

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
    console.error('用户文章API错误:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '服务器错误'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
} 