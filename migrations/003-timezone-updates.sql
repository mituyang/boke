-- 添加更新时间字段和时区支持
-- 这个迁移文件确保所有表都有 updated_at 字段

-- 检查并添加 updated_at 字段到 users 表
ALTER TABLE users ADD COLUMN updated_at TEXT;

-- 检查并添加 updated_at 字段到 post_stats 表
ALTER TABLE post_stats ADD COLUMN updated_at TEXT;

-- 检查并添加 updated_at 字段到 comments 表
ALTER TABLE comments ADD COLUMN updated_at TEXT;

-- 更新所有现有记录的时间戳为上海时区格式
UPDATE users SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE post_stats SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE comments SET updated_at = created_at WHERE updated_at IS NULL; 