-- Performance indexes

-- clients: filter by user + archived status, sort by name
CREATE INDEX IF NOT EXISTS idx_clients_user_archived ON obulus_clients (user_id, archived);
CREATE INDEX IF NOT EXISTS idx_clients_user_name     ON obulus_clients (user_id, name);

-- projects: filter by client + archived status, sort by name
CREATE INDEX IF NOT EXISTS idx_projects_client_archived ON obulus_projects (client_id, archived);
CREATE INDEX IF NOT EXISTS idx_projects_client_name     ON obulus_projects (client_id, name);

-- invoices: filter by client, sort by sent_at
CREATE INDEX IF NOT EXISTS idx_invoices_client_sent ON obulus_invoices (client_id, sent_at);

-- tasks: the hot path — filter by project + use + invoice
CREATE INDEX IF NOT EXISTS idx_tasks_project_use_invoice ON obulus_tasks (project_id, `use`, invoice_id);
CREATE INDEX IF NOT EXISTS idx_tasks_invoice             ON obulus_tasks (invoice_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_order       ON obulus_tasks (project_id, `order`);

-- sessions: always looked up by task
CREATE INDEX IF NOT EXISTS idx_sessions_task ON obulus_sessions (task_id);

-- activities: main lookup by logable + ordering by created_at
CREATE INDEX IF NOT EXISTS idx_activity_logable  ON obulus_activity (logable_type, logable_id);
CREATE INDEX IF NOT EXISTS idx_activity_user     ON obulus_activity (user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created  ON obulus_activity (created_at);

-- expenses: filter by user
CREATE INDEX IF NOT EXISTS idx_expenses_user_payed ON obulus_expenses (user_id, payed_at);
