-- Heal stale `unbilled_cost`/`billed_cost`/`unbilled_duration`/`billed_duration`
-- aggregates on obulus_projects and obulus_clients. These get out of sync
-- whenever invoices were created prior to the fix in invoices.service.ts
-- (the bulk task-assignment UPDATE didn't trigger a project/client recalc).
--
-- Idempotent: pure aggregate recompute from the canonical source
-- (obulus_tasks + obulus_sessions). Safe to re-run.
--
-- Strategy: one-shot UPDATE with correlated aggregate subqueries, instead
-- of looping per row. Single SQL roundtrip per table.

-- ─────────────────────────────────────────────────────────────────────────
-- obulus_projects: rebuild from tasks (+ sessions for duration fallback)
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
-- obulus_clients: rebuild from tasks across all their projects
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
