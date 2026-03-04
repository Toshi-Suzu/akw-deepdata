import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GROUP_KEYS, type GroupKey } from "@/app/questions";

function countBy(rows: any[], key: GroupKey): { label: string; count: number }[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const v = (r?.[key] ?? "").toString().trim() || "(未回答)";
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const age_band = url.searchParams.get("age_band") || "";
    const gender = url.searchParams.get("gender") || "";
    const date_from = url.searchParams.get("date_from") || "";
    const date_to = url.searchParams.get("date_to") || "";

    const token = url.searchParams.get("token") || "";
    if (process.env.ADMIN_TOKEN && token !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let q = supabase
      .from("responses")
      .select(
        "created_at,age_band,gender,residence,companion_type,visit_frequency,trigger,info_source,top_interest,child_age_band"
      );

    if (date_from) q = q.gte("created_at", date_from);
    if (date_to) q = q.lte("created_at", date_to);
    if (age_band) q = q.eq("age_band", age_band);
    if (gender) q = q.eq("gender", gender);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = data ?? [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const todayCount = rows.filter((r: any) => r.created_at >= todayStart).length;
    const last7dCount = rows.filter((r: any) => r.created_at >= sevenDaysAgo).length;

    const groups: Record<string, { label: string; count: number }[]> = {};
    for (const k of GROUP_KEYS) groups[k] = countBy(rows, k);

    return NextResponse.json({
      ok: true,
      total: rows.length,
      today: todayCount,
      last7d: last7dCount,
      filters: { age_band, gender, date_from, date_to },
      groups,
    });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}