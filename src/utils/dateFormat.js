/**
 * Robust Date & Time Formatting Utilities for Sri Kathiravan & Co.
 * Handles Jackson arrays [year, month, day, hour, minute], ISO strings, space strings, and timestamps.
 * Guarantees that "Invalid Date" is never displayed in the UI.
 */

export function parseDateTime(val) {
  if (!val) return null;

  // 1. Jackson LocalDateTime array: [year, month, day, hour, minute, second?]
  if (Array.isArray(val)) {
    if (val.length < 3) return null;
    const [y, m, d, hr = 0, min = 0, sec = 0] = val;
    // Month in JS Date constructor is 0-indexed (Jan = 0, Oct = 9, Dec = 11)
    const date = new Date(y, (m || 1) - 1, d || 1, hr, min, sec);
    return isNaN(date.getTime()) ? null : date;
  }

  // 2. String format (e.g. "2026-10-16 11:00:00" or "2026-10-16T 11:00:00")
  if (typeof val === "string") {
    let trimmed = val.trim();
    if (!trimmed) return null;

    // Normalize any "T " or extra spaces from Jackson formatting: "2026-10-16T 01:58:02" -> "2026-10-16T01:58:02"
    const normalized = trimmed.replace(/T\s+/, "T").replace(/\s+/, "T");

    // Try normalized standard ISO
    let d = new Date(normalized);
    if (!isNaN(d.getTime())) return d;

    // Try raw string
    d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;

    // Manual parse for YYYY-MM-DD HH:mm
    const parts = normalized.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (parts) {
      const parsed = new Date(
        parseInt(parts[1], 10),
        parseInt(parts[2], 10) - 1,
        parseInt(parts[3], 10),
        parseInt(parts[4], 10),
        parseInt(parts[5], 10),
        parts[6] ? parseInt(parts[6], 10) : 0
      );
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }

  // 3. Date instance
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }

  // 4. Number timestamp
  if (typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

export function formatDate(val, fallback = "Pending date") {
  const d = parseDateTime(val);
  if (!d) return fallback;
  try {
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return fallback;
  }
}

export function formatTime(val, fallback = "Pending time") {
  const d = parseDateTime(val);
  if (!d) return fallback;
  try {
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return fallback;
  }
}

export function formatFullDateTime(val, fallback = "To be confirmed by office") {
  const d = parseDateTime(val);
  if (!d) return fallback;
  try {
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return fallback;
  }
}

export function formatDateTimeAgo(val, fallback = "") {
  const d = parseDateTime(val);
  if (!d) return fallback;
  const now = new Date();
  const diffSec = Math.floor((now - d) / 1000);
  if (diffSec < 0) return formatFullDateTime(val, fallback);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(val, fallback);
}

