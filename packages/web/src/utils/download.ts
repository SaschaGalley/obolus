/**
 * Trigger a browser download for a blob without opening a tab.
 *
 * Using an <a download> click (instead of window.open) is NOT subject to the
 * popup blocker, so it works reliably even after an async fetch — the button
 * can simply show a spinner until the file is ready, then save it.
 */
export function downloadBlob(data: BlobPart, filename: string, mime = 'application/pdf') {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the browser has grabbed the URL for the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Strip characters that are illegal in file names (e.g. the "/" in "008/2026"). */
export function safeFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '-').trim();
}
