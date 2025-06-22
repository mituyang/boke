-- 005-likes-and-posts.sql
-- 添加点赞功能和用户发文章功能

-- 点赞表
CREATE TABLE IF NOT EXISTS post_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_slug TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(post_slug, user_id)
);

-- 用户发布的文章表
CREATE TABLE IF NOT EXISTS user_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id INTEGER NOT NULL,
    status TEXT DEFAULT 'draft', -- draft, published, deleted
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now')),
    published_at DATETIME,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- 为点赞表创建索引
CREATE INDEX IF NOT EXISTS idx_post_likes_post_slug ON post_likes(post_slug);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- 为用户文章表创建索引
CREATE INDEX IF NOT EXISTS idx_user_posts_slug ON user_posts(slug);
CREATE INDEX IF NOT EXISTS idx_user_posts_author ON user_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_user_posts_status ON user_posts(status);
CREATE INDEX IF NOT EXISTS idx_user_posts_published ON user_posts(published_at);

-- 更新原有文章统计表，添加点赞数
ALTER TABLE post_stats ADD COLUMN like_count INTEGER DEFAULT 0;

-- 更新网站统计表，添加点赞和用户文章统计
ALTER TABLE site_stats ADD COLUMN total_likes INTEGER DEFAULT 0;
ALTER TABLE site_stats ADD COLUMN total_user_posts INTEGER DEFAULT 0;

-- 初始化静态文章的点赞数（设置为0）
UPDATE post_stats SET like_count = 0 WHERE like_count IS NULL;

-- 更新网站统计
UPDATE site_stats SET total_likes = 0, total_user_posts = 0; 