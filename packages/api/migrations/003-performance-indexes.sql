-- Performance indexes – batch 2
-- All statements are idempotent (CREATE INDEX IF NOT EXISTS).
-- Safe to re-run at any time.

-- ─────────────────────────────────────────────────────────────────────────────
-- obulus_sessions
-- ─────────────────────────────────────────────────────────────────────────────

-- Hot path: sessions are always fetched by task and sorted by date.
-- Replaces the narrow single-column idx_sessions_task (still kept for FK guard).
-- Covers:  SELECT … FROM obulus_sessions WHERE task_id = ? ORDER BY started_at DESC
CREATE INDEX IF NOT EXISTS idx_sessions_task_started
  ON obulus_sessions (task_id, started_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- obulus_tasks
-- ─────────────────────────────────────────────────────────────────────────────

-- Open-tasks query (project detail load + invoice creation):
--   WHERE project_id = ? AND invoice_id IS NULL AND is_active = 1 ORDER BY `order`
-- Covers both the filter and the sort in a single index scan.
-- (Supersedes the narrower idx_tasks_project_use_invoice for this query shape.)
CREATE INDEX IF NOT EXISTS idx_tasks_open_ordered
  ON obulus_tasks (project_id, is_active, invoice_id, `order`);

-- ─────────────────────────────────────────────────────────────────────────────
-- obulus_projects
-- ─────────────────────────────────────────────────────────────────────────────

-- Dashboard "unverrechnete Projekte":
--   WHERE archived = 0 AND unbilled_cost > 0 ORDER BY unbilled_cost DESC
-- Avoids a full table scan when picking open projects across all clients.
CREATE INDEX IF NOT EXISTS idx_projects_archived_unbilled
  ON obulus_projects (archived, unbilled_cost);

-- Project list (client detail, projects list page):
--   WHERE client_id = ? AND archived = ? ORDER BY name
-- Merges idx_projects_client_archived + idx_projects_client_name into one
-- 3-column covering index that satisfies both the equality filter and the sort.
CREATE INDEX IF NOT EXISTS idx_projects_client_archived_name
  ON obulus_projects (client_id, archived, name);

-- ─────────────────────────────────────────────────────────────────────────────
-- obulus_clients
-- ─────────────────────────────────────────────────────────────────────────────

-- Client list page + project JOIN guard:
--   WHERE user_id = ? AND archived = ? ORDER BY name
-- Merges idx_clients_user_archived + idx_clients_user_name into one index
-- so the list query needs a single index scan instead of two.
CREATE INDEX IF NOT EXISTS idx_clients_user_archived_name
  ON obulus_clients (user_id, archived, name);

-- ─────────────────────────────────────────────────────────────────────────────
-- obulus_invoices
-- ─────────────────────────────────────────────────────────────────────────────

-- Dashboard "unbezahlte Rechnungen" + invoice list ORDER BY:
--   WHERE client_id = ? AND payed_at IS NULL AND sent_at IS NOT NULL ORDER BY sent_at
-- The existing idx_invoices_client_sent (client_id, sent_at) covers client+sort
-- but forces a post-filter on payed_at.  Adding payed_at as 2nd column lets
-- MySQL satisfy the IS NULL range without a separate filter step.
CREATE INDEX IF NOT EXISTS idx_invoices_client_payed_sent
  ON obulus_invoices (client_id, payed_at, sent_at);

-- Revenue queries (dashboard + accounting):
--   WHERE payed_at IS NOT NULL AND YEAR(payed_at) = ?
-- YEAR() wrapping prevents a full range scan, but the index still lets MySQL
-- skip all NULL rows in one step rather than scanning the whole table.
CREATE INDEX IF NOT EXISTS idx_invoices_payed_at
  ON obulus_invoices (payed_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- obulus_activity
-- ─────────────────────────────────────────────────────────────────────────────

-- Client activity feed:
--   WHERE (logable_type, logable_id) IN (…) ORDER BY created_at DESC
-- The separate idx_activity_logable + idx_activity_created indexes force MySQL
-- to merge two index scans.  A single 3-column covering index lets it do one
-- index range scan and deliver rows pre-sorted by date with no filesort.
CREATE INDEX IF NOT EXISTS idx_activity_logable_created
  ON obulus_activity (logable_type, logable_id, created_at);
