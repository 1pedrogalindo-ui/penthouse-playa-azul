type Season = "low" | "mid" | "high";
type DayRate = { date: string; season: Season; price: number };

const RATES: Record<Season, number> = { low: 180, mid: 200, high: 230 };
const CLEANING_FEE = 30;
const BRACELET_FEE = 5;
const DAY_MS = 86_400_000;

function iso(date: Date) { return date.toISOString().slice(0, 10); }
function parseDate(value: string) { return new Date(`${value}T00:00:00Z`); }
function addDays(date: Date, days: number) { return new Date(date.getTime() + days * DAY_MS); }

function easterSunday(year: number) {
  const a = year % 19; const b = Math.floor(year / 100); const c = year % 100; const d = Math.floor(b / 4); const e = b % 4;
  const f = Math.floor((b + 8) / 25); const g = Math.floor((b - f + 1) / 3); const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4); const k = c % 4; const l = (32 + 2 * e + 2 * i - h - k) % 7; const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function observedHoliday(year: number, month: number, day: number, immovable = false) {
  const date = new Date(Date.UTC(year, month - 1, day)); if (immovable) return date;
  const weekday = date.getUTCDay();
  if (weekday === 2 || weekday === 6) return addDays(date, -1);
  if (weekday === 3 || weekday === 4) return addDays(date, 5 - weekday);
  if (weekday === 0) return addDays(date, 1);
  return date;
}

function holidayNights(year: number) {
  const easter = easterSunday(year);
  const novemberHolidays = year === 2026
    ? [new Date(Date.UTC(2026, 10, 2)), new Date(Date.UTC(2026, 10, 3))]
    : [observedHoliday(year, 11, 2), observedHoliday(year, 11, 3)];
  const holidays = [
    observedHoliday(year, 1, 1, true), addDays(easter, -48), addDays(easter, -47), addDays(easter, -2),
    observedHoliday(year, 5, 1), observedHoliday(year, 5, 24), observedHoliday(year, 8, 10),
    observedHoliday(year, 10, 9), ...novemberHolidays, observedHoliday(year, 12, 25, true),
  ];
  const daysOff = new Set(holidays.map(iso));
  const isDayOff = (date: Date) => date.getUTCDay() === 0 || date.getUTCDay() === 6 || daysOff.has(iso(date));
  const nights = new Set<string>();
  for (const holiday of holidays) {
    let start = holiday; let end = holiday;
    while (isDayOff(addDays(start, -1))) start = addDays(start, -1);
    while (isDayOff(addDays(end, 1))) end = addDays(end, 1);
    start = addDays(start, -1);
    for (let cursor = start; iso(cursor) <= iso(end); cursor = addDays(cursor, 1)) nights.add(iso(cursor));
  }
  return nights;
}

function rateFor(value: string): DayRate {
  const date = parseDate(value); const month = date.getUTCMonth() + 1; const day = date.getUTCDate(); const weekday = date.getUTCDay();
  const peak = (month === 12 && day >= 20) || (month === 1 && day <= 5);
  const year = date.getUTCFullYear();
  const holiday = holidayNights(year - 1).has(value) || holidayNights(year).has(value) || holidayNights(year + 1).has(value);
  const season: Season = (peak || holiday) ? "high" : ([6, 7, 8].includes(month) || weekday === 5 || weekday === 6) ? "mid" : "low";
  return { date: value, season, price: RATES[season] };
}

export function calculateReservationPricing(checkIn: string, checkOut: string, guestsOver7 = 0) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut) || checkOut <= checkIn) throw new Error("Rango de fechas inválido");
  const daily: DayRate[] = [];
  for (let cursor = parseDate(checkIn); iso(cursor) < checkOut; cursor = addDays(cursor, 1)) {
    if (daily.length >= 90) throw new Error("La estadía no puede superar 90 noches");
    daily.push(rateFor(iso(cursor)));
  }
  const lodgingSubtotal = daily.reduce((sum, item) => sum + item.price, 0);
  const seasons = [...new Set(daily.map((item) => item.season))];
  return {
    daily,
    season: seasons.length === 1 ? seasons[0] : "mixed",
    nightlyRate: Number((lodgingSubtotal / daily.length).toFixed(2)),
    lodgingSubtotal,
    cleaningFee: CLEANING_FEE,
    braceletEstimate: Math.max(0, Number(guestsOver7) || 0) * BRACELET_FEE,
    total: lodgingSubtotal + CLEANING_FEE,
  };
}
