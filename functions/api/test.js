export async function onRequestGet({ request, env }) {
  try {
    const response = {
      success: true,
      message: 'API正常工作',
      environment: {
        hasDB: !!env.DB,
        envKeys: Object.keys(env),
        url: request.url,
        timestamp: new Date().toISOString()
      }
    };

    // 如果数据库可用，测试数据库连接
    if (env.DB) {
      try {
        const testQuery = `SELECT COUNT(*) as count FROM users`;
        const result = await env.DB.prepare(testQuery).first();
        response.database = {
          connected: true,
          userCount: result.count
        };
      } catch (dbError) {
        response.database = {
          connected: false,
          error: dbError.message
        };
      }
    }

    return new Response(JSON.stringify(response, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 