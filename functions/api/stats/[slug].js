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

// 增加浏览量
export async function onRequestPost(context) {
  const { params, env } = context;
  const slug = params.slug;

  try {
    // 增加浏览量
    await env.DB.prepare(
      `INSERT INTO post_stats (post_slug, view_count, comment_count) 
       VALUES (?, 1, 0) 
       ON CONFLICT(post_slug) 
       DO UPDATE SET view_count = view_count + 1, updated_at = CURRENT_TIMESTAMP`
    ).bind(slug).run();

    // 更新网站总访问量
    await env.DB.prepare(
      "UPDATE site_stats SET total_visits = total_visits + 1, updated_at = CURRENT_TIMESTAMP"
    ).run();

    // 返回更新后的统计
    const { results } = await env.DB.prepare(
      "SELECT view_count, comment_count FROM post_stats WHERE post_slug = ?"
    ).bind(slug).all();

    return Response.json(results[0] || { view_count: 1, comment_count: 0 });
  } catch (error) {
    console.error('Error updating stats:', error);
    return Response.json(
      { error: "Failed to update stats" }, 
      { status: 500 }
    );
  }
} 