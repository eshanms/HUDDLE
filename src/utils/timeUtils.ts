/**
 * HUDDLE Time & Chronological Utility
 * Converts 12-hour (e.g. "09:00 AM", "12:30 PM", "2:00 PM") and 24-hour time strings
 * into absolute minutes from midnight for exact chronological sorting.
 */

/**
 * Parses a time string into minutes from midnight (0 to 1439).
 * Examples:
 *  - "12:00 AM" => 0
 *  - "09:00 AM" or "9:00 AM" => 540
 *  - "12:00 PM" => 720
 *  - "02:00 PM" or "2:00 PM" => 840
 *  - "11:00 PM" => 1380
 *  - "14:30" => 870
 */
export function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const str = timeStr.trim().toUpperCase();
  if (!str) return 0;

  // Match 12-hour format e.g. "09:30 AM", "9:30AM", "2:00 PM", "12:00 PM"
  const match12 = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10) || 0;
    const modifier = match12[3];

    if (modifier === 'PM') {
      if (hours < 12) hours += 12;
    } else if (modifier === 'AM') {
      if (hours === 12) hours = 0;
    }
    return hours * 60 + minutes;
  }

  // Fallback for HH:MM format without AM/PM
  const parts = str.split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  }

  return 0;
}

/**
 * Compare function for sorting program/schedule items chronologically.
 * Sorts by Date first (if available), then by Start Time.
 */
export function compareChronological<T extends { startTime?: string; time?: string; date?: string; startDate?: string }>(
  a: T,
  b: T
): number {
  const dateA = a.startDate || a.date || '';
  const dateB = b.startDate || b.date || '';

  if (dateA && dateB && dateA !== dateB) {
    return dateA.localeCompare(dateB);
  }

  const timeA = parseTimeToMinutes(a.startTime || a.time);
  const timeB = parseTimeToMinutes(b.startTime || b.time);

  return timeA - timeB;
}
