import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Invoice, Expense, ExpenseType } from '../../database/entities';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    private readonly dataSource: DataSource,
  ) {}

  async getOverview(userId: number, year?: number) {
    // Build income query from payed invoices via client.userId
    let incomeQuery = `
      SELECT IFNULL(SUM(i.calculated_cost), 0) AS income
      FROM obulus_invoices AS i
      INNER JOIN obulus_clients AS c ON c.id = i.client_id
      WHERE c.user_id = ?
        AND i.payed_at IS NOT NULL
    `;
    const incomeParams: any[] = [userId];

    if (year) {
      incomeQuery += ' AND YEAR(i.payed_at) = ?';
      incomeParams.push(year);
    }

    const [incomeResult] = await this.dataSource.query(incomeQuery, incomeParams);
    const income = Number(incomeResult.income);

    // Get expenses by type
    let expenseWhere = 'user_id = ?';
    const expenseParams: any[] = [userId];

    if (year) {
      expenseWhere += ' AND YEAR(payed_at) = ?';
      expenseParams.push(year);
    }

    const expenseRows = await this.dataSource.query(
      `SELECT type, IFNULL(SUM(cost), 0) AS total
       FROM obulus_expenses
       WHERE ${expenseWhere}
       GROUP BY type`,
      expenseParams,
    );

    const expenses: Record<string, number> = {
      other: 0,
      sva: 0,
      ust: 0,
      est: 0,
    };

    for (const row of expenseRows) {
      expenses[row.type] = Number(row.total);
    }

    // Austrian tax calculation (Basispauschalierung)
    const basisPauschalisierung =
      income * 0.12 > 26400 ? 26400 : income * 0.12;

    const svaBerechnungsgrundlage = (income - basisPauschalisierung) / 12;

    const svaBemessungsgrundlage =
      svaBerechnungsgrundlage > 5425.0 ? 5425.0 : svaBerechnungsgrundlage;

    const pension = Math.round(svaBemessungsgrundlage * 0.185 * 100) / 100;
    const kranken = Math.round(svaBemessungsgrundlage * 0.0765 * 100) / 100;
    const vorsorge = Math.round(724.02 * 0.0153 * 100) / 100;
    const uversicherung = 8.9;

    const sva = (pension + kranken + vorsorge + uversicherung) * 12;

    const vorlaeufigerGewinn = income - sva - basisPauschalisierung;

    const gewinnFreibetrag =
      vorlaeufigerGewinn * 0.13 > 3900 ? 3900 : vorlaeufigerGewinn * 0.13;

    const gewinnVorSteuern = vorlaeufigerGewinn - gewinnFreibetrag;

    // ESt calculation (year >= 2016)
    const est = this.calculateEst(gewinnVorSteuern);

    const otherExpenses = expenses.other;
    const netto = income - otherExpenses - sva - est;

    return {
      income,
      revenue: income,
      expenses,
      basisPauschalisierung,
      flatRate: basisPauschalisierung,
      svaBerechnungsgrundlage,
      svaBemessungsgrundlage,
      pension,
      kranken,
      vorsorge,
      uversicherung,
      sva,
      vorlaeufigerGewinn,
      gewinnFreibetrag,
      gewinnVorSteuern,
      est,
      netto,
      net: netto,
    };
  }

  private calculateEst(g: number): number {
    if (g <= 11000) {
      return 0;
    } else if (g <= 18000) {
      return (g - 11000) * 1750 / 7000;
    } else if (g <= 31000) {
      return (g - 18000) * 4550 / 13000 + 1750;
    } else if (g <= 60000) {
      return (g - 31000) * 12180 / 29000 + 6300;
    } else if (g <= 90000) {
      return (g - 60000) * 14400 / 30000 + 18480;
    } else if (g <= 1000000) {
      return (g - 90000) * 455000 / 910000 + 32880;
    } else {
      return (g - 1000000) * 0.55 + 487880;
    }
  }
}
