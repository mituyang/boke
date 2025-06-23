-- 聊天室表
CREATE TABLE IF NOT EXISTS chat_rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'public', -- public, private
  created_by INTEGER,
  created_at TEXT DEFAULT (datetime('now', '+8 hours')),
  updated_at TEXT DEFAULT (datetime('now', '+8 hours')),
  is_active BOOLEAN DEFAULT 1,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 聊天消息表
CREATE TABLE IF NOT EXISTS chat_messages (image.png
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER DEFAULT 1,
  user_id INTEGER NOT NULL,
  username TEXT NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- text, system, image
  reply_to INTEGER, -- 回复消息ID
  created_at TEXT DEFAULT (datetime('now', '+8 hours')),
  updated_at TEXT DEFAULT (datetime('now', '+8 hours')),
  deleted_at TEXT,
  deleted_by INTEGER,
  is_edited BOOLEAN DEFAULT 0,
  FOREIGN KEY (room_id) REFERENCES chat_rooms(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (reply_to) REFERENCES chat_messages(id),
  FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- 用户聊天设置表
CREATE TABLE IF NOT EXISTS user_chat_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  notifications_enabled BOOLEAN DEFAULT 1,
  sound_enabled BOOLEAN DEFAULT 1,
  last_read_message_id INTEGER,
  created_at TEXT DEFAULT (datetime('now', '+8 hours')),
  updated_at TEXT DEFAULT (datetime('now', '+8 hours')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (last_read_message_id) REFERENCES chat_messages(id)
);

-- 插入默认的主聊天室
INSERT OR IGNORE INTO chat_rooms (id, name, description, type) 
VALUES (1, '主聊天室', '所有用户都可以参与的公共聊天室', 'public');

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_deleted ON chat_messages(deleted_at); 