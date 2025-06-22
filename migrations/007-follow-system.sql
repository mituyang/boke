-- 关注关系表
CREATE TABLE IF NOT EXISTS follows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  follower_id INTEGER NOT NULL,  -- 关注者的用户ID
  following_id INTEGER NOT NULL, -- 被关注者的用户ID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users (id) ON DELETE CASCADE,
  UNIQUE(follower_id, following_id) -- 防止重复关注
);

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,     -- 接收通知的用户ID
  type TEXT NOT NULL,           -- 通知类型: 'like', 'comment', 'follow'
  title TEXT NOT NULL,          -- 通知标题
  content TEXT NOT NULL,        -- 通知内容
  is_read BOOLEAN DEFAULT FALSE, -- 是否已读
  source_user_id INTEGER,       -- 触发通知的用户ID
  source_post_slug TEXT,        -- 相关文章slug（如果有）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (source_user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 为follows表创建索引
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- 为notifications表创建索引
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- 用户表添加粉丝数和关注数字段
ALTER TABLE users ADD COLUMN followers_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN following_count INTEGER DEFAULT 0; 