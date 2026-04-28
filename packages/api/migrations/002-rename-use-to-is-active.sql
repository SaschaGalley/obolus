-- Rename reserved keyword 'use' column to 'is_active' in tasks and sessions
-- Idempotent: checks information_schema before renaming

SET @sql = (
  SELECT IF(COUNT(*) > 0,
    'ALTER TABLE obulus_tasks RENAME COLUMN `use` TO is_active',
    'SELECT ''tasks: use column already renamed''')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'obulus_tasks'
    AND COLUMN_NAME = 'use'
);
PREPARE _stmt FROM @sql;
EXECUTE _stmt;
DEALLOCATE PREPARE _stmt;

SET @sql = (
  SELECT IF(COUNT(*) > 0,
    'ALTER TABLE obulus_sessions RENAME COLUMN `use` TO is_active',
    'SELECT ''sessions: use column already renamed''')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'obulus_sessions'
    AND COLUMN_NAME = 'use'
);
PREPARE _stmt FROM @sql;
EXECUTE _stmt;
DEALLOCATE PREPARE _stmt;
