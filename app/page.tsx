"use client";

import { useState } from "react";

type FormState = {
  age_band: string;
  gender: string;
  companion_type: string;
  motive: string;
};

export default function Home() {
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormState>({
    age_band: "30代",
    gender: "女性",
    companion_type: "親子",
    motive: "学習",
  });

  async function submit() {
    setLoading(true);
    setMsg(null);

    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) setMsg(data.error ?? "送信に失敗しました");
    else setMsg("送信しました（保存OK）");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-lg">

        <header className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">
            DeepData 入力
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            名古屋港水族館 来館者ディープデータ収集（匿名）
          </p>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 space-y-5">

          <Field label="年代">
            <Select
              value={form.age_band}
              onChange={(v) => setForm({ ...form, age_band: v })}
              options={["10代","20代","30代","40代","50代","60代+"]}
            />
          </Field>

          <Field label="性別">
            <Select
              value={form.gender}
              onChange={(v) => setForm({ ...form, gender: v })}
              options={["女性","男性","その他/不明"]}
            />
          </Field>

          <Field label="同伴">
            <Select
              value={form.companion_type}
              onChange={(v) => setForm({ ...form, companion_type: v })}
              options={["親子","夫婦/カップル","友人","1人","団体"]}
            />
          </Field>

          <Field label="来館目的（仮）">
            <Select
              value={form.motive}
              onChange={(v) => setForm({ ...form, motive: v })}
              options={["学習","デート","子ども","展示（サンゴ）","企画展"]}
            />
          </Field>

          <button
            onClick={submit}
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 py-3 text-white font-bold transition hover:bg-slate-800 disabled:bg-slate-400"
          >
            {loading ? "送信中..." : "送信"}
          </button>

          {msg && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm font-semibold text-emerald-700">
              {msg}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-800">{label}</label>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}