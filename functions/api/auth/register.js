// 用户注册
export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const requestData = await request.json();
    let { nickname, userId, email, password, confirmPassword, encrypted } = requestData;

    // 如果数据已加密，先解密
    if (encrypted) {
      nickname = decryptData(nickname);
      userId = decryptData(userId);
      email = decryptData(email);
      password = decryptData(password);
      confirmPassword = decryptData(confirmPassword);
    }

    // 基本验证
    if (!nickname || !userId || !email || !password || !confirmPassword) {
      return Response.json(
        { error: "所有字段都是必填的" }, 
        { status: 400 }
      );
    }

    // 验证密码
    if (password !== confirmPassword) {
      return Response.json(
        { error: "两次输入的密码不一致" }, 
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { error: "密码长度至少为6位" }, 
        { status: 400 }
      );
    }

    // 验证用户ID格式
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(userId)) {
      return Response.json(
        { error: "用户ID只能包含字母、数字和下划线，长度3-20位" }, 
        { status: 400 }
      );
    }

    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { error: "请输入有效的邮箱地址" }, 
        { status: 400 }
      );
    }

    // 检查用户ID是否已存在
    const existingUser = await env.DB.prepare(
      "SELECT id FROM users WHERE username = ?"
    ).bind(userId).first();

    if (existingUser) {
      return Response.json(
        { error: "用户ID已存在" }, 
        { status: 409 }
      );
    }

    // 检查邮箱是否已存在
    const existingEmail = await env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(email).first();

    if (existingEmail) {
      return Response.json(
        { error: "邮箱已被注册" }, 
        { status: 409 }
      );
    }

    // 哈希密码
    const passwordHash = await hashString(password);

    // 创建用户
    const result = await env.DB.prepare(
      "INSERT INTO users (username, name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 'user', TRUE)"
    ).bind(userId, nickname, email, passwordHash).run();

    return Response.json({
      success: true,
      message: "注册成功！请登录您的账号",
      userId: result.meta.last_row_id
    });

  } catch (error) {
    console.error('Register error:', error);
    return Response.json(
      { error: "注册失败，请稍后重试" }, 
      { status: 500 }
    );
  }
}

// 哈希函数
async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

// 服务端解密函数
function decryptData(encryptedData) {
  try {
    // 从base64解码
    const binaryString = atob(encryptedData);
    const combined = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      combined[i] = binaryString.charCodeAt(i);
    }
    
    // 提取盐值和加密数据
    const salt = combined.slice(0, 16);
    const encrypted = combined.slice(16);
    
    // 解密
    const decrypted = new Uint8Array(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ salt[i % salt.length];
    }
    
    // 转换为字符串
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData; // 解密失败时返回原数据
  }
}

 