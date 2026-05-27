-- Full cascade recompute of denormalized aggregates:
--   1. obulus_tasks.calculated_cost  (per-task cached cost)
--   2. obulus_invoices.calculated_cost (sum of billed tasks)
--   3. obulus_projects.*_cost / *_duration (sum of tasks per project)
--   4. obulus_clients.*_cost / *_duration  (sum of tasks per client's projects)
--
-- Migration 008 only refreshed steps 3+4 from the existing task.calculated_cost
-- values — but those themselves can be stale (e.g. when a session's duration
-- was edited but the per-task recalc trigger didn't fire, or when an hourly
-- rate change wasn't propagated). Result: stale-on-stale, garbage out.
--
-- This migration recomputes from the canonical source (sessions + task fixed
-- fields + hourly-rate hierarchy) using live SQL — no stale cache anywhere.
-- Idempotent. Safe to re-run any time.

-- ─────────────────────────────────────────────────────────────────────────
-- Step 1: rebuild obulus_tasks.calculated_cost from live data.
--
-- Cost formula (matches taskCalculations.ts::getTaskCost):
--   fixed_cost                           if set,
--   else duration * resolved_hourly_rate
-- where:
--   duration            = fixed_duration ?? SUM(active sessions.duration) ?? 0
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
