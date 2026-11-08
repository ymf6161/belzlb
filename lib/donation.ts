import { DONATION_RULES } from "@/config/site";

/**
 * Shared date logic for monthly gifts, used by the form (to show the donor
 * their dates) and by the server (to tell Stripe when to collect).
 * All dates are calendar days in UK time.
 */

export type Method = "dd" | "card";

export type CalendarDay = { y: number; m: number; d: number }; // m is 0-based

/** Today's date in Europe/London, independent of the server's time zone. */
export function todayInLondon(now = new Date()): CalendarDay {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month") - 1, d: get("day") };
}

export function addDays(c: CalendarDay, n: number): CalendarDay {
  const dt = new Date(Date.UTC(c.y, c.m, c.d + n));
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth(), d: dt.getUTCDate() };
}

export function addMonths(c: CalendarDay, n: number): CalendarDay {
  const dt = new Date(Date.UTC(c.y, c.m + n, c.d));
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth(), d: dt.getUTCDate() };
}

function compare(a: CalendarDay, b: CalendarDay) {
  return Date.UTC(a.y, a.m, a.d) - Date.UTC(b.y, b.m, b.d);
}

/** The first date on `dayOfMonth` that is on or after `from`. */
function nextOnDay(from: CalendarDay, dayOfMonth: number): CalendarDay {
  let c: CalendarDay = { y: from.y, m: from.m, d: dayOfMonth };
  if (compare(c, from) < 0) c = addMonths(c, 1);
  return c;
}

export type Schedule = {
  /** When the money first leaves the donor's account (what we show them). */
  firstLeave: CalendarDay;
  /** When Stripe should create the first payment request (billing anchor). */
  firstRequest: CalendarDay;
  /** Last payment date for fixed-length gifts. */
  lastLeave: CalendarDay | null;
  /** When the subscription should end for fixed-length gifts. */
  endRequest: CalendarDay | null;
};

export function monthlySchedule(
  dayOfMonth: number,
  method: Method,
  months: number | null,
  today: CalendarDay = todayInLondon(),
): Schedule {
  const earliest = addDays(
    today,
    method === "dd" ? DONATION_RULES.ddEarliestDays : DONATION_RULES.cardEarliestDays,
  );
  const firstLeave = nextOnDay(earliest, dayOfMonth);
  const firstRequest =
    method === "dd" ? addDays(firstLeave, -DONATION_RULES.ddLeadDays) : firstLeave;
  return {
    firstLeave,
    firstRequest,
    lastLeave: months ? addMonths(firstLeave, months - 1) : null,
    endRequest: months ? addMonths(firstRequest, months) : null,
  };
}

/** Unix timestamp (seconds) for a UK calendar day at the given UK hour. */
export function londonTimestamp(c: CalendarDay, hour = 9): number {
  // Find London's UTC offset on that day, then build the instant.
  const guess = Date.UTC(c.y, c.m, c.d, hour);
  const londonHour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date(guess)),
  );
  const offsetHours = londonHour - hour; // 0 in winter, 1 in summer
  return Math.floor((guess - offsetHours * 3600_000) / 1000);
}

export function formatDay(c: CalendarDay): string {
  return new Date(Date.UTC(c.y, c.m, c.d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function money(n: number): string {
  return "£" + n.toFixed(2);
}

export function toISODay(c: CalendarDay): string {
  return `${c.y}-${String(c.m + 1).padStart(2, "0")}-${String(c.d).padStart(2, "0")}`;
}
