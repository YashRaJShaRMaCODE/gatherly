function escapeIcsText(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\n|\r/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function toUtcStamp(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new TypeError("Event dates must be valid.");
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function foldLine(line) {
  const chunks = [];
  let current = "";
  let length = 0;
  const encoder = new TextEncoder();
  for (const point of line) {
    const bytes = encoder.encode(point).length;
    if (length + bytes > 75) {
      chunks.push(`${current}\r\n `);
      current = "";
      length = 1;
    }
    current += point;
    length += bytes;
  }
  chunks.push(current);
  return chunks.join("");
}

export function buildCalendarEvent(event, now = Date.now()) {
  const start = toUtcStamp(event.startDate);
  const end = toUtcStamp(event.endDate);
  if (new Date(event.endDate) <= new Date(event.startDate)) {
    throw new TypeError("Event end must be after its start.");
  }

  const location = [event.venue, event.city, event.state, event.country]
    .filter(Boolean)
    .join(", ");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Spott//Event Calendar//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(event.slug || "event")}@spott.app`,
    `DTSTAMP:${toUtcStamp(now)}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

export function calendarFilename(slug) {
  const safe = String(slug || "event").replace(/[^a-z0-9_-]/gi, "-").slice(0, 80);
  return `${safe || "event"}.ics`;
}
