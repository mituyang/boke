import { getUserFromToken } from '../auth/me.js';

// 获取上海时区时间
function getShanghaiTimeISO() {
  const now = new Date();
  const shanghaiTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // UTC+8
  return shanghaiTime.toISOString().replace('T', ' ').substring(0, 19);
}

export async function onRequestPost(context) {
  try {
    const { request, env, params } = context;
    const targetUsername = params.username;
    
    // 验证用户身份
    const currentUser = await getUserFromToken(request, env);
    if (!currentUser.success) {
      return new Response(JSON.stringify({
        success: false,
        message: '请先登录'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取目标用户信息
    const targetUserResult = await env.DB.prepare(
      'SELECT id, username, name as display_name FROM users WHERE username = ? AND deleted_at IS NULL'
    ).bind(targetUsername).first();

    if (!targetUserResult) {
      return new Response(JSON.stringify({
        success: false,
        message: '用户不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 不能关注自己
    if (currentUser.user.id === targetUserResult.id) {
      return new Response(JSON.stringify({
        success: false,
        message: '不能关注自己'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查是否已经关注
    const existingFollow = await env.DB.prepare(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?'
    ).bind(currentUser.user.id, targetUserResult.id).first();

    if (existingFollow) {
      // 取消关注
      await env.DB.prepare(
        'DELETE FROM follows WHERE follower_id = ? AND following_id = ?'
      ).bind(currentUser.user.id, targetUserResult.id).run();

      // 更新关注数和粉丝数
      await env.DB.batch([
        env.DB.prepare('UPDATE users SET following_count = following_count - 1 WHERE id = ?')
          .bind(currentUser.user.id),
        env.DB.prepare('UPDATE users SET followers_count = followers_count - 1 WHERE id = ?')
          .bind(targetUserResult.id)
      ]);

      return new Response(JSON.stringify({
        success: true,
        action: 'unfollow',
        message: `已取消关注 ${targetUserResult.display_name || targetUserResult.username}`
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } else {
      // 添加关注
      await env.DB.prepare(
        'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)'
      ).bind(currentUser.user.id, targetUserResult.id).run();

      // 更新关注数和粉丝数
      await env.DB.batch([
        env.DB.prepare('UPDATE users SET following_count = following_count + 1 WHERE id = ?')
          .bind(currentUser.user.id),
        env.DB.prepare('UPDATE users SET followers_count = followers_count + 1 WHERE id = ?')
          .bind(targetUserResult.id)
      ]);

      // 创建关注通知
      const currentTime = getShanghaiTimeISO();
      await env.DB.prepare(`
        INSERT INTO notifications (user_id, type, title, content, source_user_id, created_at)
        VALUES (?, 'follow', ?, ?, ?, ?)
      `).bind(
        targetUserResult.id,
        '新关注',
        `${currentUser.user.display_name || currentUser.user.username} 关注了你`,
        currentUser.user.id,
        currentTime
      ).run();

      return new Response(JSON.stringify({
        success: true,
        action: 'follow',
        message: `已关注 ${targetUserResult.display_name || targetUserResult.username}`
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('关注操作失败:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '操作失败，请稍后重试'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 获取关注状态
export async function onRequestGet(context) {
  try {
    const { request, env, params } = context;
    const targetUsername = params.username;
    
    // 验证用户身份
    const currentUser = await getUserFromToken(request, env);
    if (!currentUser.success) {
      return new Response(JSON.stringify({
        success: false,
        message: '请先登录'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取目标用户信息
    const targetUserResult = await env.DB.prepare(
      'SELECT id, username, name as display_name, followers_count, following_count FROM users WHERE username = ? AND deleted_at IS NULL'
    ).bind(targetUsername).first();

    if (!targetUserResult) {
      return new Response(JSON.stringify({
        success: false,
        message: '用户不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查是否已关注
    const isFollowing = await env.DB.prepare(
      'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?'
    ).bind(currentUser.user.id, targetUserResult.id).first();

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: targetUserResult.id,
        username: targetUserResult.username,
        displayName: targetUserResult.display_name,
        followersCount: targetUserResult.followers_count || 0,
        followingCount: targetUserResult.following_count || 0
      },
      isFollowing: !!isFollowing,
      canFollow: currentUser.user.id !== targetUserResult.id
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('获取关注状态失败:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '获取信息失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 