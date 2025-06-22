-- 添加软删除字段到用户表
ALTER TABLE users ADD COLUMN deleted_at TEXT NULL;

-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at); 