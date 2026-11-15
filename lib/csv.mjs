export function toSafeCsvCell(value) {
  const text = String(value ?? "");
  const safe = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function buildCsv(rows) {
  return rows.map((row) => row.map(toSafeCsvCell).join(",")).join("\r\n");
}

export function safeCsvFilename(value) {
  const name = String(value ?? "event")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .trim()
    .slice(0, 100);
  return `${name || "event"}_registrations.csv`;
}
