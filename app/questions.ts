// app/questions.ts
export type Option = { value: string; label: string };

export type StepKey =
  | "age_band"
  | "gender"
  | "residence"
  | "companion_type"
  | "child_with"
  | "child_age_band"
  | "visit_frequency"
  | "trigger"
  | "info_source"
  | "top_interest";

export type Step = {
  key: StepKey;
  title: string;
  description?: string;
  options: Option[];
  required?: boolean;
};

export type GroupKey =
  | "residence"
  | "companion_type"
  | "child_with"
  | "child_age_band"
  | "visit_frequency"
  | "trigger"
  | "info_source"
  | "top_interest";

export const QUESTION_VERSION = "v2026-03-07";

// ----------------------
// 選択肢
// ----------------------
export const OPTIONS: Record<StepKey, Option[]> = {
  age_band: [
    { value: "10代", label: "10代" },
    { value: "20代", label: "20代" },
    { value: "30代", label: "30代" },
    { value: "40代", label: "40代" },
    { value: "50代", label: "50代" },
    { value: "60代+", label: "60代以上" },
  ],

  gender: [
    { value: "女性", label: "女性" },
    { value: "男性", label: "男性" },
    { value: "回答しない", label: "回答しない" },
  ],

  residence: [
    { value: "名古屋市", label: "名古屋市" },
    { value: "愛知県（名古屋以外）", label: "愛知県（名古屋以外）" },
    { value: "東海地方", label: "東海地方（岐阜・三重・静岡など）" },
    { value: "関東", label: "関東（首都圏）" },
    { value: "関西", label: "関西（近畿）" },
    { value: "その他", label: "その他（国内）" },
    { value: "海外", label: "海外" },
  ],

  companion_type: [
    { value: "家族", label: "家族" },
    { value: "夫婦/カップル", label: "夫婦/カップル" },
    { value: "友人", label: "友人" },
    { value: "1人", label: "1人" },
    { value: "団体", label: "団体" },
    { value: "その他", label: "その他" },
  ],

  child_with: [
    { value: "はい", label: "はい" },
    { value: "いいえ", label: "いいえ" },
  ],

  child_age_band: [
    { value: "0〜3歳", label: "0〜3歳" },
    { value: "4〜6歳", label: "4〜6歳" },
    { value: "小学生", label: "小学生" },
    { value: "中学生以上", label: "中学生以上" },
    { value: "複数いる／幅広い", label: "複数いる／幅広い" },
    { value: "回答しない", label: "回答しない" },
  ],

  visit_frequency: [
    { value: "初めて", label: "初めて" },
    { value: "数年ぶり", label: "数年ぶり" },
    { value: "1〜2年に1回", label: "1〜2年に1回" },
    { value: "ほぼ毎年", label: "ほぼ毎年" },
    { value: "年2回以上", label: "年2回以上" },
  ],

  trigger: [
    { value: "子どもが行きたいと言った", label: "子どもが行きたいと言った" },
    { value: "以前から来てみたかった", label: "以前から来てみたかった" },
    { value: "旅行の予定に入っていた", label: "旅行の予定に入っていた" },
    { value: "学習・教育目的", label: "学習・教育目的" },
    { value: "デート・レジャー", label: "デート・レジャー" },
    { value: "イベント", label: "イベント" },
    { value: "家族・友人に勧められた", label: "家族・友人に勧められた" },
    { value: "特に理由はない", label: "特に理由はない" },
  ],

  info_source: [
    { value: "SNS", label: "SNS" },
    { value: "YouTube", label: "YouTube" },
    { value: "テレビ", label: "テレビ" },
    { value: "旅行サイト", label: "旅行サイト" },
    { value: "公式サイト", label: "公式サイト" },
    { value: "学校", label: "学校" },
    { value: "家族・友人", label: "家族・友人" },
    { value: "特にない", label: "特にない" },
  ],

  top_interest: [
    { value: "シャチ", label: "シャチ" },
    { value: "イルカ", label: "イルカ" },
    { value: "ベルーガ", label: "ベルーガ" },
    { value: "黒潮大水槽", label: "黒潮大水槽" },
    { value: "深海", label: "深海" },
    { value: "サンゴ水槽", label: "サンゴ水槽" },
    { value: "ウミガメ", label: "ウミガメ" },
    { value: "ペンギン", label: "ペンギン" },
    { value: "くらげ", label: "くらげ" },
    { value: "特にない", label: "特にない" },
  ],
};

// ----------------------
// ステップ順
// ----------------------
export const BASE_STEPS: Step[] = [
  { key: "age_band", title: "あなたの年代を教えてください。", options: OPTIONS.age_band, required: true },
  { key: "gender", title: "性別を教えてください。", options: OPTIONS.gender, required: true },
  {
    key: "residence",
    title: "お住まいの地域を教えてください。",
    description: "分析の精度が上がります（個人特定には使いません）",
    options: OPTIONS.residence,
    required: true,
  },
  {
    key: "companion_type",
    title: "今回はどなたと来館しましたか？",
    options: OPTIONS.companion_type,
    required: true,
  },
  {
    key: "child_with",
    title: "今回のご来館では、保護者としてお子さま（18歳未満）を同伴していますか？",
    options: OPTIONS.child_with,
    required: true,
  },
  {
    key: "visit_frequency",
    title: "名古屋港水族館にはどのくらいの頻度で来館しますか？",
    options: OPTIONS.visit_frequency,
    required: true,
  },
  {
    key: "trigger",
    title: "今回、来館しようと思った一番の理由は何ですか？",
    options: OPTIONS.trigger,
    required: true,
  },
  {
    key: "info_source",
    title: "名古屋港水族館の情報をどこで知りましたか？",
    options: OPTIONS.info_source,
    required: true,
  },
  {
    key: "top_interest",
    title: "今回一番楽しみにしていた展示は何ですか？",
    options: OPTIONS.top_interest,
    required: true,
  },
];

export const CHILD_AGE_STEP: Step = {
  key: "child_age_band",
  title: "同伴しているお子さまの年齢を教えてください。",
  description: "お子さま（18歳未満）を同伴している場合のみご回答ください。",
  options: OPTIONS.child_age_band,
  required: true,
};

// ----------------------
// admin集計の順序/見出し
// ----------------------
export const GROUP_KEYS: GroupKey[] = [
  "residence",
  "companion_type",
  "child_with",
  "child_age_band",
  "visit_frequency",
  "trigger",
  "info_source",
  "top_interest",
];

export const GROUP_TITLES: Record<GroupKey, string> = {
  residence: "居住地（residence）",
  companion_type: "同伴（companion_type）",
  child_with: "子ども同伴（child_with）",
  child_age_band: "子どもの年齢（child_age_band）",
  visit_frequency: "来館頻度（visit_frequency）",
  trigger: "きっかけ（trigger）",
  info_source: "情報源（info_source）",
  top_interest: "見たかった展示（top_interest）",
};

// ----------------------
// APIバリデーション用
// ----------------------
const values = (k: StepKey) => OPTIONS[k].map((o) => o.value) as readonly string[];

export const ALLOWED = {
  age_band: values("age_band"),
  gender: values("gender"),
  residence: values("residence"),
  companion_type: values("companion_type"),
  child_with: values("child_with"),
  child_age_band: values("child_age_band"),
  visit_frequency: values("visit_frequency"),
  trigger: values("trigger"),
  info_source: values("info_source"),
  top_interest: values("top_interest"),
} as const;