// app/questions.ts
export type Option = { value: string; label: string };

export type StepKey =
  | "age_band"
  | "gender"
  | "residence"
  | "companion_type"
  | "visit_frequency"
  | "trigger"
  | "info_source"
  | "top_interest"
  | "child_age_band";

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
  | "visit_frequency"
  | "trigger"
  | "info_source"
  | "top_interest"
  | "child_age_band";

export const QUESTION_VERSION = "v2026-03-04"; // 変更したら更新（任意）

// --- フォーム表示用（labelは変更OK、valueは原則固定） ---
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
    { value: "小学生以下の子どもと", label: "小学生以下の子どもと" },
    { value: "中高生の子どもと", label: "中高生の子どもと" },
    { value: "夫婦/カップル", label: "夫婦/カップル" },
    { value: "友人", label: "友人" },
    { value: "1人", label: "1人" },
    { value: "団体", label: "団体" },
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
    { value: "以前から来たかった", label: "以前から来たかった" },
    { value: "SNSで見た", label: "SNSで見た" },
    { value: "テレビ・メディア", label: "テレビ・メディア" },
    { value: "旅行", label: "旅行" },
    { value: "学校・学習", label: "学校・学習" },
    { value: "イベント", label: "イベント" },
    { value: "友人・知人の紹介", label: "友人・知人の紹介" },
  ],
  info_source: [
    { value: "SNS", label: "SNS" },
    { value: "YouTube", label: "YouTube" },
    { value: "テレビ", label: "テレビ" },
    { value: "旅行サイト", label: "旅行サイト" },
    { value: "学校", label: "学校" },
    { value: "家族・友人", label: "家族・友人" },
    { value: "特にない", label: "特にない" },
  ],
  top_interest: [
    { value: "シャチ", label: "シャチ" },
    { value: "イルカ", label: "イルカ" },
    { value: "ペンギン", label: "ペンギン" },
    { value: "ウミガメ", label: "ウミガメ" },
    { value: "サンゴ水槽", label: "サンゴ水槽" },
    { value: "深海", label: "深海" },
    { value: "特にない", label: "特にない" },
  ],
  child_age_band: [
    { value: "0〜3歳", label: "0〜3歳" },
    { value: "4〜6歳", label: "4〜6歳" },
    { value: "小学生", label: "小学生" },
  ],
};

// --- フォームの基本ステップ順（条件分岐はフォーム側で挿入） ---
export const BASE_STEPS: Step[] = [
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

// --- admin集計の順序/見出し ---
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

// --- APIバリデーション用（valueの一覧＝OPTIONSから生成）---
const values = (k: StepKey) => OPTIONS[k].map((o) => o.value) as readonly string[];

export const ALLOWED = {
  age_band: values("age_band"),
  gender: values("gender"),
  residence: values("residence"),
  companion_type: values("companion_type"),
  visit_frequency: values("visit_frequency"),
  trigger: values("trigger"),
  info_source: values("info_source"),
  top_interest: values("top_interest"),
  child_age_band: values("child_age_band"),
} as const;