// 获取文章评论
export async function onRequestGet(context) {
  const { params, env } = context;
  const slug = params.slug;

  try {
    const { results } = await env.DB.prepare(
      `SELECT id, user_name, content, created_at, parent_id 
       FROM comments 
       WHERE post_slug = ? AND is_approved = TRUE 
       ORDER BY created_at ASC`
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
      { error: "Failed to fetch comments" }, 
      { status: 500 }
    );
  }
}

// 添加新评论
export async function onRequestPost(context) {
  const { params, env, request } = context;
  const slug = params.slug;

  try {
    const { name, email, content, parent_id } = await request.json();

    // 基本验证
    if (!name || !email || !content) {
      return Response.json(
        { error: "姓名、邮箱和内容都是必填的" }, 
        { status: 400 }
      );
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: "请输入有效的邮箱地址" }, 
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

    // 插入评论 (默认需要审核)
    const { success } = await env.DB.prepare(
      `INSERT INTO comments (post_slug, user_name, user_email, content, parent_id, is_approved) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(slug, name, email, content, parent_id || null, true).run(); // 暂时自动审核通过

    if (success) {
      // 更新文章评论数量
      await env.DB.prepare(
        `INSERT INTO post_stats (post_slug, view_count, comment_count) 
         VALUES (?, 0, 1) 
         ON CONFLICT(post_slug) 
         DO UPDATE SET comment_count = comment_count + 1, updated_at = CURRENT_TIMESTAMP`
      ).bind(slug).run();

      // 更新网站总评论数
      await env.DB.prepare(
        "UPDATE site_stats SET total_comments = total_comments + 1, updated_at = CURRENT_TIMESTAMP"
      ).run();

      return Response.json({ 
        message: "评论添加成功！", 
        success: true 
      });
    } else {
      return Response.json(
        { error: "评论添加失败" }, 
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