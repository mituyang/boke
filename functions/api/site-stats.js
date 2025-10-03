// 获取网站全局统计信息
export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 获取网站总统计
    const { results: siteStats } = await env.DB.prepare(
      "SELECT total_visits, total_comments, total_likes, total_user_posts FROM site_stats LIMIT 1"
    ).all();

    // 获取帖子统计
    const { results: postStats } = await env.DB.prepare(
      "SELECT COUNT(*) as total_posts, SUM(view_count) as total_views, SUM(comment_count) as total_post_comments, SUM(like_count) as total_post_likes FROM post_stats"
    ).all();

    // 获取最受欢迎的帖子
    const { results: popularPosts } = await env.DB.prepare(
      "SELECT post_slug, view_count, comment_count, like_count FROM post_stats ORDER BY view_count DESC LIMIT 5"
    ).all();

    // 获取最近的评论
    const { results: recentComments } = await env.DB.prepare(
      `SELECT post_slug, user_name, content, created_at 
       FROM comments 
       WHERE is_approved = TRUE 
       ORDER BY created_at DESC 
       LIMIT 5`
    ).all();

    return Response.json({
      site: siteStats[0] || { total_visits: 0, total_comments: 0, total_likes: 0, total_user_posts: 0 },
      posts: postStats[0] || { total_posts: 0, total_views: 0, total_post_comments: 0, total_post_likes: 0 },
      popular_posts: popularPosts,
      recent_comments: recentComments
    });
  } catch (error) {
    console.error('Error fetching site stats:', error);
    return Response.json(
      { error: "Failed to fetch site statistics" }, 
      { status: 500 }
    );
  }
} 