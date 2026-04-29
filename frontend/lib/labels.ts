import type { Difficulty, PriorityCode, Stage, StatusCode, Tier } from "./api";

export const STAGE_LABEL: Record<Stage, string> = {
  1: "1단계 — 담당자 직접",
  2: "2단계 — 위임 후보",
  3: "3단계 — 직접 위임",
};

export const STAGE_DESC: Record<Stage, string> = {
  1: "P2/P3 또는 미평가. 담당자가 직접 진행.",
  2: "P0/P1 + 난이도 낮음 + 미배포. 인솔파 위임 후보.",
  3: "P0 + 난이도 높음 + 배포. 인솔파 직접 위임.",
};

export const PRIORITY_LABEL: Record<PriorityCode, string> = {
  P0: "P0",
  P1: "P1",
  P2: "P2",
  P3: "P3",
  unset: "—",
};

export const PRIORITY_COLOR: Record<PriorityCode, string> = {
  P0: "bg-p0 text-white",
  P1: "bg-p1 text-white",
  P2: "bg-p2 text-amber-900",
  P3: "bg-p3 text-white",
  unset: "bg-slate-200 text-slate-600",
};

export const TIER_LABEL: Record<Tier, string> = {
  T1: "수강생 케어·운영",
  T2: "콘텐츠·지식 인프라",
  T3: "업무·행정·CS",
};

export const TIER_COLOR: Record<Tier, string> = {
  T1: "bg-tier1 text-white",
  T2: "bg-tier2 text-white",
  T3: "bg-tier3 text-white",
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  low: "낮음",
  mid: "중간",
  high: "높음",
  unset: "미평가",
};

export const STATUS_LABEL: Record<StatusCode, string> = {
  not_started: "시작 전",
  in_progress: "진행 중",
  done: "완료",
  archived: "보관",
};
