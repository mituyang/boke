-- 更新评论表以支持用户关联
-- 添加 user_id 字段并建立外键关系

-- 添加 user_id 字段（如果不存在）
ALTER TABLE comments ADD COLUMN user_id INTEGER;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- 清理现有的无用户关联的评论
DELETE FROM comments WHERE user_id IS NULL; 