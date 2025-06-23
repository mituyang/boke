-- 修复现有用户的时间字段，将UTC时间转换为上海时区时间

-- 对于没有updated_at的用户，设置为created_at + 8小时（转换为上海时区）
UPDATE users 
SET updated_at = datetime(created_at, '+8 hours')
WHERE updated_at IS NULL OR updated_at = '';

-- 对于所有用户，将created_at和updated_at转换为上海时区时间
-- 注意：这里假设现有时间都是UTC时间，需要加8小时转换为上海时区
UPDATE users 
SET 
  created_at = datetime(created_at, '+8 hours'),
  updated_at = datetime(updated_at, '+8 hours')
WHERE created_at IS NOT NULL AND updated_at IS NOT NULL;

-- 如果last_login存在，也转换为上海时区
UPDATE users 
SET last_login = datetime(last_login, '+8 hours')
WHERE last_login IS NOT NULL AND last_login != ''; 