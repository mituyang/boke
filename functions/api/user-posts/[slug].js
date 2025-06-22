// functions/api/user-posts/[slug].js
// 获取单篇用户文章API

// 获取上海时区时间
function getShanghaiTimeISO() {
  const now = new Date();
  const shanghaiTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // UTC+8
  return shanghaiTime.toISOString().replace('T', ' ').substring(0, 19);
}

// 验证用户token
async function verifyUser(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const user = await env.DB.prepare(`
    SELECT u.id, u.username, u.name, u.role, u.is_active, u.deleted_at 
    FROM users u 
    JOIN user_sessions s ON u.id = s.user_id 
    WHERE s.token = ? AND u.is_active = 1 AND u.deleted_at IS NULL
  `).bind(token).first();

  return user;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const { slug } = params;
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
      if (post.status !== 'published') {
        if (!user || (post.author_id !== user.id && user.role !== 'admin' && user.role !== 'super_admin')) {
          return new Response(JSON.stringify({
            success: false,
            message: '无权限访问此文章'
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // 如果是已发布的文章，增加浏览量
      if (post.status === 'published') {
        await env.DB.prepare(`
          UPDATE user_posts SET view_count = view_count + 1 WHERE id = ?
        `).bind(post.id).run();
        post.view_count = post.view_count + 1;
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