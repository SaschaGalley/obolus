-- Replace the `archived` boolean on obulus_projects with a 3-value lifecycle
-- enum: quoted → active → archived. Backfill: archived=1 → status='archived',
-- everything else → status='active' (default for legacy data).
--
-- The new `quoted` status is for projects that exist only as offers — their
-- tasks are estimates, must NOT count toward unbilled/billed aggregates,
-- and invoices can't be created against them yet.

ALTER TABLE obulus_projects
  ADD COLUMN status ENUM('quoted','active','archived') NOT NULL DEFAULT 'active' AFTER hourly_rate;

UPDATE obulus_projects SET status = 'archived' WHERE archived = 1;

-- Drop the old archived index + column (status takes over).
ALTER TABLE obulus_projects DROP INDEX idx_projects_client_archived;
ALTER TABLE obulus_projects DROP INDEX idx_projects_archived_unbilled;
ALTER TABLE obulus_projects DROP INDEX idx_projects_client_archived_name;
ALTER TABLE obulus_projects DROP COLUMN archived;

-- New indexes for the status-based queries that replaced the archived ones.
CREATE INDEX idx_projects_client_status_name ON obulus_projects (client_id, status, name);
CREATE INDEX idx_projects_status_unbilled    ON obulus_projects (status, unbilled_cost);
