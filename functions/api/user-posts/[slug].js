// functions/api/user-posts/[slug].js
// 获取单篇用户文章API

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

export async function onRequest(context) {
  const { request, env, params } = context;
  const { slug: rawSlug } = params;
  // 对slug进行URL解码以处理特殊字符
  const slug = decodeURIComponent(rawSlug);
  const method = request.method;

  // 设置CORS头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (method === 'GET') {
      // 获取用户信息
      const user = await verifyUser(request, env);
      
      // 获取文章详情
      const post = await env.DB.prepare(`
        SELECT up.*, u.username, u.name as author_name
        FROM user_posts up 
        JOIN users u ON up.author_id = u.id 
        WHERE up.slug = ? AND u.is_active = 1 AND u.deleted_at IS NULL
      `).bind(slug).first();

      if (!post) {
        return new Response(JSON.stringify({
          success: false,
          message: '文章不存在'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 权限检查：已发布的文章所有人可见，草稿只有作者和管理员可见
      console.log('文章状态:', post.status, '用户:', user ? user.id : 'null');
      
      if (post.status === 'published') {
        // 已发布文章，所有人（包括未登录用户）都可以查看
        console.log('已发布文章，允许访问');
      } else if (post.status === 'draft' || post.status === 'deleted') {
        // 草稿或已删除文章，只有作者和管理员可以查看
        if (!user) {
          return new Response(JSON.stringify({
            success: false,
            message: '请登录后查看草稿文章'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        if (post.author_id !== user.id && user.role !== 'admin' && user.role !== 'super_admin') {
          return new Response(JSON.stringify({
            success: false,
            message: '无权限访问此文章'
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        console.log('草稿文章，用户有权限访问');
      } else {
        return new Response(JSON.stringify({
          success: false,
          message: '文章状态异常'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 如果是已发布的文章，增加浏览量
      if (post.status === 'published') {
        try {
          await env.DB.prepare(`
            UPDATE user_posts SET view_count = view_count + 1 WHERE id = ?
          `).bind(post.id).run();
          post.view_count = (post.view_count || 0) + 1;
        } catch (error) {
          console.error('更新浏览量失败:', error);
          // 不影响文章显示，继续执行
        }
      }

      return new Response(JSON.stringify({
        success: true,
        post: post
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
    console.error('获取用户文章API错误:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '服务器错误'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
} 