import dayjs from 'dayjs';

export function formatCurrency(amount: number | string | null | undefined): string {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('de-AT', {
    style: 'currency',
    currency: 'EUR',
  }).format(num);
}

export function formatNumber(amount: number | string | null | undefined, decimals = 2): string {
  const num = Number(amount) || 0;
  return num.toFixed(decimals);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return dayjs(date).format('DD.MM.YYYY');
}

export function formatDuration(hours: number | string | null | undefined): string {
  const h = Number(hours) || 0;
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0 && mins === 0) return '0h';
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

export function getInvoiceStatus(invoice: any): { label: string; color: string } {
  if (invoice.payedAt) return { label: 'Bezahlt', color: 'green' };
  if (!invoice.sentAt) return { label: 'Entwurf', color: 'default' };
  const dueDate = dayjs(invoice.sentAt).add(invoice.dueDays || 14, 'day');
  if (dayjs().isAfter(dueDate)) return { label: 'Überfällig', color: 'red' };
  return { label: 'Offen', color: 'orange' };
}
