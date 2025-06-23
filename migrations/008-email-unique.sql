-- 为用户表邮箱字段添加唯一约束
-- 注意：如果现有数据中有重复邮箱，需要先清理重复数据

-- 检查并删除重复邮箱的用户（保留最早创建的用户）
DELETE FROM users 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM users 
  WHERE deleted_at IS NULL 
  GROUP BY email
) AND deleted_at IS NULL;

-- 为邮箱字段创建唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email) WHERE deleted_at IS NULL; 