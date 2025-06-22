// 获取上海时区时间的ISO字符串（用于数据库）
function getShanghaiTimeISO() {
  const now = new Date();
  // 获取上海时区的时间
  const shanghaiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  return shanghaiTime.toISOString().replace('Z', '+08:00');
}

// 获取和更新文章统计信息
export async function onRequestGet(context) {
  const { params, env } = context;
  const slug = params.slug;

  try {
    const { results } = await env.DB.prepare(
      "SELECT view_count, comment_count FROM post_stats WHERE post_slug = ?"
    ).bind(slug).all();

    if (results.length === 0) {
      // 如果文章统计不存在，创建一个
      await env.DB.prepare(
        "INSERT INTO post_stats (post_slug, view_count, comment_count) VALUES (?, 0, 0)"
      ).bind(slug).run();
      
      return Response.json({ view_count: 0, comment_count: 0 });
    }

    return Response.json(results[0]);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return Response.json(
      { error: "Failed to fetch stats" }, 
      { status: 500 }
        );
  }
}

// 获取当前用户信息（如果已登录）
async function getCurrentUser(request, env) {
  try {
    const authToken = getCookieValue(request.headers.get('cookie'), 'auth-token');
    if (!authToken) return null;

    const tokenHash = await hashString(authToken);
    const { results } = await env.DB.prepare(
      `SELECT u.id, u.username, u.name, u.email, u.role, u.is_active
       FROM users u 
       JOIN user_sessions s ON u.id = s.user_id 
       WHERE s.token_hash = ? AND s.expires_at > datetime('now') 
         AND u.is_active = TRUE AND u.deleted_at IS NULL`
    ).bind(tokenHash).all();

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

// 检查是否应该计算此次访问
async function shouldCountView(env, postSlug, user, userIP, currentTime) {
  try {
    const userId = user ? user.id : null;
    
    // 查询现有访问记录
    let query, bindings;
    if (userId) {
      // 登录用户：优先按用户ID查询
      query = `SELECT view_count, last_viewed_at FROM view_records 
               WHERE post_slug = ? AND user_id = ?`;
      bindings = [postSlug, userId];
    } else {
      // 未登录用户：按IP地址查询
      query = `SELECT view_count, last_viewed_at FROM view_records 
               WHERE post_slug = ? AND user_ip = ? AND user_id IS NULL`;
      bindings = [postSlug, userIP];
    }
    
    const { results } = await env.DB.prepare(query).bind(...bindings).all();

    if (results.length === 0) {
      // 首次访问，创建记录
      await env.DB.prepare(
        `INSERT INTO view_records (post_slug, user_id, user_ip, view_count, last_viewed_at) 
         VALUES (?, ?, ?, 1, ?)`
      ).bind(postSlug, userId, userIP, currentTime).run();
      return true;
    }

    const record = results[0];
    const lastViewTime = new Date(record.last_viewed_at);
    const currentDateTime = new Date(currentTime);
    const timeDiffSeconds = (currentDateTime - lastViewTime) / 1000;

    // 检查是否在10秒内重复访问
    if (timeDiffSeconds < 10) {
      console.log(`访问间隔过短: ${timeDiffSeconds}秒，不计算此次访问`);
      return false;
    }

    // 检查是否已达到5次访问上限
    if (record.view_count >= 5) {
      console.log(`访问次数已达上限: ${record.view_count}次，不计算此次访问`);
      return false;
    }

    // 更新访问记录
    let updateQuery, updateBindings;
    if (userId) {
      updateQuery = `UPDATE view_records 
                     SET view_count = view_count + 1, last_viewed_at = ? 
                     WHERE post_slug = ? AND user_id = ?`;
      updateBindings = [currentTime, postSlug, userId];
    } else {
      updateQuery = `UPDATE view_records 
                     SET view_count = view_count + 1, last_viewed_at = ? 
                     WHERE post_slug = ? AND user_ip = ? AND user_id IS NULL`;
      updateBindings = [currentTime, postSlug, userIP];
    }
    
    await env.DB.prepare(updateQuery).bind(...updateBindings).run();

    return true;
  } catch (error) {
    console.error('Should count view error:', error);
    // 出错时默认不计算，避免刷量
    return false;
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

// 增加浏览量（防刷版本：10秒内重复访问只算1次，最多5次）
export async function onRequestPost(context) {
  const { params, env, request } = context;
  const slug = params.slug;

  try {
    const shanghaiTime = getShanghaiTimeISO();
    
    // 获取用户信息（登录用户或IP地址）
    const user = await getCurrentUser(request, env);
    const userIP = request.headers.get('CF-Connecting-IP') || 
                   request.headers.get('X-Forwarded-For') || 
                   'unknown';
    
    // 检查访问记录
    const shouldCount = await shouldCountView(env, slug, user, userIP, shanghaiTime);
    
    if (shouldCount) {
      // 增加浏览量
      await env.DB.prepare(
        `INSERT INTO post_stats (post_slug, view_count, comment_count, updated_at) 
         VALUES (?, 1, 0, ?) 
         ON CONFLICT(post_slug) 
         DO UPDATE SET view_count = view_count + 1, updated_at = ?`
      ).bind(slug, shanghaiTime, shanghaiTime).run();

      // 更新网站总访问量
      await env.DB.prepare(
        "UPDATE site_stats SET total_visits = total_visits + 1, updated_at = ?"
      ).bind(shanghaiTime).run();
    }

    // 返回更新后的统计
    const { results } = await env.DB.prepare(
      "SELECT view_count, comment_count FROM post_stats WHERE post_slug = ?"
    ).bind(slug).all();

    return Response.json({
      ...results[0] || { view_count: 0, comment_count: 0 },
      counted: shouldCount
    });
  } catch (error) {
    console.error('Error updating stats:', error);
    return Response.json(
      { error: "Failed to update stats" }, 
      { status: 500 }
    );
  }
} 