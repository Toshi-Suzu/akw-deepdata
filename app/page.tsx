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
  const [form, setForm] = useState<FormState>({
    age_band: "30代",
    gender: "女性",
    companion_type: "親子",
    motive: "学習",
  });

  async function submit() {
    setMsg(null);
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) setMsg(data.error ?? "送信に失敗しました");
    else setMsg("送信しました（保存OK）");
  }

  return (
    <main style={{ padding: 16, maxWidth: 520 }}>
      <div className="bg-red-500 text-white p-4">テスト</div>

      <h1>DeepData（試作）入力</h1>
      <p style={{ marginTop: 4 }}>（匿名・ログイン不要）</p>

      <label>年代</label>
      <select
        value={form.age_band}
        onChange={(e) => setForm({ ...form, age_band: e.target.value })}
        style={{ width: "100%", padding: 10, marginBottom: 12 }}
      >
        <option>10代</option><option>20代</option><option>30代</option>
        <option>40代</option><option>50代</option><option>60代+</option>
      </select>

      <label>性別</label>
      <select
        value={form.gender}
        onChange={(e) => setForm({ ...form, gender: e.target.value })}
        style={{ width: "100%", padding: 10, marginBottom: 12 }}
      >
        <option>女性</option><option>男性</option><option>その他/不明</option>
      </select>

      <label>同伴</label>
      <select
        value={form.companion_type}
        onChange={(e) => setForm({ ...form, companion_type: e.target.value })}
        style={{ width: "100%", padding: 10, marginBottom: 12 }}
      >
        <option>親子</option><option>夫婦/カップル</option><option>友人</option>
        <option>1人</option><option>団体</option>
      </select>

      <label>目的（仮）</label>
      <select
        value={form.motive}
        onChange={(e) => setForm({ ...form, motive: e.target.value })}
        style={{ width: "100%", padding: 10, marginBottom: 12 }}
      >
        <option>学習</option><option>デート</option><option>子ども</option>
        <option>展示（海獣）</option><option>展示（サンゴ）</option><option>企画展</option>
      </select>

      <button onClick={submit} style={{ width: "100%", padding: 12 }}>
        送信（DBに保存）
      </button>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </main>
  );
}