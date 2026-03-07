"use client";

import { useEffect, useMemo, useState } from "react";
import { BASE_STEPS, OPTIONS, type Step, type StepKey } from "@/app/questions";

type FormState = {
  age_band: string;
  gender: string;
  residence: string;
  companion_type: string;
  visit_frequency: string;
  trigger: string;
  info_source: string;
  top_interest: string;
  child_with: string;
  child_age_band?: string;
};

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
    child_with: "",
    child_age_band: "",
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [alreadyAnswered, setAlreadyAnswered] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("akw_answered_visit_key");
    if (saved === getVisitKeyJST()) setAlreadyAnswered(true);
  }, []);

  const needsChildAgeStep = form.child_with === "はい";

  const steps: Step[] = useMemo(() => {
    const s = [...BASE_STEPS];
    if (needsChildAgeStep) {
      const childWithIndex = s.findIndex((step) => step.key === "child_with");
      s.splice(childWithIndex + 1, 0, {
        key: "child_age_band",
        title: "同伴しているお子さまの年齢",
        description: "お子さま（18歳未満）を同伴している場合のみご回答ください",
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
    setForm((prev) => {
      const next = { ...prev, [stepKey]: value };

      // 子ども同伴なしに変えたら年齢はクリア
      if (stepKey === "child_with" && value !== "はい") {
        next.child_age_band = "";
      }

      return next;
    });

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

  async function submit() {
    setMsg(null);
    setIsError(false);
    setIsSubmitting(true);

    const payload: any = {
      ...form,
      respondent_id: getRespondentId(),
      visit_key: getVisitKeyJST(),
      child_with: form.child_with || "",
      child_age_band: form.child_with === "はい" ? form.child_age_band || "" : "",
    };

    if (!needsChildAgeStep) delete payload.child_age_band;

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setIsError(true);
        setMsg(data.error ?? "送信に失敗しました");
      } else {
        setIsError(false);
        setMsg(editMode ? "修正内容を保存しました（上書きOK）" : "送信しました（ご協力ありがとうございました）");

        localStorage.setItem("akw_answered_visit_key", getVisitKeyJST());
        setAlreadyAnswered(true);
        setEditMode(false);
      }
    } catch {
      setIsError(true);
      setMsg("通信に失敗しました（ネットワークをご確認ください）");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLast = stepIndex === steps.length - 1;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-5">
          <div className="flex items-center gap-3">
            //<span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
              //匿名・ログイン不要
            //</span>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              名古屋港水族館 来館アンケート
            </h1>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            設問は最小限です（約1分）。個人を特定する情報は収集しません。
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

          {alreadyAnswered && !editMode && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
              本日は回答済みです（誤入力があれば「回答を修正する」から上書きできます）
            </div>
          )}
          {editMode && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
              修正モード：この送信は本日の回答を上書きします
            </div>
          )}
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
                disabled={!canGoNext || isSubmitting || (alreadyAnswered && !editMode)}
                className="ml-auto rounded-xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {alreadyAnswered && !editMode
                  ? "本日は回答済み"
                  : isSubmitting
                    ? "送信中..."
                    : "送信"}
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

          {alreadyAnswered && !editMode && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditMode(true);
                  setMsg(null);
                  setIsError(false);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                回答を修正する
              </button>
              <p className="text-xs text-slate-500">
                ※同じ日なら上書き保存されます（誤入力の修正用）
              </p>
            </div>
          )}

          {editMode && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                修正をやめる
              </button>
              <p className="text-xs text-slate-500">
                ※送信しなければ上書きされません
              </p>
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