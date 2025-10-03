-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 帖子统计表
CREATE TABLE IF NOT EXISTS post_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT UNIQUE NOT NULL,
  view_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id INTEGER NULL, -- 用于回复功能
  is_approved BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES comments (id)
);

-- 网站统计表
CREATE TABLE IF NOT EXISTS site_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  total_visits INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 初始化网站统计数据
INSERT INTO site_stats (total_visits, total_comments) VALUES (0, 0);

-- 为现有帖子创建统计记录
INSERT OR IGNORE INTO post_stats (post_slug, view_count, comment_count) VALUES 
  ('hello-world', 0, 0),
  ('getting-started-with-nextjs', 0, 0),  
  ('thoughts-on-web-development', 0, 0);

-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_comments_post_slug ON comments(post_slug);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
CREATE INDEX IF NOT EXISTS idx_post_stats_slug ON post_stats(post_slug); 