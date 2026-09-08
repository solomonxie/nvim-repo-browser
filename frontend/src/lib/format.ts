// Plain slices of an ISO 8601 date string (e.g. "2026-09-07T17:24:44-07:00")
// -- deterministic, no locale/timezone surprises from Date/toLocaleString.

export function shortDate(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD
}

export function dateTime(iso: string): string {
  return iso.slice(0, 19).replace('T', ' '); // YYYY-MM-DD HH:MM:SS
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Takes a plain "YYYY-MM-DD" (e.g. from shortDate) -- no Date object, no
// timezone conversion, just a friendlier rendering of the same string.
export function longDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function relativeTime(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const units: [number, string][] = [
    [60, 'second'], [60, 'minute'], [24, 'hour'], [30, 'day'], [12, 'month'],
  ];
  let value = sec;
  for (const [size, name] of units) {
    if (value < size) return value <= 0 ? 'just now' : `${value} ${name}${value === 1 ? '' : 's'} ago`;
    value = Math.floor(value / size);
  }
  return `${value} year${value === 1 ? '' : 's'} ago`;
}
