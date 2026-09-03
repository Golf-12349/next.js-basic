// ── Lao locale formatting & date helpers shared by the dashboard widgets ─────

export const LAO_MONTHS = [
  'ມັງກອນ', 'ກຸມພາ', 'ມີນາ', 'ເມສາ', 'ພຶດສະພາ', 'ມິຖຸນາ',
  'ກໍລະກົດ', 'ສິງຫາ', 'ກັນຍາ', 'ຕຸລາ', 'ພະຈິກ', 'ທັນວາ',
] as const;

export const LAO_DAYS = [
  'ວັນອາທິດ', 'ວັນຈັນ', 'ວັນອັງຄານ', 'ວັນພຸດ',
  'ວັນພະຫັດ', 'ວັນສຸກ', 'ວັນເສົາ',
] as const;

export const LAO_DAYS_SHORT = [
  'ອາທິດ', 'ຈັນ', 'ອັງຄານ', 'ພຸດ', 'ພະຫັດ', 'ສຸກ', 'ເສົາ',
] as const;

/** Format a Date as a local `YYYY-MM-DD` key (matches the `uploadDate` column). */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse a `YYYY-MM-DD` key into a local Date (or null when malformed). */
export function parseDateKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function addDays(base: Date, amount: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + amount);
  return d;
}

export function formatFullDateLao(date: Date): string {
  return `${LAO_DAYS[date.getDay()]}, ${date.getDate()} ${LAO_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** Working-shift indicator derived from the current hour. */
export function shiftOfHour(hour: number): { label: string; time: string } {
  if (hour < 12) return { label: 'ຊ່ວງເຊົ້າ', time: '08:00 – 12:00' };
  if (hour < 17) return { label: 'ຕອນບ່າຍ', time: '13:00 – 17:00' };
  return { label: 'ຕອນແລງ', time: '17:00 – 20:00' };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Whole-number percentage, guarded against zero division. */
export function percentage(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}