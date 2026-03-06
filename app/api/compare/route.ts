import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { GROUP_KEYS, type GroupKey } from "@/app/questions";

type StatItem = { label: string; count: number };
type Groups = Record<string, StatItem[]>;

type DiffItem = {
  groupKey: GroupKey;
  label: string;
  baselineCount: number;
  baselineRatio: number;
  segmentCount: number;
  segmentRatio: number;
  diffPt: number;
};

type Diffs = Record<string, DiffItem[]>;

function countBy(rows: any[], key: GroupKey): StatItem[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const v = (r?.[key] ?? "").toString().trim() || "(未回答)";
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function groupsFor(rows: any[]): Groups {
  const groups: Groups = {};
  for (const k of GROUP_KEYS) groups[k] = countBy(rows, k);
  return groups;
}

function buildDiffs(baselineRows: any[], segmentRows: any[]): Diffs {
  const result: Diffs = {};

  const baselineGroups = groupsFor(baselineRows);
  const segmentGroups = groupsFor(segmentRows);

  const baselineTotal = baselineRows.length;
  const segmentTotal = segmentRows.length;

  for (const key of GROUP_KEYS) {
    const baseItems = baselineGroups[key] ?? [];
    const segItems = segmentGroups[key] ?? [];

    const labelSet = new Set<string>([
      ...baseItems.map((x) => x.label),
      ...segItems.map((x) => x.label),
    ]);

    const baseMap = new Map(baseItems.map((x) => [x.label, x.count]));
    const segMap = new Map(segItems.map((x) => [x.label, x.count]));

    result[key] = [...labelSet]
      .map((label) => {
        const baselineCount = baseMap.get(label) ?? 0;
        const segmentCount = segMap.get(label) ?? 0;

        const baselineRatio =
          baselineTotal > 0 ? (baselineCount / baselineTotal) * 100 : 0;
        const segmentRatio =
          segmentTotal > 0 ? (segmentCount / segmentTotal) * 100 : 0;

        const diffPt = segmentRatio - baselineRatio;

        return {
          groupKey: key,
          label,
          baselineCount,
          baselineRatio: Number(baselineRatio.toFixed(1)),
          segmentCount,
          segmentRatio: Number(segmentRatio.toFixed(1)),
          diffPt: Number(diffPt.toFixed(1)),
        };
      })
      .sort((a, b) => Math.abs(b.diffPt) - Math.abs(a.diffPt));
  }

  return result;
}

function assertYmd(x: string | null, name: string): string {
  if (!x) throw new Error(`${name} is required`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(x)) throw new Error(`${name} must be YYYY-MM-DD`);
  return x;
}

async function fetchRows(
  supabase: SupabaseClient,
  fromYmd: string,
  toYmd: string,
  seg?: { age_band?: string; gender?: string }
) {
  let q = supabase
    .from("responses")
    .select(
      "visit_key,created_at,age_band,gender,residence,companion_type,visit_frequency,trigger,info_source,top_interest,child_age_band"
    )
    .gte("visit_key", fromYmd)
    .lte("visit_key", toYmd);

  if (seg?.age_band) q = q.eq("age_band", seg.age_band);
  if (seg?.gender) q = q.eq("gender", seg.gender);

  const { data, error } = await q;

  console.log("COMPARE fetchRows", {
    fromYmd,
    toYmd,
    seg,
    rows: data?.length ?? 0,
    error: error?.message ?? null,
  });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const token = (url.searchParams.get("token") || "").trim();
    const adminToken = (process.env.ADMIN_TOKEN || "").trim();

    const tokenCodes = token.split("").map((c) => c.charCodeAt(0));
    const envCodes = adminToken.split("").map((c) => c.charCodeAt(0));

    console.log("COMPARE auth check", {
      tokenLength: token.length,
      envLength: adminToken.length,
      same: token === adminToken,
      tokenCodes,
      envCodes,
    });

    if (adminToken && token !== adminToken) {
      return NextResponse.json(
        {
          error: "unauthorized",
          debug: {
            tokenLength: token.length,
            envExists: !!process.env.ADMIN_TOKEN,
            envLength: adminToken.length,
            same: token === adminToken,
            tokenCodes,
            envCodes,
          },
        },
        { status: 401 }
      );
    }

    const fromA = assertYmd(url.searchParams.get("fromA"), "fromA");
    const toA = assertYmd(url.searchParams.get("toA"), "toA");
    const fromB = assertYmd(url.searchParams.get("fromB"), "fromB");
    const toB = assertYmd(url.searchParams.get("toB"), "toB");

    if (toA < fromA) throw new Error("toA must be greater than or equal to fromA");
    if (toB < fromB) throw new Error("toB must be greater than or equal to fromB");

    const age_band = (url.searchParams.get("age_band") || "").trim();
    const gender = (url.searchParams.get("gender") || "").trim();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const seg = {
      age_band: age_band || undefined,
      gender: gender || undefined,
    };

    const aBaselineRows = await fetchRows(supabase, fromA, toA);
    const aSegmentRows = age_band || gender ? await fetchRows(supabase, fromA, toA, seg) : aBaselineRows;

    const bBaselineRows = await fetchRows(supabase, fromB, toB);
    const bSegmentRows = age_band || gender ? await fetchRows(supabase, fromB, toB, seg) : bBaselineRows;

    return NextResponse.json({
      ok: true,
      filters: { age_band, gender },
      periodA: {
        from: fromA,
        to: toA,
        baselineTotal: aBaselineRows.length,
        segmentTotal: aSegmentRows.length,
        baselineGroups: groupsFor(aBaselineRows),
        segmentGroups: groupsFor(aSegmentRows),
        diffs: buildDiffs(aBaselineRows, aSegmentRows),
      },
      periodB: {
        from: fromB,
        to: toB,
        baselineTotal: bBaselineRows.length,
        segmentTotal: bSegmentRows.length,
        baselineGroups: groupsFor(bBaselineRows),
        segmentGroups: groupsFor(bSegmentRows),
        diffs: buildDiffs(bBaselineRows, bSegmentRows),
      },
    });
  } catch (e: any) {
    console.log("COMPARE route error", {
      message: e?.message ?? "bad request",
    });

    return NextResponse.json(
      { error: e?.message ?? "bad request" },
      { status: 400 }
    );
  }
}