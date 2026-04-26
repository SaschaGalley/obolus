import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(private readonly dataSource: DataSource) {}

  async getStats(userId: number, year?: number) {
    let yearFilterTasks = '';
    let yearFilterSentAt = '';
    let yearFilterPayedAt = '';
    const params: any[] = [userId];

    if (year) {
      yearFilterTasks = 'AND YEAR(tasks.created_at) = ?';
      yearFilterSentAt = 'AND YEAR(invoices.sent_at) = ?';
      yearFilterPayedAt = 'AND YEAR(invoices.payed_at) = ?';
    }

    // Unpaid invoices (sent but not paid)
    const unpaidInvoices = await this.dataSource.query(
      `SELECT i.id, i.number, i.calculated_cost AS calculatedCost,
              i.sent_at AS sentAt, i.due_days AS dueDays, i.payed_at AS payedAt,
              i.client_id AS clientId, c.name AS clientName
       FROM obulus_invoices i
       INNER JOIN obulus_clients c ON c.id = i.client_id
       WHERE c.user_id = ? AND i.payed_at IS NULL AND i.sent_at IS NOT NULL
       ORDER BY i.sent_at ASC`,
      [userId],
    );

    // Open projects (unbilled tasks with cost > 0)
    const openProjects = await this.dataSource.query(
      `SELECT p.id, p.name, p.unbilled_cost AS unbilled, p.unbilled_duration AS unbilledDuration,
              p.client_id AS clientId, c.name AS clientName
       FROM obulus_projects p
       INNER JOIN obulus_clients c ON c.id = p.client_id
       WHERE c.user_id = ? AND p.archived = 0 AND c.archived = 0 AND p.unbilled_cost > 0
       ORDER BY p.unbilled_cost DESC`,
      [userId],
    );

    const unpaidInvoicesTotal = unpaidInvoices.reduce(
      (sum: number, i: any) => sum + Number(i.calculatedCost || 0),
      0,
    );
    const openProjectsCount = openProjects.length;

    // Revenue (paid invoices in year)
    let revenueQuery = `SELECT IFNULL(SUM(i.calculated_cost), 0) AS total
      FROM obulus_invoices i
      INNER JOIN obulus_clients c ON c.id = i.client_id
      WHERE c.user_id = ? AND i.payed_at IS NOT NULL`;
    const revenueParams: any[] = [userId];
    if (year) {
      revenueQuery += ' AND YEAR(i.payed_at) = ?';
      revenueParams.push(year);
    }
    const [revenueResult] = await this.dataSource.query(revenueQuery, revenueParams);

    const query = `
      SELECT *, IFNULL(payed, 0) + IFNULL(unpayed, 0) + IFNULL(unbilled, 0) AS total
      FROM (
        SELECT
          clients.id,
          clients.name,
          clients.archived,
          IFNULL((
            SELECT SUM(tasks.calculated_cost)
            FROM obulus_tasks AS tasks
            INNER JOIN obulus_projects AS projects ON projects.id = tasks.project_id
            WHERE projects.client_id = clients.id
              AND invoice_id IS NULL
              AND tasks.use = 1
              ${yearFilterTasks}
          ), 0) AS unbilled,
          IFNULL((
            SELECT SUM(invoices.calculated_cost)
            FROM obulus_invoices AS invoices
            WHERE invoices.client_id = clients.id
              ${yearFilterSentAt}
          ), 0) AS billed,
          IFNULL((
            SELECT SUM(invoices.calculated_cost)
            FROM obulus_invoices AS invoices
            WHERE invoices.client_id = clients.id
              AND invoices.payed_at IS NOT NULL
              ${yearFilterPayedAt}
          ), 0) AS payed,
          IFNULL((
            SELECT SUM(invoices.calculated_cost)
            FROM obulus_invoices AS invoices
            WHERE invoices.client_id = clients.id
              AND invoices.payed_at IS NULL
              ${yearFilterSentAt}
          ), 0) AS unpayed
        FROM obulus_clients AS clients
        WHERE clients.user_id = ?
        GROUP BY clients.id
        ORDER BY clients.name
      ) calculations
      HAVING total > 0
    `;

    // Build params array: year is repeated for each subquery that needs it, then userId at the end
    const queryParams: any[] = [];
    if (year) {
      queryParams.push(year); // yearFilterTasks
      queryParams.push(year); // yearFilterSentAt (billed)
      queryParams.push(year); // yearFilterPayedAt (payed)
      queryParams.push(year); // yearFilterSentAt (unpayed)
    }
    queryParams.push(userId);

    const clients = await this.dataSource.query(query, queryParams);

    const mappedClients = clients.map((c: any) => ({
      clientId: c.id,
      clientName: c.name,
      total: Number(c.total) || 0,
      unbilled: Number(c.unbilled) || 0,
      billed: Number(c.billed) || 0,
      paid: Number(c.payed) || 0,
      outstanding: Number(c.unpayed) || 0,
    }));

    // Calculate meta totals
    const meta = {
      unbilled: 0,
      billed: 0,
      payed: 0,
      unpayed: 0,
      total: 0,
    };

    for (const client of clients) {
      meta.unbilled += Number(client.unbilled);
      meta.billed += Number(client.billed);
      meta.payed += Number(client.payed);
      meta.unpayed += Number(client.unpayed);
      meta.total += Number(client.total);
    }

    const mappedUnpaid = unpaidInvoices.map((i: any) => {
      const sent = i.sentAt ? new Date(i.sentAt) : null;
      let dueDate: string | null = null;
      let overdue = false;
      if (sent) {
        const due = new Date(sent);
        due.setDate(due.getDate() + Number(i.dueDays || 14));
        dueDate = due.toISOString().split('T')[0];
        overdue = due < new Date();
      }
      return {
        id: i.id,
        number: i.number,
        clientId: i.clientId,
        clientName: i.clientName,
        sentAt: i.sentAt,
        dueDate,
        overdue,
        amount: Number(i.calculatedCost) || 0,
      };
    });

    const mappedOpenProjects = openProjects.map((p: any) => ({
      id: p.id,
      name: p.name,
      clientId: p.clientId,
      clientName: p.clientName,
      unbilled: Number(p.unbilled) || 0,
      unbilledDuration: Number(p.unbilledDuration) || 0,
    }));

    return {
      clients: mappedClients,
      meta,
      unpaidInvoices: mappedUnpaid,
      openProjects: mappedOpenProjects,
      unpaidInvoicesTotal,
      openProjectsCount,
      revenue: Number(revenueResult.total) || 0,
      net: 0, // Calculated by accounting service on frontend
    };
  }
}
