import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { GROUP_KEYS, type GroupKey } from "@/app/questions";

type StatItem = { label: string; count: number };
type Groups = Record<string, StatItem[]>;

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

// JSTのYYYY-MM-DDを「その日のJST 00:00」をUTCのISOに変換
function jstDayStartToUtcIso(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  // JST 00:00 = UTC 前日15:00
  const utc = new Date(Date.UTC(y, m - 1, d, -9, 0, 0));
  return utc.toISOString();
}

function assertYmd(x: string | null, name: string): string {
  if (!x) throw new Error(`${name} is required`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(x)) throw new Error(`${name} must be YYYY-MM-DD`);
  return x;
}

// to は「含む」ではなく「除外（exclusive）」で扱う： [from, to)
function toExclusiveUtcIso(fromYmd: string, toYmd: string): { fromIso: string; toIso: string } {
  const fromIso = jstDayStartToUtcIso(fromYmd);

  // toYmd の翌日JST 00:00 を exclusive end にする
  const [y, m, d] = toYmd.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1, -9, 0, 0));
  const toIso = next.toISOString();

  return { fromIso, toIso };
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
    rows: data?.length
  });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const token = url.searchParams.get("token") || "";
    if (process.env.ADMIN_TOKEN && token !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 期間A/B（YYYY-MM-DD）
    const fromA = assertYmd(url.searchParams.get("fromA"), "fromA");
    const toA = assertYmd(url.searchParams.get("toA"), "toA");
    const fromB = assertYmd(url.searchParams.get("fromB"), "fromB");
    const toB = assertYmd(url.searchParams.get("toB"), "toB");

    if (toA <= fromA) throw new Error("toA must be greater than fromA");
    if (toB <= fromB) throw new Error("toB must be greater than fromB");

    const age_band = url.searchParams.get("age_band") || "";
    const gender = url.searchParams.get("gender") || "";

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const seg = { age_band: age_band || undefined, gender: gender || undefined };

    // Period A
    const aBaselineRows = await fetchRows(supabase, fromA, toA);
    const aSegmentRows = (age_band || gender) ? await fetchRows(supabase, fromA, toA, seg) : aBaselineRows;

    // Period B
    const bBaselineRows = await fetchRows(supabase, fromB, toB);
    const bSegmentRows = (age_band || gender) ? await fetchRows(supabase, fromB, toB, seg) : bBaselineRows;

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
      },
      periodB: {
        from: fromB,
        to: toB,
        baselineTotal: bBaselineRows.length,
        segmentTotal: bSegmentRows.length,
        baselineGroups: groupsFor(bBaselineRows),
        segmentGroups: groupsFor(bSegmentRows),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "bad request" }, { status: 400 });
  }
}