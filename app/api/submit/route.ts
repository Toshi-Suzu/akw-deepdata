import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const allowed = {
  age_band: ["10代", "20代", "30代", "40代", "50代", "60代+"] as const,
  gender: ["女性", "男性", "回答しない"] as const,
  residence: ["名古屋市", "愛知県（名古屋以外）", "東海地方", "関東", "関西", "その他", "海外"] as const,
  companion_type: ["小学生以下の子どもと", "中高生の子どもと", "夫婦/カップル", "友人", "1人", "団体"] as const,
  visit_frequency: ["初めて", "数年ぶり", "1〜2年に1回", "ほぼ毎年", "年2回以上"] as const,
  trigger: [
    "子どもが行きたいと言った",
    "以前から来たかった",
    "SNSで見た",
    "テレビ・メディア",
    "旅行",
    "学校・学習",
    "イベント",
    "友人・知人の紹介",
  ] as const,
  info_source: ["SNS", "YouTube", "テレビ", "旅行サイト", "学校", "家族・友人", "特にない"] as const,
  top_interest: ["シャチ", "イルカ", "ペンギン", "ウミガメ", "サンゴ水槽", "深海", "特にない"] as const,
  child_age_band: ["0〜3歳", "4〜6歳", "小学生"] as const,
};

function isAllowed<T extends readonly string[]>(arr: T, v: any): v is T[number] {
  return typeof v === "string" && (arr as readonly string[]).includes(v);
}

function isNonEmptyString(v: any) {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // --- 追加：一人一回答（同一端末×同一日）用の入力検証 ---
    if (!isNonEmptyString(body.respondent_id)) {
      return NextResponse.json({ error: "invalid respondent_id" }, { status: 400 });
    }
    // visit_key は YYYY-MM-DD 形式（JSTでフロントが作る前提）
    if (!isNonEmptyString(body.visit_key) || !/^\d{4}-\d{2}-\d{2}$/.test(body.visit_key)) {
      return NextResponse.json({ error: "invalid visit_key" }, { status: 400 });
    }

    // 必須項目バリデーション（ホワイトリスト）
    if (!isAllowed(allowed.age_band, body.age_band)) {
      return NextResponse.json({ error: "invalid age_band" }, { status: 400 });
    }
    if (!isAllowed(allowed.gender, body.gender)) {
      return NextResponse.json({ error: "invalid gender" }, { status: 400 });
    }
    if (!isAllowed(allowed.residence, body.residence)) {
      return NextResponse.json({ error: "invalid residence" }, { status: 400 });
    }
    if (!isAllowed(allowed.companion_type, body.companion_type)) {
      return NextResponse.json({ error: "invalid companion_type" }, { status: 400 });
    }
    if (!isAllowed(allowed.visit_frequency, body.visit_frequency)) {
      return NextResponse.json({ error: "invalid visit_frequency" }, { status: 400 });
    }
    if (!isAllowed(allowed.trigger, body.trigger)) {
      return NextResponse.json({ error: "invalid trigger" }, { status: 400 });
    }
    if (!isAllowed(allowed.info_source, body.info_source)) {
      return NextResponse.json({ error: "invalid info_source" }, { status: 400 });
    }
    if (!isAllowed(allowed.top_interest, body.top_interest)) {
      return NextResponse.json({ error: "invalid top_interest" }, { status: 400 });
    }

    // 条件分岐項目（任意だが、条件に当てはまる場合は必須）
    const needsChildAge =
      body.age_band === "30代" &&
      body.gender === "女性" &&
      (body.companion_type === "小学生以下の子どもと" || body.companion_type === "中高生の子どもと");

    if (needsChildAge) {
      if (!isAllowed(allowed.child_age_band, body.child_age_band)) {
        return NextResponse.json({ error: "invalid child_age_band" }, { status: 400 });
      }
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from("responses").insert({
      staff_email: null,

      // --- 追加：一人一回答キー ---
      respondent_id: body.respondent_id,
      visit_key: body.visit_key,

      // 既存項目
      age_band: body.age_band,
      gender: body.gender,
      residence: body.residence,
      companion_type: body.companion_type,
      visit_frequency: body.visit_frequency,
      trigger: body.trigger,
      info_source: body.info_source,
      top_interest: body.top_interest,
      child_age_band: needsChildAge ? body.child_age_band : null,
    });

    if (error) {
      // --- 追加：ユニーク違反は「本日は回答済み」扱いにする ---
      const msg = (error.message ?? "").toLowerCase();
      if (msg.includes("duplicate") || msg.includes("unique")) {
        return NextResponse.json(
          { error: "already answered today" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}