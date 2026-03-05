// app/lib/diff.ts
export type Dist = Record<string, number>;

export type DiffRow = {
  key: string;
  baselineCount: number;
  baselineRate: number; // 0..1
  segmentCount: number;
  segmentRate: number; // 0..1
  diff: number;        // segmentRate - baselineRate
  lift: number | null; // segmentRate / baselineRate (null if baselineRate==0)
};

export function toRate(count: number, total: number): number {
  if (!total) return 0;
  return count / total;
}

export function buildDiffTable(
  baseline: Dist,
  baselineTotal: number,
  segment: Dist,
  segmentTotal: number
): DiffRow[] {
  const keys = new Set<string>([...Object.keys(baseline), ...Object.keys(segment)]);
  const rows: DiffRow[] = [];

  for (const key of keys) {
    const bc = baseline[key] ?? 0;
    const sc = segment[key] ?? 0;
    const br = toRate(bc, baselineTotal);
    const sr = toRate(sc, segmentTotal);
    const diff = sr - br;
    const lift = br > 0 ? sr / br : null;

    rows.push({
      key,
      baselineCount: bc,
      baselineRate: br,
      segmentCount: sc,
      segmentRate: sr,
      diff,
      lift,
    });
  }

  // default sort: abs(diff) desc, then segmentCount desc
  rows.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff) || b.segmentCount - a.segmentCount);
  return rows;
}