// app/lib/period.ts
export type Period = { from: string; to: string }; // YYYY-MM-DD (to is exclusive in API usage)
export type PresetId =
  | "thisMonth"
  | "lastMonth"
  | "last30d"
  | "thisFY"
  | "lastFY"
  | "yoyThisMonth"; // thisMonth vs same month last year (Compare用に便利)

const pad2 = (n: number) => String(n).padStart(2, "0");

export function todayJst(): Date {
  // Server/Client どちらでも “JSTの日付” っぽく扱えるよう、UTCで+9hして日付成分を使う
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

export function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = pad2(d.getUTCMonth() + 1);
  const day = pad2(d.getUTCDate());
  return `${y}-${m}-${day}`;
}

export function addDays(ymdStr: string, days: number): string {
  const [y, m, d] = ymdStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return ymd(dt);
}

export function startOfMonth(ymdStr: string): string {
  const [y, m] = ymdStr.split("-").map(Number);
  return ymd(new Date(Date.UTC(y, m - 1, 1)));
}

export function startOfNextMonth(ymdStr: string): string {
  const [y, m] = ymdStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, 1));
  dt.setUTCMonth(dt.getUTCMonth() + 1);
  return ymd(dt);
}

export function fyStart(year: number): string {
  // FY year means "year-04-01"
  return `${year}-04-01`;
}
export function fyEndExclusive(year: number): string {
  // exclusive end = next FY start
  return `${year + 1}-04-01`;
}

export function currentFyYear(today: string): number {
  // today: YYYY-MM-DD
  const [y, m] = today.split("-").map(Number);
  return m >= 4 ? y : y - 1;
}

export function presetPeriod(preset: PresetId, baseToday?: string): Period {
  const t = baseToday ?? ymd(todayJst());

  if (preset === "last30d") {
    const to = addDays(t, 1); // exclusive end = tomorrow
    const from = addDays(to, -30);
    return { from, to };
  }

  if (preset === "thisMonth") {
    const from = startOfMonth(t);
    const to = startOfNextMonth(t);
    return { from, to };
  }

  if (preset === "lastMonth") {
    const thisFrom = startOfMonth(t);
    const from = addDays(thisFrom, -1);
    const from2 = startOfMonth(from);
    const to = thisFrom;
    return { from: from2, to };
  }

  if (preset === "thisFY") {
    const fy = currentFyYear(t);
    return { from: fyStart(fy), to: fyEndExclusive(fy) };
  }

  if (preset === "lastFY") {
    const fy = currentFyYear(t) - 1;
    return { from: fyStart(fy), to: fyEndExclusive(fy) };
  }

  if (preset === "yoyThisMonth") {
    // Compareで使う想定：A=thisMonth, B=same month last year
    const a = presetPeriod("thisMonth", t);
    const [ay, am] = a.from.split("-").map(Number);
    const by = ay - 1;
    const bFrom = `${by}-${pad2(am)}-01`;
    const bTo = startOfNextMonth(bFrom);
    return { from: bFrom, to: bTo };
  }

  // exhaustive
  return { from: startOfMonth(t), to: startOfNextMonth(t) };
}

export function assertValidPeriod(from: string | null, to: string | null): { from: string; to: string } {
  if (!from || !to) throw new Error("from/to are required");
  // basic format check
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    throw new Error("from/to must be YYYY-MM-DD");
  }
  if (to <= from) throw new Error("to must be greater than from");
  return { from, to };
}