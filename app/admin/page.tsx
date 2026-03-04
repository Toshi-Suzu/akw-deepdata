"use client";

import { useEffect, useMemo, useState } from "react";

type StatItem = { label: string; count: number };
type StatsResponse = {
  ok: boolean;
  total: number;
  today: number;
  last7d: number;
  filters: { age_band: string; gender: string; date_from: string; date_to: string };
  groups: Record<string, StatItem[]>;
  error?: string;
};

function BarList({ title, items }: { title: string; items: StatItem[] }) {
  const max = Math.max(1, ...items.map((x) => x.count));
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.slice(0, 12).map((x) => {
          const w = Math.round((x.count / max) * 100);
          return (
            <div key={x.label} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-slate-800 truncate">{x.label}</span>
                <span className="font-extrabold text-slate-900">{x.count}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-slate-900" style={{ width: `${w}%` }} />
              </div>
            </div>
          );
        })}
        {items.length === 0 && <p className="text-xs text-slate-500">データなし</p>}
      </div>
    </section>
  );
}

export default function Admin() {
  const [ageBand, setAgeBand] = useState("");
  const [gender, setGender] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // ADMIN_TOKENを使う場合は、ここに手入力 or ローカルでだけ固定でもOK
  const [token, setToken] = useState("");

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (ageBand) p.set("age_band", ageBand);
    if (gender) p.set("gender", gender);
    if (dateFrom) p.set("date_from", dateFrom);
    if (dateTo) p.set("date_to", dateTo);
    if (token) p.set("token", token);
    return p.toString();
  }, [ageBand, gender, dateFrom, dateTo, token]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/stats?${qs}`, { cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as StatsResponse;
    setStats(json);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = stats?.groups ?? {};

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">DeepData ダッシュボード</h1>
            <p className="mt-1 text-sm text-slate-600">
              回答の分布を即時に把握（必要なら30代女性に絞り込み）
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800"
              onClick={() => {
                setAgeBand("30代");
                setGender("女性");
                setTimeout(load, 0);
              }}
            >
              30代女性に絞る
            </button>
            <button
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              onClick={() => {
                setAgeBand("");
                setGender("");
                setDateFrom("");
                setDateTo("");
                setTimeout(load, 0);
              }}
            >
              リセット
            </button>
            <button
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              onClick={load}
              disabled={loading}
            >
              {loading ? "更新中…" : "更新"}
            </button>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-6">
            <div className="md:col-span-1">
              <label className="text-xs font-bold text-slate-700">年代</label>
              <select
                value={ageBand}
                onChange={(e) => setAgeBand(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">（全体）</option>
                <option>10代</option><option>20代</option><option>30代</option>
                <option>40代</option><option>50代</option><option>60代+</option>
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="text-xs font-bold text-slate-700">性別</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">（全体）</option>
                <option>女性</option><option>男性</option><option>回答しない</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700">期間（from）</label>
              <input
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="例: 2026-03-01"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700">期間（to）</label>
              <input
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="例: 2026-03-04"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            {/* トークン運用する場合だけ使う */}
            <div className="md:col-span-6">
              <label className="text-xs font-bold text-slate-700">管理トークン（任意）</label>
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ADMIN_TOKENを設定した場合のみ必要"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Kpi label="総回答" value={stats?.total ?? "-"} />
            <Kpi label="今日" value={stats?.today ?? "-"} />
            <Kpi label="直近7日" value={stats?.last7d ?? "-"} />
            {stats?.error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-800">
                {stats.error}
              </div>
            )}
          </div>

          <div className="mt-4">
            <button
              onClick={load}
              className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-extrabold text-white hover:bg-slate-800"
              disabled={loading}
            >
              {loading ? "集計中…" : "この条件で集計"}
            </button>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <BarList title="居住地（residence）" items={groups.residence ?? []} />
          <BarList title="同伴（companion_type）" items={groups.companion_type ?? []} />
          <BarList title="来館頻度（visit_frequency）" items={groups.visit_frequency ?? []} />
          <BarList title="きっかけ（trigger）" items={groups.trigger ?? []} />
          <BarList title="情報源（info_source）" items={groups.info_source ?? []} />
          <BarList title="見たかった展示（top_interest）" items={groups.top_interest ?? []} />
          <BarList title="子どもの年齢（child_age_band）" items={groups.child_age_band ?? []} />
        </div>

        <p className="text-xs text-slate-500">
          ※ 大量データになったら、次はDB側でgroup by集計（RPC/VIEW）に切り替えます（現状は簡易実装）。
        </p>
      </div>
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-xs font-bold text-slate-600">{label}</div>
      <div className="mt-1 text-xl font-extrabold text-slate-900">{value}</div>
    </div>
  );
}