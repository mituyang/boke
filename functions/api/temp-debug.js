export async function onRequestGet({ request, env }) {
  try {
    const authHeader = request.headers.get('Cookie');
    const tokenMatch = authHeader ? authHeader.match(/auth-token=([^;]+)/) : null;
    
    if (!tokenMatch) {
      return new Response(JSON.stringify({ error: 'No token found' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = tokenMatch[1];
    
    // 哈希函数
    const hashString = async (str) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hash = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hash));
      return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    };

    const tokenHash = await hashString(token);
    
    // 首先检查user_sessions表是否存在
    const checkTableQuery = `SELECT name FROM sqlite_master WHERE type='table' AND name='user_sessions'`;
    const tableExists = await env.DB.prepare(checkTableQuery).first();
    
    // 检查会话
    const sessionQuery = `
      SELECT s.user_id, s.expires_at, u.username, u.role 
      FROM user_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.token_hash = ?
      LIMIT 1
    `;
    
    const session = await env.DB.prepare(sessionQuery).bind(tokenHash).first();
    
    return new Response(JSON.stringify({
      success: true,
      debug: {
        hasToken: true,
        tokenLength: token.length,
        tokenHashLength: tokenHash.length,
        tableExists: !!tableExists,
        sessionFound: !!session,
        sessionData: session,
        currentTime: new Date().toISOString()
      }
    }, null, 2), {
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