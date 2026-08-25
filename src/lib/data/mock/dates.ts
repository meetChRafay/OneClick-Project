// Small helpers so demo data always looks "current" relative to whenever
// the app actually runs, instead of hard-coded dates that would drift into
// the past.

export function daysFromNow(days: number, hour = 17, minute = 0): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function todayAt(hour: number, minute = 0): string {
  return daysFromNow(0, hour, minute);
}

export function hoursAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

export function daysAgo(days: number, hour = 12): string {
  return daysFromNow(-days, hour);
}

export function dateOnly(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
