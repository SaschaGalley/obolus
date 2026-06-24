-- Re-run of the full aggregate cascade (identical to migration 009).
--
-- Why again: TasksService.update() recomputed task.calculated_cost from a
-- freshly re-fetched DB row that still held the PRE-update values, so every
-- task edit left calculated_cost one revision behind. That bug corrupted
-- calculated_cost AFTER migration 009 had already run, so the dashboard's
-- live unbilled sums (which read tasks.calculated_cost) showed stale numbers.
--
-- The write path is now fixed (cost is computed from the updated entity), so
-- this one-off rebuild restores every cached value from the canonical source.
-- Idempotent. Safe to re-run.

-- ─────────────────────────────────────────────────────────────────────────
-- Step 1: rebuild obulus_tasks.calculated_cost from live data.
--   fixed_cost                            if set,
--   else duration * resolved_hourly_rate
--   duration             = fixed_duration ?? SUM(active sessions.duration) ?? 0
--   resolved_hourly_rate = task.hourly_rate ?? project.hourly_rate ?? client.hourly_rate ?? 65
-- ─────────────────────────────────────────────────────────────────────────
UPDATE obulus_tasks t
INNER JOIN obulus_projects p ON p.id = t.project_id
INNER JOIN obulus_clients c ON c.id = p.client_id
LEFT JOIN (
  SELECT task_id, SUM(duration) AS dur
  FROM obulus_sessions WHERE is_active = 1
  GROUP BY task_id
) s_agg ON s_agg.task_id = t.id
SET t.calculated_cost = COALESCE(
  t.fixed_cost,
  COALESCE(t.fixed_duration, s_agg.dur, 0)
    * COALESCE(t.hourly_rate, p.hourly_rate, c.hourly_rate, 65)
);

-- ─────────────────────────────────────────────────────────────────────────
-- Step 2: rebuild obulus_invoices.calculated_cost from refreshed tasks.
-- ─────────────────────────────────────────────────────────────────────────
UPDATE obulus_invoices i
LEFT JOIN (
  SELECT invoice_id, COALESCE(SUM(calculated_cost), 0) AS total
  FROM obulus_tasks
  WHERE invoice_id IS NOT NULL AND is_active = 1
  GROUP BY invoice_id
) agg ON agg.invoice_id = i.id
SET i.calculated_cost = COALESCE(agg.total, 0);

-- ─────────────────────────────────────────────────────────────────────────
-- Step 3: rebuild obulus_projects aggregates from refreshed tasks.
-- ─────────────────────────────────────────────────────────────────────────
UPDATE obulus_projects p
LEFT JOIN (
  SELECT
    t.project_id,
    COALESCE(SUM(CASE WHEN t.invoice_id IS NULL     AND t.is_active = 1 THEN t.calculated_cost END), 0) AS unbilled_cost,
    COALESCE(SUM(CASE WHEN t.invoice_id IS NOT NULL AND t.is_active = 1 THEN t.calculated_cost END), 0) AS billed_cost,
    COALESCE(SUM(CASE WHEN t.invoice_id IS NULL     AND t.is_active = 1
      THEN COALESCE(t.fixed_duration, s_agg.dur, 0) END), 0) AS unbilled_duration,
    COALESCE(SUM(CASE WHEN t.invoice_id IS NOT NULL AND t.is_active = 1
      THEN COALESCE(t.fixed_duration, s_agg.dur, 0) END), 0) AS billed_duration
  FROM obulus_tasks t
  LEFT JOIN (
    SELECT task_id, SUM(duration) AS dur
    FROM obulus_sessions WHERE is_active = 1
    GROUP BY task_id
  ) s_agg ON s_agg.task_id = t.id
  GROUP BY t.project_id
) agg ON agg.project_id = p.id
SET
  p.unbilled_cost     = COALESCE(agg.unbilled_cost, 0),
  p.billed_cost       = COALESCE(agg.billed_cost, 0),
  p.unbilled_duration = COALESCE(agg.unbilled_duration, 0),
  p.billed_duration   = COALESCE(agg.billed_duration, 0),
  p.total_cost        = COALESCE(agg.unbilled_cost, 0) + COALESCE(agg.billed_cost, 0),
  p.total_duration    = COALESCE(agg.unbilled_duration, 0) + COALESCE(agg.billed_duration, 0);

-- ─────────────────────────────────────────────────────────────────────────
-- Step 4: rebuild obulus_clients aggregates from refreshed tasks.
-- ─────────────────────────────────────────────────────────────────────────
UPDATE obulus_clients c
LEFT JOIN (
  SELECT
    p.client_id,
    COALESCE(SUM(CASE WHEN t.invoice_id IS NULL     AND t.is_active = 1 THEN t.calculated_cost END), 0) AS unbilled_cost,
    COALESCE(SUM(CASE WHEN t.invoice_id IS NOT NULL AND t.is_active = 1 THEN t.calculated_cost END), 0) AS billed_cost,
    COALESCE(SUM(CASE WHEN t.invoice_id IS NULL     AND t.is_active = 1
      THEN COALESCE(t.fixed_duration, s_agg.dur, 0) END), 0) AS unbilled_duration,
    COALESCE(SUM(CASE WHEN t.invoice_id IS NOT NULL AND t.is_active = 1
      THEN COALESCE(t.fixed_duration, s_agg.dur, 0) END), 0) AS billed_duration
  FROM obulus_tasks t
  INNER JOIN obulus_projects p ON p.id = t.project_id
  LEFT JOIN (
    SELECT task_id, SUM(duration) AS dur
    FROM obulus_sessions WHERE is_active = 1
    GROUP BY task_id
  ) s_agg ON s_agg.task_id = t.id
  GROUP BY p.client_id
) agg ON agg.client_id = c.id
SET
  c.unbilled_cost     = COALESCE(agg.unbilled_cost, 0),
  c.billed_cost       = COALESCE(agg.billed_cost, 0),
  c.unbilled_duration = COALESCE(agg.unbilled_duration, 0),
  c.billed_duration   = COALESCE(agg.billed_duration, 0),
  c.total_cost        = COALESCE(agg.unbilled_cost, 0) + COALESCE(agg.billed_cost, 0),
  c.total_duration    = COALESCE(agg.unbilled_duration, 0) + COALESCE(agg.billed_duration, 0);
