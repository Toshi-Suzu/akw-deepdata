"use client";

import { useEffect, useMemo, useState } from "react";
import { GROUP_KEYS, GROUP_TITLES, type GroupKey } from "@/app/questions";
import { presetPeriod } from "@/app/lib/period";
import { buildDiffTable, type DiffRow } from "@/app/lib/diff";

type StatItem = { label: string; count: number };
type Groups = Record<string, StatItem[]>;

type ApiDiffItem = {
  groupKey: GroupKey;
  label: string;
  baselineCount: number;
  baselineRatio: number;
  segmentCount: number;
  segmentRatio: number;
  diffPt: number;
};

type Diffs = Record<string, ApiDiffItem[]>;

type PeriodPack = {
  from: string;
  to: string;
  baselineTotal: number;
  segmentTotal: number;
  baselineGroups: Groups;
  segmentGroups: Groups;
  diffs: Diffs;
};

type CompareResponse = {
  ok: boolean;
  filters: { age_band: string; gender: string };
  periodA: PeriodPack;
  periodB: PeriodPack;
  error?: string;
};

function pct(x: number) {
  return `${Math.round(x * 1000) / 10}%`;
}
function pp(x: number) {
  return `${Math.round(x * 1000) / 10}pp`;
}

function Kpi({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-xs font-bold text-slate-600">{label}</div>
      <div className="mt-1 text-xl font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

function DiffTable({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle?: string;
  rows: DiffRow[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-600">{subtitle}</p>}
        </div>
        <div className="text-[11px] text-slate-500">diff=right−left / lift=right÷left</div>
      </div>

      <div className="mt-3 overflow-auto">
        <table className="min-w-[820px] w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-600">
              <th className="text-left py-2 pr-3">項目</th>
              <th className="text-right py-2 px-2">左</th>
              <th className="text-right py-2 px-2">右</th>
              <th className="text-right py-2 px-2">差分</th>
              <th className="text-right py-2 px-2">Lift</th>
              <th className="text-right py-2 pl-2">n(右)</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 25).map((r) => (
              <tr key={r.key} className="border-t border-slate-100">
                <td className="py-2 pr-3 font-semibold text-slate-800">{r.key}</td>
                <td className="py-2 px-2 text-right text-slate-700">
                  {pct(r.baselineRate)}{" "}
                  <span className="text-[11px] text-slate-400">({r.baselineCount})</span>
                </td>
                <td className="py-2 px-2 text-right text-slate-700">
                  {pct(r.segmentRate)}{" "}
                  <span className="text-[11px] text-slate-400">({r.segmentCount})</span>
                </td>
                <td className="py-2 px-2 text-right font-extrabold text-slate-900">
                  {pp(r.diff)}
                </td>
                <td className="py-2 px-2 text-right text-slate-700">
                  {r.lift === null ? "-" : (Math.round(r.lift * 100) / 100).toFixed(2)}
                </td>
                <td className="py-2 pl-2 text-right text-slate-700">{r.segmentCount}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="py-3 text-sm text-slate-500" colSpan={6}>
                  データなし（0件、または未集計）
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-[11px] text-slate-500">
        ※ nが小さいと差分がブレます。目安：n≥30（最低でもn≥10）。
      </p>
    </section>
  );
}

function DiffSummaryCard({
  title,
  items,
}: {
  title: string;
  items: ApiDiffItem[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs text-slate-600">全体→セグの差分が大きい順（pt）</p>
        </div>
      </div>

      <div className="mt-3 overflow-auto">
        <table className="min-w-[760px] w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-600">
              <th className="text-left py-2 pr-3">カテゴリ</th>
              <th className="text-right py-2 px-2">全体</th>
              <th className="text-right py-2 px-2">セグ</th>
              <th className="text-right py-2 px-2">差分</th>
              <th className="text-right py-2 pl-2">n(セグ)</th>
            </tr>
          </thead>
          <tbody>
            {items.slice(0, 3).map((r) => (
              <tr key={`${r.groupKey}-${r.label}`} className="border-t border-slate-100">
                <td className="py-2 pr-3 font-semibold text-slate-800">{r.label}</td>
                <td className="py-2 px-2 text-right text-slate-700">
                  {r.baselineRatio.toFixed(1)}%
                  <span className="ml-1 text-[11px] text-slate-400">({r.baselineCount})</span>
                </td>
                <td className="py-2 px-2 text-right text-slate-700">
                  {r.segmentRatio.toFixed(1)}%
                  <span className="ml-1 text-[11px] text-slate-400">({r.segmentCount})</span>
                </td>
                <td className="py-2 px-2 text-right font-extrabold text-slate-900">
                  {r.diffPt > 0 ? "+" : ""}
                  {r.diffPt.toFixed(1)}pt
                </td>
                <td className="py-2 pl-2 text-right text-slate-700">{r.segmentCount}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="py-3 text-sm text-slate-500" colSpan={5}>
                  データなし
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function presetLabel(id: string) {
  switch (id) {
    case "thisMonth":
      return "今月";
    case "lastMonth":
      return "先月";
    case "last30d":
      return "直近30日";
    case "thisFY":
      return "今年度";
    case "lastFY":
      return "前年度";
    default:
      return id;
  }
}

function exclusiveToInclusiveDate(exclusiveYmd: string) {
  if (!exclusiveYmd || !/^\d{4}-\d{2}-\d{2}$/.test(exclusiveYmd)) return "";
  const dt = new Date(exclusiveYmd + "T00:00:00Z");
  if (Number.isNaN(dt.getTime())) return "";
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

function inclusiveToExclusiveDate(inclusiveYmd: string) {
  if (!inclusiveYmd || !/^\d{4}-\d{2}-\d{2}$/.test(inclusiveYmd)) return "";
  const dt = new Date(inclusiveYmd + "T00:00:00Z");
  if (Number.isNaN(dt.getTime())) return "";
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
}

export default function AdminCompare() {
  const [ageBand, setAgeBand] = useState("");
  const [gender, setGender] = useState("");

  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");

  const [mode, setMode] = useState<"preset" | "manual">("preset");

  const [presetA, setPresetA] = useState<
    "thisMonth" | "lastMonth" | "last30d" | "thisFY" | "lastFY"
  >("thisMonth");
  const [presetB, setPresetB] = useState<"lastMonth" | "last30d" | "lastFY">("lastMonth");
  const [linkYoY, setLinkYoY] = useState(true);

  const [fromA, setFromA] = useState("");
  const [toA, setToA] = useState("");
  const [fromB, setFromB] = useState("");
  const [toB, setToB] = useState("");

  const [groupKey, setGroupKey] = useState<GroupKey>("residence");
  const [analysisMode, setAnalysisMode] = useState<"seg" | "period">("seg");
  const [basis, setBasis] = useState<"baseline" | "segment">("baseline");
  const [segPeriod, setSegPeriod] = useState<"A" | "B">("A");

  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("admin_token") ?? "";
    setToken(saved);
  }, []);

  useEffect(() => {
    if (mode !== "preset") return;

    const a = presetPeriod(presetA);
    setFromA(a.from);
    setToA(exclusiveToInclusiveDate(a.to));

    if (linkYoY && presetA === "thisMonth") {
      const b = presetPeriod("yoyThisMonth");
      setFromB(b.from);
      setToB(exclusiveToInclusiveDate(b.to));
      return;
    }

    const b = presetPeriod(presetB);
    setFromB(b.from);
    setToB(exclusiveToInclusiveDate(b.to));
  }, [mode, presetA, presetB, linkYoY]);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("token", token);

    if (fromA) p.set("fromA", fromA);
    if (toA) p.set("toA", toA);
    if (fromB) p.set("fromB", fromB);
    if (toB) p.set("toB", toB);

    if (ageBand) p.set("age_band", ageBand);
    if (gender) p.set("gender", gender);

    return p.toString();
  }, [token, fromA, toA, fromB, toB, ageBand, gender]);

  function exportUrl(extra: Record<string, string>) {
    const p = new URLSearchParams();
    if (token) p.set("token", token);

    if (fromA) p.set("fromA", fromA);
    if (toA) p.set("toA", toA);
    if (fromB) p.set("fromB", fromB);
    if (toB) p.set("toB", toB);

    if (ageBand) p.set("age_band", ageBand);
    if (gender) p.set("gender", gender);

    for (const [k, v] of Object.entries(extra)) p.set(k, v);

    return `/api/export?${p.toString()}`;
  }

  function downloadCsv(extra: Record<string, string>) {
    window.location.href = exportUrl(extra);
  }

  async function load() {
    if (!token) {
      console.log("token not ready");
      return;
    }

    if (!fromA || !toA || !fromB || !toB) {
      setData({
        ok: false,
        filters: { age_band: ageBand, gender },
        periodA: {
          from: fromA,
          to: toA,
          baselineTotal: 0,
          segmentTotal: 0,
          baselineGroups: {},
          segmentGroups: {},
          diffs: {},
        },
        periodB: {
          from: fromB,
          to: toB,
          baselineTotal: 0,
          segmentTotal: 0,
          baselineGroups: {},
          segmentGroups: {},
          diffs: {},
        },
        error: "期間A/Bの from/to を指定してください",
      });
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/compare?${qs}`, { cache: "no-store" });
    const json = await res.json().catch(() => ({} as any));

    if (!res.ok) {
      setData({
        ok: false,
        filters: { age_band: ageBand, gender },
        periodA: {
          from: fromA,
          to: toA,
          baselineTotal: 0,
          segmentTotal: 0,
          baselineGroups: {},
          segmentGroups: {},
          diffs: {},
        },
        periodB: {
          from: fromB,
          to: toB,
          baselineTotal: 0,
          segmentTotal: 0,
          baselineGroups: {},
          segmentGroups: {},
          diffs: {},
        },
        error: json?.error ?? `error (${res.status})`,
      });
      setLoading(false);
      return;
    }

    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    if (!token) return;
    if (!fromA || !toA || !fromB || !toB) return;

    const t = setTimeout(() => load(), 0);
    return () => clearTimeout(t);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, fromA, toA, fromB, toB]);

  const tokenRequiredView = (
    <main className="min-h-screen bg-slate-50 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-extrabold text-slate-900">管理トークン入力</h1>
        <p className="mt-2 text-sm text-slate-600">最初の1回だけ入力してください（端末に保存されます）</p>

        <input
          type="password"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder="管理トークン"
          className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const v = tokenInput.trim();
              localStorage.setItem("admin_token", v);
              setToken(v);
            }
          }}
        />

        <button
          className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800"
          onClick={() => {
            const v = tokenInput.trim();
            localStorage.setItem("admin_token", v);
            setToken(v);
          }}
          disabled={!tokenInput.trim()}
        >
          ログイン
        </button>

        <p className="mt-3 text-xs text-slate-500">
          ※ トークンを間違えると集計APIが401になります（その場合はログアウトして再入力）。
        </p>
      </div>
    </main>
  );

  function toDist(items: StatItem[]) {
    const d: Record<string, number> = {};
    for (const it of items) d[it.label] = it.count;
    return d;
  }

  const a = data?.periodA;
  const b = data?.periodB;

  const segPack = segPeriod === "A" ? a : b;
  const segLeftItems = (segPack?.baselineGroups?.[groupKey] ?? []) as StatItem[];
  const segRightItems = (segPack?.segmentGroups?.[groupKey] ?? []) as StatItem[];

  const segRows = useMemo(() => {
    if (!segPack) return [];
    return buildDiffTable(
      toDist(segLeftItems),
      segPack.baselineTotal,
      toDist(segRightItems),
      segPack.segmentTotal
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segPack, groupKey, segPeriod, data]);

  const periodLeftPack = b;
  const periodRightPack = a;

  const leftItems =
    basis === "baseline"
      ? ((periodLeftPack?.baselineGroups?.[groupKey] ?? []) as StatItem[])
      : ((periodLeftPack?.segmentGroups?.[groupKey] ?? []) as StatItem[]);
  const rightItems =
    basis === "baseline"
      ? ((periodRightPack?.baselineGroups?.[groupKey] ?? []) as StatItem[])
      : ((periodRightPack?.segmentGroups?.[groupKey] ?? []) as StatItem[]);

  const leftTotal =
    basis === "baseline" ? (periodLeftPack?.baselineTotal ?? 0) : (periodLeftPack?.segmentTotal ?? 0);
  const rightTotal =
    basis === "baseline" ? (periodRightPack?.baselineTotal ?? 0) : (periodRightPack?.segmentTotal ?? 0);

  const periodRows = useMemo(() => {
    if (!periodLeftPack || !periodRightPack) return [];
    return buildDiffTable(toDist(leftItems), leftTotal, toDist(rightItems), rightTotal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, groupKey, basis]);

  const segSummaryPack = segPeriod === "A" ? a : b;

  const segSummaryList = useMemo(() => {
    if (!segSummaryPack?.diffs) return [];

    return GROUP_KEYS.map((key) => ({
      key,
      title: GROUP_TITLES[key],
      items: (segSummaryPack.diffs[key] ?? []) as ApiDiffItem[],
    }));
  }, [segSummaryPack]);

  return !token ? (
    tokenRequiredView
  ) : (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">DeepData Admin（比較）</h1>
            <p className="mt-1 text-sm text-slate-600">
              「全体 vs セグ」/「期間A vs 期間B」の差分をランキングで自動抽出
            </p>
          </div>

          <div className="flex flex-wrap gap-2">

            <button
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              onClick={() => {
                setAgeBand("");
                setGender("");
              }}
            >
              セグ解除
            </button>

            <button
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              onClick={() => {
                setMode("preset");
                setPresetA("thisMonth");
                setPresetB("lastMonth");
                setLinkYoY(true);
              }}
            >
              期間リセット
            </button>

            <button
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800"
              onClick={load}
              disabled={loading}
            >
              {loading ? "集計中…" : "更新"}
            </button>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-bold text-slate-700">
              CSV出力
            </summary>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                onClick={() => downloadCsv({ type: "rows", period: "A" })}
              >
                行CSV（期間A）
              </button>

              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                onClick={() => downloadCsv({ type: "rows", period: "B" })}
              >
                行CSV（期間B）
              </button>

              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                onClick={() => downloadCsv({ type: "diff", diff_mode: "seg", period: "A", group: "all" })}
              >
                差分CSV（全体vsセグ：A）
              </button>

              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                onClick={() => downloadCsv({ type: "diff", diff_mode: "seg", period: "B", group: "all" })}
              >
                差分CSV（全体vsセグ：B）
              </button>

              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                onClick={() =>
                  downloadCsv({ type: "diff", diff_mode: "period", basis: "baseline", group: "all" })
                }
              >
                差分CSV（A vs B：全体）
              </button>

              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                onClick={() =>
                  downloadCsv({ type: "diff", diff_mode: "period", basis: "segment", group: "all" })
                }
              >
                差分CSV（A vs B：セグ）
              </button>

            </div>
          </details>
              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  localStorage.removeItem("admin_token");
                  location.reload();
                }}
              >
                ログアウト
              </button>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs font-extrabold text-slate-700">期間モード</div>
            <button
              className={`rounded-xl px-3 py-1.5 text-sm font-bold border ${
                mode === "preset"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
              onClick={() => setMode("preset")}
            >
              プリセット
            </button>
            <button
              className={`rounded-xl px-3 py-1.5 text-sm font-bold border ${
                mode === "manual"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
              onClick={() => setMode("manual")}
            >
              手動
            </button>

            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">年代</label>
              <select
                value={ageBand}
                onChange={(e) => setAgeBand(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">（全体）</option>
                <option>10代</option>
                <option>20代</option>
                <option>30代</option>
                <option>40代</option>
                <option>50代</option>
                <option>60代+</option>
              </select>

              <label className="text-xs font-bold text-slate-700">性別</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">（全体）</option>
                <option>女性</option>
                <option>男性</option>
                <option>回答しない</option>
              </select>
            </div>
          </div>

          {mode === "preset" && (
            <div className="grid gap-3 md:grid-cols-12">
              <div className="md:col-span-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-xs font-extrabold text-slate-700">期間A（プリセット）</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["thisMonth", "lastMonth", "last30d", "thisFY", "lastFY"] as const).map((id) => (
                    <button
                      key={id}
                      className={`rounded-xl px-3 py-1.5 text-sm font-bold border ${
                        presetA === id
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                      onClick={() => setPresetA(id)}
                    >
                      {presetLabel(id)}
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    id="linkYoY"
                    type="checkbox"
                    checked={linkYoY}
                    onChange={(e) => setLinkYoY(e.target.checked)}
                  />
                  <label htmlFor="linkYoY" className="text-sm font-bold text-slate-700">
                    A=今月のとき、B=前年同月に自動セット
                  </label>
                </div>
              </div>

              <div className="md:col-span-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-xs font-extrabold text-slate-700">期間B（プリセット）</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["lastMonth", "last30d", "lastFY"] as const).map((id) => (
                    <button
                      key={id}
                      className={`rounded-xl px-3 py-1.5 text-sm font-bold border ${
                        presetB === id
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                      onClick={() => {
                        setLinkYoY(false);
                        setPresetB(id);
                      }}
                    >
                      {presetLabel(id)}
                    </button>
                  ))}
                </div>

                <p className="mt-3 text-xs text-slate-600">※ 前年同月は「A=今月」＋チェックONで自動セット。</p>
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-6">
              <div className="text-xs font-extrabold text-slate-700">期間A（手動）</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">from</label>
                  <input
                    type="date"
                    value={fromA}
                    onChange={(e) => setFromA(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    disabled={mode === "preset"}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">to（〜まで）</label>
                  <input
                    type="date"
                    value={toA}
                    onChange={(e) => setToA(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    disabled={mode === "preset"}
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-6">
              <div className="text-xs font-extrabold text-slate-700">期間B（手動）</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">from</label>
                  <input
                    type="date"
                    value={fromB}
                    onChange={(e) => setFromB(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    disabled={mode === "preset" && linkYoY && presetA === "thisMonth"}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">to（〜まで）</label>
                  <input
                    type="date"
                    value={toB}
                    onChange={(e) => setToB(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    disabled={mode === "preset" && linkYoY && presetA === "thisMonth"}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <Kpi label="期間A：全体n" value={data?.periodA?.baselineTotal ?? "-"} />
            <Kpi label="期間A：セグn" value={data?.periodA?.segmentTotal ?? "-"} />
            <Kpi label="期間B：全体n" value={data?.periodB?.baselineTotal ?? "-"} />
            <Kpi label="期間B：セグn" value={data?.periodB?.segmentTotal ?? "-"} />

            {data?.error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-800">
                {data.error}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs font-extrabold text-slate-700">分析モード</div>

              <button
                className={`rounded-xl px-3 py-1.5 text-sm font-bold border ${
                  analysisMode === "seg"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => setAnalysisMode("seg")}
              >
                全体 vs セグ
              </button>

              <button
                className={`rounded-xl px-3 py-1.5 text-sm font-bold border ${
                  analysisMode === "period"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => setAnalysisMode("period")}
              >
                期間A vs 期間B
              </button>

              {analysisMode === "seg" ? (
                <div className="ml-2 flex items-center gap-2">
                  <div className="text-xs font-bold text-slate-700">対象期間</div>
                  <button
                    className={`rounded-xl px-3 py-1.5 text-sm font-bold border ${
                      segPeriod === "A"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                    onClick={() => setSegPeriod("A")}
                  >
                    期間A
                  </button>
                  <button
                    className={`rounded-xl px-3 py-1.5 text-sm font-bold border ${
                      segPeriod === "B"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                    onClick={() => setSegPeriod("B")}
                  >
                    期間B
                  </button>
                </div>
              ) : (
                <div className="ml-2 flex items-center gap-2">
                  <div className="text-xs font-bold text-slate-700">基準</div>
                  <button
                    className={`rounded-xl px-3 py-1.5 text-sm font-bold border ${
                      basis === "baseline"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                    onClick={() => setBasis("baseline")}
                  >
                    全体
                  </button>
                  <button
                    className={`rounded-xl px-3 py-1.5 text-sm font-bold border ${
                      basis === "segment"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                    onClick={() => setBasis("segment")}
                  >
                    セグ
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-bold text-slate-700">項目</label>
              <select
                value={groupKey}
                onChange={(e) => setGroupKey(e.target.value as GroupKey)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                {GROUP_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {GROUP_TITLES[k]}
                  </option>
                ))}
              </select>

              <button
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800"
                onClick={load}
                disabled={loading}
              >
                {loading ? "集計中…" : "この条件で再集計"}
              </button>
            </div>
          </div>

          <p className="mt-2 text-xs text-slate-600">
            「期間A vs 期間B」は diffが <span className="font-bold">A−B</span>（Aで増えた/減った）が上に来ます。
          </p>
        </section>

        {analysisMode === "seg" ? (
          <div className="space-y-6">
            <DiffTable
              title={`${segPeriod === "A" ? "期間A" : "期間B"}：${GROUP_TITLES[groupKey]}（全体 vs セグ）`}
              subtitle={`左=全体 / 右=${
                ageBand || gender ? `${ageBand || ""}${gender || ""}` : "（全体）"
              }（※セグ未指定なら同じ）`}
              rows={segRows}
            />

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm font-extrabold text-slate-900">差分ランキングサマリー</div>
                <div className="text-xs text-slate-600">
                  対象={segPeriod === "A" ? "期間A" : "期間B"} / セグ=
                  {ageBand || gender ? `${ageBand || ""}${gender || ""}` : "未指定"}
                </div>
                <div className="text-xs text-slate-600">n={segSummaryPack?.segmentTotal ?? 0}</div>
                {(segSummaryPack?.segmentTotal ?? 0) < 10 && (
                  <div className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                    参考値（n&lt;10）
                  </div>
                )}
              </div>
            </section>

            <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <summary className="cursor-pointer text-sm font-extrabold text-slate-900">
                項目別差分を見る
              </summary>
              <p className="mt-2 text-xs text-slate-600">
                居住地・同伴・子ども同伴・来館頻度・きっかけ・情報源など、設問ごとの上位差分を表示します。
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {segSummaryList.map((g) => (
                  <DiffSummaryCard key={g.key} title={g.title} items={g.items} />
                ))}
              </div>
            </details>
          </div>
        ) : (
          <DiffTable
            title={`${GROUP_TITLES[groupKey]}（期間A vs 期間B）`}
            subtitle={`左=期間B（${fromB}〜${toB}） / 右=期間A（${fromA}〜${toA}） / 基準=${
              basis === "baseline" ? "全体" : "セグ"
            }`}
            rows={periodRows}
          />
        )}
      </div>
    </main>
  );
}