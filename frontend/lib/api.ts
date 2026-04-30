/**
 * 백엔드 API fetch 헬퍼.
 *
 * - 서버 컴포넌트(SSR)에서는 Docker 내부 BACKEND_API_URL 사용
 * - 클라이언트에서는 NEXT_PUBLIC_API_URL 사용
 */

const SERVER_BASE = process.env.BACKEND_API_URL || "http://backend:8000";

const isServer = typeof window === "undefined";

// 서버 컴포넌트(SSR): Docker 내부 BACKEND_API_URL 직접 호출 (절대 URL 필요).
// 클라이언트(브라우저): same-origin proxy ('/api/*' → next.config rewrites → backend).
//   build-time NEXT_PUBLIC_* inline 의존성 제거.
export const apiBase = isServer ? SERVER_BASE : "";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText} — ${path}`);
  }
  return res.json() as Promise<T>;
}

// ── 도메인 타입 ────────────────────────────────────

export type Tier = "T1" | "T2" | "T3";
export type Stage = 1 | 2 | 3 | 4;
export type PriorityCode = "P0" | "P1" | "P2" | "P3" | "unset";
export type Difficulty = "low" | "mid" | "high" | "unset";
export type StatusCode = "not_started" | "in_progress" | "done" | "archived";

export type ProjectListItem = {
  id: number;
  source_id: number;
  title: string;
  proposer_display: string;
  category_code: string;
  category_title: string;
  tier: Tier;
  priority: PriorityCode;
  difficulty: Difficulty;
  stage: Stage;
  status: StatusCode;
  deploy_intent: boolean;
};

export type Category = {
  id: number;
  code: string;
  tier: Tier;
  num: number;
  title: string;
  note: string;
};

export type ProjectDetail = ProjectListItem & {
  description: string;
  org: string;
  impact_scope: string;
  manual_minutes: number | null;
  monthly_uses: number | null;
  category: Category;
  suggested_stage: Stage;
  suggestion_reason: string;
  result_url: string;
  name_public: boolean;
  stage_transitions: {
    id: number;
    from_stage: number | null;
    to_stage: number;
    reason: string;
    actor_label: string;
    created_at: string;
  }[];
  evaluations: {
    id: number;
    difficulty: Difficulty;
    est_effort_days: number | null;
    deploy_intent: boolean;
    note: string;
    created_at: string;
  }[];
  created_at: string;
  updated_at: string;
};

export async function listProjects(params?: {
  stage?: Stage;
  tier?: Tier;
  category?: number;
}): Promise<{ count: number; results: ProjectListItem[] }> {
  const qs = new URLSearchParams();
  if (params?.stage) qs.set("stage", String(params.stage));
  if (params?.tier) qs.set("tier", params.tier);
  if (params?.category) qs.set("category", String(params.category));
  qs.set("page_size", "100");
  return apiFetch(`/api/v1/projects/?${qs.toString()}`);
}

export async function getProject(id: number): Promise<ProjectDetail> {
  return apiFetch(`/api/v1/projects/${id}/`);
}

export async function listCategories(): Promise<{ count: number; results: Category[] }> {
  return apiFetch(`/api/v1/categories/`);
}
