-- Rename reserved keyword 'use' column to 'is_active' in tasks and sessions
-- MariaDB 10.5+ automatically updates index references on RENAME COLUMN
ALTER TABLE obulus_tasks    RENAME COLUMN `use` TO is_active;
ALTER TABLE obulus_sessions RENAME COLUMN `use` TO is_active;
