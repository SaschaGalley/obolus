/** The message an API error carries (Nest sends a string or a list), for a toast or an alert. */
export function apiErrorText(e: unknown): string {
  const err = e as { response?: { data?: { message?: string | string[] } }; message?: string } | null;
  const msg = err?.response?.data?.message;
  return Array.isArray(msg) ? msg.join(', ') : msg || err?.message || 'Fehler';
}
