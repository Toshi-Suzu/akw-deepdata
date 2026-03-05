import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { GROUP_KEYS, GROUP_TITLES, type GroupKey } from "@/app/questions";
import { buildDiffTable } from "@/app/lib/diff";

type StatItem = { label: string; count: number };

function jstStartIso(ymd: string) {
  // 例: 2026-03-01T00:00:00+09:00
  return `${ymd}T00:00:00+09:00`;
}
function jstEndIso(ymd: string) {
  // 例: 2026-03-01T23:59:59.999+09:00
  return `${ymd}T23:59:59.999+09:00`;
}

function toDist(items: StatItem[]) {
  const d: Record<string, number> = {};
  for (const it of items) d[it.label] = it.count;
  return d;
}

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

function csvEscape(v: any) {
  const s = (v ?? "").toString();
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function makeCsv(lines: string[][]) {
  // Excel向け：UTF-8 BOM付き
  const bom = "\uFEFF";
  const body = lines.map((row) => row.map(csvEscape).join(",")).join("\r\n");
  return bom + body + "\r\n";
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
      [
        "created_at",
        "visit_key",
        "respondent_id",
        "age_band",
        "gender",
        "residence",
        "companion_type",
        "visit_frequency",
        "trigger",
        "info_source",
        "top_interest",
        "child_age_band",
      ].join(",")
    )
    .gte("created_at", jstStartIso(fromYmd))
    .lte("created_at", jstEndIso(toYmd));

  if (seg?.age_band) q = q.eq("age_band", seg.age_band);
  if (seg?.gender) q = q.eq("gender", seg.gender);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    // auth
    const token = url.searchParams.get("token") || "";
    if (process.env.ADMIN_TOKEN && token !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // params
    const type = (url.searchParams.get("type") || "rows") as "rows" | "diff";

    const fromA = url.searchParams.get("fromA") || "";
    const toA = url.searchParams.get("toA") || "";
    const fromB = url.searchParams.get("fromB") || "";
    const toB = url.searchParams.get("toB") || "";

    const age_band = url.searchParams.get("age_band") || "";
    const gender = url.searchParams.get("gender") || "";

    const period = (url.searchParams.get("period") || "A") as "A" | "B";

    // diff params
    const diffMode = (url.searchParams.get("diff_mode") || "seg") as "seg" | "period";
    const basis = (url.searchParams.get("basis") || "baseline") as "baseline" | "segment"; // period比較の基準

    const group = (url.searchParams.get("group") || "all") as GroupKey | "all";

    // validate dates (rows / diff どちらでも必要)
    if (!fromA || !toA || !fromB || !toB) {
      return NextResponse.json({ error: "missing from/to (A,B)" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const seg = {
      age_band: age_band || undefined,
      gender: gender || undefined,
    };

    // ---- type=rows: 生データ（行） ----
    if (type === "rows") {
      const from = period === "A" ? fromA : fromB;
      const to = period === "A" ? toA : toB;

      const rows = await fetchRows(supabase, from, to /* seg無し＝全件 */);

      const header = [
        "created_at",
        "visit_key",
        "respondent_id",
        "age_band",
        "gender",
        "residence",
        "companion_type",
        "visit_frequency",
        "trigger",
        "info_source",
        "top_interest",
        "child_age_band",
      ];

      const lines: string[][] = [header];
      for (const r of rows) {
        lines.push(header.map((k) => (r as any)[k] ?? ""));
      }

      const csv = makeCsv(lines);
      const filename = `responses_${period}_${from}_${to}.csv`;

      return new Response(csv, {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="${filename}"`,
          "cache-control": "no-store",
        },
      });
    }

    // ---- type=diff: 差分ランキングCSV ----
    // 準備：期間A/Bの baseline と segment の分布を作る
    const baseA = await fetchRows(supabase, fromA, toA);
    const segA = await fetchRows(supabase, fromA, toA, seg);

    const baseB = await fetchRows(supabase, fromB, toB);
    const segB = await fetchRows(supabase, fromB, toB, seg);

    const keys: GroupKey[] = group === "all" ? (GROUP_KEYS as GroupKey[]) : [group];

    const out: string[][] = [
      [
        "diff_mode",
        "basis",
        "group_key",
        "group_title",
        "label",
        "left_rate",
        "right_rate",
        "diff_pp",
        "lift",
        "left_count",
        "right_count",
        "left_total",
        "right_total",
        "period_left",
        "period_right",
        "seg_age_band",
        "seg_gender",
      ],
    ];

    for (const k of keys) {
      // seg比較：左=baseline / 右=segment （periodで選ぶ）
      if (diffMode === "seg") {
        const useBase = period === "A" ? baseA : baseB;
        const useSeg = period === "A" ? segA : segB;

        const leftItems = countBy(useBase, k);
        const rightItems = countBy(useSeg, k);

        const rows = buildDiffTable(
          toDist(leftItems),
          useBase.length,
          toDist(rightItems),
          useSeg.length
        );

        for (const r of rows) {
          out.push([
            "seg",
            "-",
            k,
            GROUP_TITLES[k],
            r.key,
            r.baselineRate,
            r.segmentRate,
            r.diff * 100, // pp
            r.lift === null ? "" : r.lift,
            r.baselineCount,
            r.segmentCount,
            useBase.length,
            useSeg.length,
            period,
            period,
            age_band,
            gender,
          ].map(String));
        }
        continue;
      }

      // period比較：左=PeriodB / 右=PeriodA （diff=A-B）
      // basis=baseline なら baseline同士、basis=segment なら segment同士
      const leftRows = basis === "baseline" ? baseB : segB;
      const rightRows = basis === "baseline" ? baseA : segA;

      const leftItems = countBy(leftRows, k);
      const rightItems = countBy(rightRows, k);

      const rows = buildDiffTable(
        toDist(leftItems),
        leftRows.length,
        toDist(rightItems),
        rightRows.length
      );

      for (const r of rows) {
        out.push([
          "period",
          basis,
          k,
          GROUP_TITLES[k],
          r.key,
          r.baselineRate,
          r.segmentRate,
          r.diff * 100, // pp
          r.lift === null ? "" : r.lift,
          r.baselineCount,
          r.segmentCount,
          leftRows.length,
          rightRows.length,
          "B",
          "A",
          age_band,
          gender,
        ].map(String));
      }
    }

    const csv = makeCsv(out);

    const filename =
      diffMode === "seg"
        ? `diff_seg_${period}_${fromA}_${toA}__${fromB}_${toB}.csv`
        : `diff_period_${basis}_${fromA}_${toA}__${fromB}_${toB}.csv`;

    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "bad request" }, { status: 400 });
  }
}