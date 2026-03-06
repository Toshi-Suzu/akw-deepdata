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

    // 認証は trim して比較（Vercel環境変数の末尾空白/改行対策）
    const token = (url.searchParams.get("token") || "").trim();
    const adminToken = (process.env.ADMIN_TOKEN || "").trim();

    console.log("COMPARE auth check", {
      tokenLength: token.length,
      envExists: !!process.env.ADMIN_TOKEN,
      envLength: adminToken.length,
      same: token === adminToken,
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
          },
        },
        { status: 401 }
      );
    }

    // 期間A/B（YYYY-MM-DD, inclusive）
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

    // Period A
    const aBaselineRows = await fetchRows(supabase, fromA, toA);
    const aSegmentRows = age_band || gender ? await fetchRows(supabase, fromA, toA, seg) : aBaselineRows;

    // Period B
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
    console.log("COMPARE route error", {
      message: e?.message ?? "bad request",
    });

    return NextResponse.json(
      { error: e?.message ?? "bad request" },
      { status: 400 }
    );
  }
}