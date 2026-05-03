import { addDays, format } from 'date-fns';

export function defaultScheduleDateKey(): string {
  return format(addDays(new Date(), 1), 'yyyy-MM-dd');
}

export function parseDateKeyToLocalDate(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

/**
 * Local calendar date (YYYY-MM-DD in the user's timezone) + HH:mm → UTC instant as ISO 8601 string.
 */
export function localYmdHmToISO(ymd: string, timeHm: string): string {
  const base = parseDateKeyToLocalDate(ymd);
  if (!base) throw new Error('Invalid date');
  const [hhS, mmS] = timeHm.trim().split(':');
  const hh = Number(hhS);
  const mi = Number(mmS ?? 0);
  if (!Number.isFinite(hh) || !Number.isFinite(mi) || hh < 0 || hh > 23 || mi < 0 || mi > 59) {
    throw new Error('Invalid time');
  }
  base.setHours(hh, mi, 0, 0);
  return base.toISOString();
}

export function isPostScheduleAllowed(
  liveImmediately: boolean,
  scheduleDateKey: string,
  scheduleTimeHm: string,
): boolean {
  if (liveImmediately) return true;
  try {
    const ms = Date.parse(localYmdHmToISO(scheduleDateKey, scheduleTimeHm));
    return Number.isFinite(ms) && ms > Date.now();
  } catch {
    return false;
  }
}
