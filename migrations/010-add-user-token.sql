-- 为用户表添加token字段
-- 这个字段用于存储登录后的认证令牌

ALTER TABLE users ADD COLUMN token TEXT;

-- 创建token字段的索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);

-- 清理过期的会话记录（如果有的话）
DELETE FROM user_sessions WHERE expires_at < datetime('now'); 