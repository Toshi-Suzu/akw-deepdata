// app/questions.ts
export type GroupKey =
  | "residence"
  | "companion_type"
  | "visit_frequency"
  | "trigger"
  | "info_source"
  | "top_interest"
  | "child_age_band";

export const QUESTION_VERSION = "v2026-03-04"; // 変更したら更新（任意）

export const GROUP_KEYS: GroupKey[] = [
  "residence",
  "companion_type",
  "visit_frequency",
  "trigger",
  "info_source",
  "top_interest",
  "child_age_band",
];

export const GROUP_TITLES: Record<GroupKey, string> = {
  residence: "居住地（residence）",
  companion_type: "同伴（companion_type）",
  visit_frequency: "来館頻度（visit_frequency）",
  trigger: "きっかけ（trigger）",
  info_source: "情報源（info_source）",
  top_interest: "見たかった展示（top_interest）",
  child_age_band: "子どもの年齢（child_age_band）",
};

// API側のホワイトリスト（valueの一覧）もここを使う
export const ALLOWED = {
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