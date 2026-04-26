-- The dump references database d025d88e (the production DB name).
-- We create it here so the dump's USE statement works, then we'll
-- use it as our working database. The MARIADB_DATABASE=obulus from
-- docker-compose also exists but we use d025d88e to match the dump.
CREATE DATABASE IF NOT EXISTS `d025d88e` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON `d025d88e`.* TO 'obulus'@'%';
FLUSH PRIVILEGES;
