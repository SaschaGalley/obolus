import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BankTx } from './types';

/** How long a fetched range is reused: a page visit asks for months and years in quick succession. */
const CACHE_MS = 5 * 60_000;

/**
 * Reads the business account's movements from Umsatz, the owner's finance
 * app, the way stock-cli reads its trades: `GET /integrations/obolus/transactions`
 * with the shared key in `x-api-key`. Umsatz only hands out the accounts named
 * in its `OBOLUS_ACCOUNT_IDS`, and movements on others switched to obolus there.
 *
 * Nothing of it is stored or logged here: the movements carry bank texts.
 */
@Injectable()
export class UmsatzClient {
  private readonly cache = new Map<string, { at: number; txs: Promise<BankTx[]> }>();

  constructor(private readonly config: ConfigService) {}

  public isConfigured(): boolean {
    return !!this.config.get('UMSATZ_API_URL') && !!this.config.get('UMSATZ_API_KEY');
  }

  /** Movements from `from` to `to` (days, both included), oldest first. */
  public transactions(from: string, to: string): Promise<BankTx[]> {
    const key = `${from}|${to}`;
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.txs;
    const txs = this.fetch(from, to);
    this.cache.set(key, { at: Date.now(), txs });
    txs.catch(() => this.cache.delete(key));
    return txs;
  }

  /** Forget fetched ranges, so a reload shows a statement imported a minute ago. */
  public clearCache(): void {
    this.cache.clear();
  }

  private async fetch(from: string, to: string): Promise<BankTx[]> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('Umsatz ist nicht angebunden: UMSATZ_API_URL und UMSATZ_API_KEY setzen.');
    }
    const base = this.config.get<string>('UMSATZ_API_URL')!.replace(/\/$/, '');
    const url = `${base}/integrations/obolus/transactions`;
    try {
      const { data } = await axios.get<{ transactions: BankTx[] }>(url, {
        params: { from, to },
        headers: { 'x-api-key': this.config.get<string>('UMSATZ_API_KEY') },
        timeout: 20_000,
      });
      // An Umsatz from before the switch sends neither field: only the business account then.
      return (data.transactions ?? []).map((t) => ({
        ...t, amount: Number(t.amount), account: t.account ?? '', businessAccount: t.businessAccount ?? true,
      }));
    } catch (err) {
      throw new ServiceUnavailableException(this.describe(err, base));
    }
  }

  /** Why Umsatz did not answer, in words the page can show — never the response body. */
  private describe(err: unknown, base: string): string {
    if (!axios.isAxiosError(err)) return `Umsatz: ${(err as Error).message}`;
    const status = err.response?.status;
    if (status === 401) return 'Umsatz lehnt den Schlüssel ab: UMSATZ_API_KEY (obolus) und OBOLUS_API_KEY (Umsatz) müssen gleich sein.';
    if (status === 503) return 'Umsatz gibt kein Konto frei: OBOLUS_ACCOUNT_IDS in Umsatz setzen.';
    if (status === 404) return `Umsatz unter ${base} kennt die Schnittstelle nicht (noch nicht deployt, oder die Admin- statt der API-Adresse?).`;
    if (status) return `Umsatz antwortet mit ${status}.`;
    return `Umsatz unter ${base} ist nicht erreichbar (${err.code ?? err.message}).`;
  }
}
