-- 创建访问记录表，用于防刷功能
CREATE TABLE IF NOT EXISTS view_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT NOT NULL,
  user_id INTEGER,
  user_ip TEXT,
  view_count INTEGER DEFAULT 1,
  last_viewed_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(post_slug, user_id, user_ip)
);

-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_view_records_post_slug ON view_records(post_slug);
CREATE INDEX IF NOT EXISTS idx_view_records_user_id ON view_records(user_id);
CREATE INDEX IF NOT EXISTS idx_view_records_ip ON view_records(user_ip);
CREATE INDEX IF NOT EXISTS idx_view_records_last_viewed ON view_records(last_viewed_at); 