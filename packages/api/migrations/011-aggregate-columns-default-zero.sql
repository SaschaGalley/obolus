-- The 6 denormalized aggregate columns on obulus_projects and obulus_clients
-- inherited from the legacy Laravel schema were declared NOT NULL but
-- without a DEFAULT. TypeORM's `repo.save(projectRepo.create({...}))` issues
-- `INSERT … VALUES (DEFAULT, …)` for unspecified columns, which MariaDB
-- rejects with `ER_NO_DEFAULT_FOR_FIELD` on the first such column.
--
-- Fix: explicit DEFAULT 0. Matches the immediately-following recalculate*()
-- pass that overwrites these values from live aggregates anyway.
--
-- Idempotent at the column-definition level (SET DEFAULT is a no-op when the
-- column already has that default).

ALTER TABLE obulus_projects
  MODIFY COLUMN unbilled_cost     DECIMAL(8,2) NOT NULL DEFAULT 0,
  MODIFY COLUMN unbilled_duration DECIMAL(8,2) NOT NULL DEFAULT 0,
  MODIFY COLUMN billed_cost       DECIMAL(8,2) NOT NULL DEFAULT 0,
  MODIFY COLUMN billed_duration   DECIMAL(8,2) NOT NULL DEFAULT 0,
  MODIFY COLUMN total_cost        DECIMAL(8,2) NOT NULL DEFAULT 0,
  MODIFY COLUMN total_duration    DECIMAL(8,2) NOT NULL DEFAULT 0;

ALTER TABLE obulus_clients
  MODIFY COLUMN unbilled_cost     DECIMAL(8,2) NOT NULL DEFAULT 0,
  MODIFY COLUMN unbilled_duration DECIMAL(8,2) NOT NULL DEFAULT 0,
  MODIFY COLUMN billed_cost       DECIMAL(8,2) NOT NULL DEFAULT 0,
  MODIFY COLUMN billed_duration   DECIMAL(8,2) NOT NULL DEFAULT 0,
  MODIFY COLUMN total_cost        DECIMAL(8,2) NOT NULL DEFAULT 0,
  MODIFY COLUMN total_duration    DECIMAL(8,2) NOT NULL DEFAULT 0;
