-- 006-official-posts.sql
-- 为用户文章添加官方文章标识

-- 为用户文章表添加is_official字段
ALTER TABLE user_posts ADD COLUMN is_official BOOLEAN DEFAULT FALSE;

-- 创建索引以提高查询性能
CREATE INDEX idx_user_posts_is_official ON user_posts(is_official);

-- 创建复合索引用于官方文章查询
CREATE INDEX idx_user_posts_official_status ON user_posts(is_official, status, published_at); 