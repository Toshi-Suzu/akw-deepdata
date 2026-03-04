"use client";

import {  useEffect, useMemo, useState } from "react";

type FormState = {
  age_band: string;
  gender: string;
  residence: string;
  companion_type: string;
  visit_frequency: string;
  trigger: string;
  info_source: string;
  top_interest: string;

  // 条件分岐（30代女性×親子のみ）
  child_age_band?: string;
};

type Option = { value: string; label: string };

const OPTIONS = {
  age_band: [
    { value: "10代", label: "10代" },
    { value: "20代", label: "20代" },
    { value: "30代", label: "30代" },
    { value: "40代", label: "40代" },
    { value: "50代", label: "50代" },
    { value: "60代+", label: "60代以上" },
  ] satisfies Option[],
  gender: [
    { value: "女性", label: "女性" },
    { value: "男性", label: "男性" },
    { value: "回答しない", label: "回答しない" },
  ] satisfies Option[],
  residence: [
    { value: "名古屋市", label: "名古屋市" },
    { value: "愛知県（名古屋以外）", label: "愛知県（名古屋以外）" },
    { value: "東海地方", label: "東海地方（岐阜・三重・静岡など）" },
    { value: "関東", label: "関東（首都圏）" },
    { value: "関西", label: "関西（近畿）" },
    { value: "その他", label: "その他（国内）" },
    { value: "海外", label: "海外" },
  ] satisfies Option[],
  companion_type: [
    { value: "小学生以下の子どもと", label: "小学生以下の子どもと" },
    { value: "中高生の子どもと", label: "中高生の子どもと" },
    { value: "夫婦/カップル", label: "夫婦/カップル" },
    { value: "友人", label: "友人" },
    { value: "1人", label: "1人" },
    { value: "団体", label: "団体" },
  ] satisfies Option[],
  visit_frequency: [
    { value: "初めて", label: "初めて" },
    { value: "数年ぶり", label: "数年ぶり" },
    { value: "1〜2年に1回", label: "1〜2年に1回" },
    { value: "ほぼ毎年", label: "ほぼ毎年" },
    { value: "年2回以上", label: "年2回以上" },
  ] satisfies Option[],
  trigger: [
    { value: "子どもが行きたいと言った", label: "子どもが行きたいと言った" },
    { value: "以前から来たかった", label: "以前から来たかった" },
    { value: "SNSで見た", label: "SNSで見た" },
    { value: "テレビ・メディア", label: "テレビ・メディア" },
    { value: "旅行", label: "旅行" },
    { value: "学校・学習", label: "学校・学習" },
    { value: "イベント", label: "イベント" },
    { value: "友人・知人の紹介", label: "友人・知人の紹介" },
  ] satisfies Option[],
  info_source: [
    { value: "SNS", label: "SNS" },
    { value: "YouTube", label: "YouTube" },
    { value: "テレビ", label: "テレビ" },
    { value: "旅行サイト", label: "旅行サイト" },
    { value: "学校", label: "学校" },
    { value: "家族・友人", label: "家族・友人" },
    { value: "特にない", label: "特にない" },
  ] satisfies Option[],
  top_interest: [
    { value: "シャチ", label: "シャチ" },
    { value: "イルカ", label: "イルカ" },
    { value: "ペンギン", label: "ペンギン" },
    { value: "ウミガメ", label: "ウミガメ" },
    { value: "サンゴ水槽", label: "サンゴ水槽" },
    { value: "深海", label: "深海" },
    { value: "特にない", label: "特にない" },
  ] satisfies Option[],
  child_age_band: [
    { value: "0〜3歳", label: "0〜3歳" },
    { value: "4〜6歳", label: "4〜6歳" },
    { value: "小学生", label: "小学生" },
  ] satisfies Option[],
};

type StepKey =
  | "age_band"
  | "gender"
  | "residence"
  | "companion_type"
  | "visit_frequency"
  | "trigger"
  | "info_source"
  | "top_interest"
  | "child_age_band"; // 条件分岐

type Step = {
  key: StepKey;
  title: string;
  description?: string;
  options: Option[];
  required?: boolean;
};

const BASE_STEPS: Step[] = [
  { key: "age_band", title: "年代", options: OPTIONS.age_band, required: true },
  { key: "gender", title: "性別", options: OPTIONS.gender, required: true },
  {
    key: "residence",
    title: "居住エリア",
    description: "分析の精度が上がります（個人特定には使いません）",
    options: OPTIONS.residence,
    required: true,
  },
  { key: "companion_type", title: "同伴構成", options: OPTIONS.companion_type, required: true },
  { key: "visit_frequency", title: "来館頻度", options: OPTIONS.visit_frequency, required: true },
  { key: "trigger", title: "来館のきっかけ", options: OPTIONS.trigger, required: true },
  { key: "info_source", title: "情報を知った場所", options: OPTIONS.info_source, required: true },
  { key: "top_interest", title: "一番見たかった展示", options: OPTIONS.top_interest, required: true },
];

export default function Home() {
  const [form, setForm] = useState<FormState>({
    age_band: "",
    gender: "",
    residence: "",
    companion_type: "",
    visit_frequency: "",
    trigger: "",
    info_source: "",
    top_interest: "",
    child_age_band: "",
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [alreadyAnswered, setAlreadyAnswered] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("akw_answered_visit_key");
    if (saved === getVisitKeyJST()) {
      setAlreadyAnswered(true);
    }
  }, []);

  const needsChildAgeStep =
    form.age_band === "30代" &&
    form.gender === "女性" &&
    (form.companion_type === "小学生以下の子どもと" || form.companion_type === "中高生の子どもと");

  const steps: Step[] = useMemo(() => {
    const s = [...BASE_STEPS];
    if (needsChildAgeStep) {
      // 「親子」でより有効なのは子ども年齢（母親来館減少の構造が切れる）
      // companion_type が中高生でも入れるかは運用次第だが、ここでは入れている
      s.splice(4, 0, {
        key: "child_age_band",
        title: "（追加）お子さまの年齢",
        description: "30代女性 × 親子の場合のみ表示されます",
        options: OPTIONS.child_age_band,
        required: true,
      });
    }
    return s;
  }, [needsChildAgeStep]);

  const current = steps[stepIndex];

  const currentValue = (form as any)[current.key] as string;
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);

  const canGoNext = useMemo(() => {
    if (!current.required) return true;
    return !!currentValue;
  }, [current.required, currentValue]);

  function setAnswer(stepKey: StepKey, value: string) {
    setForm((prev) => ({ ...prev, [stepKey]: value }));
    setMsg(null);
    setIsError(false);
  }

  function next() {
    if (!canGoNext) return;
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  function back() {
    setStepIndex((i) => Math.max(i - 1, 0));
    setMsg(null);
    setIsError(false);
  }

function getRespondentId() {
  const key = "akw_respondent_id";
  const existing = typeof window !== "undefined" ? localStorage.getItem(key) : null;
  if (existing) return existing;

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  if (typeof window !== "undefined") localStorage.setItem(key, id);
  return id;
}

function getVisitKeyJST() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10); // YYYY-MM-DD
}

  async function submit() {
    setMsg(null);
    setIsError(false);
    setIsSubmitting(true);

    // 条件分岐が無い場合は child_age_band を送らない
    const payload: any = {
      ...form,
      respondent_id: getRespondentId(),
      visit_key: getVisitKeyJST(),
    };
    if (!needsChildAgeStep) delete payload.child_age_band;

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setIsError(false);
        setMsg("本日はすでに回答済みです。次回のご来館時にまたお願いします。");
        setAlreadyAnswered(true);
        return;
      }
      if (!res.ok) {
        setIsError(true);
        setMsg(data.error ?? "送信に失敗しました");
      } else {
        setIsError(false);
        setMsg("送信しました（ご協力ありがとうございました）");

        localStorage.setItem("akw_answered_visit_key", getVisitKeyJST());
        setAlreadyAnswered(true);
      }
    } catch {
      setIsError(true);
      setMsg("通信に失敗しました（ネットワークをご確認ください）");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLast = stepIndex === steps.length - 1;

// ★追加：今日すでに回答していたらフォームを出さない
if (alreadyAnswered) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-extrabold text-slate-900">
            本日はすでに回答いただいています
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            ご協力ありがとうございます。次回のご来館時にまたお願いします。
          </p>

          <div className="mt-5">
            <button
              type="button"
              onClick={() => {
                // どうしてもやり直したい場合だけ使う“裏口”（任意）
                localStorage.removeItem("akw_answered_visit_key");
                setAlreadyAnswered(false);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              （テスト用）もう一度回答する
            </button>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            ※同一端末では1日1回まで回答できます。
          </p>
        </section>
      </div>
    </main>
  );
}

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-5">
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
              匿名・ログイン不要
            </span>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              DeepData（来館者データ収集）
            </h1>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            設問は最小限です（約30秒）。個人を特定する情報は収集しません。
          </p>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {stepIndex + 1}/{steps.length}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-slate-900 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <p className="text-sm font-bold text-slate-900">{current.title}</p>
            {current.description && (
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{current.description}</p>
            )}
          </div>

          <div className="space-y-2">
            {current.options.map((opt) => {
              const checked = currentValue === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAnswer(current.key, opt.value)}
                  className={[
                    "w-full rounded-xl border px-4 py-3 text-left text-sm transition",
                    checked
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{opt.label}</span>
                    {checked && <span className="text-xs font-extrabold">選択中</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {!canGoNext && (
            <p className="mt-3 text-xs font-semibold text-amber-700">
              ※選択してください
            </p>
          )}

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={back}
              disabled={stepIndex === 0 || isSubmitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              戻る
            </button>

            {!isLast ? (
              <button
                type="button"
                onClick={next}
                disabled={!canGoNext || isSubmitting}
                className="ml-auto rounded-xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                次へ
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={!canGoNext || isSubmitting}
                className="ml-auto rounded-xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? "送信中..." : "送信"}
              </button>
            )}
          </div>

          {msg && (
            <div
              className={[
                "mt-4 rounded-xl border px-3 py-2 text-sm font-bold",
                isError
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800",
              ].join(" ")}
            >
              {msg}
            </div>
          )}

          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            ※回答データは統計分析のみに利用します。
          </p>
        </section>
      </div>
    </main>
  );
}