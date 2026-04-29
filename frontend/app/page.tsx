/**
 * 메인 — 단계 칸반 3열 (드래그&드롭).
 *
 * Server: 데이터 prefetch + token 검증
 * Client: Kanban (드래그·optimistic update·API 호출)
 */

import { listCategories, listProjects } from "@/lib/api";
import { Kanban } from "@/components/Kanban";
import { TIER_LABEL } from "@/lib/labels";
import type { Tier } from "@/lib/api";

type SearchParams = { tier?: string; category?: string; token?: string };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const tierFilter = (sp.tier as Tier) || undefined;
  const categoryFilter = sp.category ? Number(sp.category) : undefined;
  const tokenParam = sp.token || "";

  // 매니저 토큰 검증 (server-side, NEXT_PUBLIC_ 아님)
  const expected = process.env.MANAGE_TOKEN || "";
  const manageToken = expected && tokenParam === expected ? tokenParam : "";

  // 한 번에 모든 stage 받아옴 (드래그 변경에 즉시 반영하려면 통합 데이터 필요)
  const [categoriesRes, allRes] = await Promise.all([
    listCategories(),
    listProjects({ tier: tierFilter, category: categoryFilter }),
  ]);
  const categories = categoriesRes.results;
  const items = allRes.results;
  const totalCount = allRes.count;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr)",
        gap: "0.5rem",
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* 필터 바 (auto row) */}
      <section>
        <div className="text-xs text-slate-500 mb-1.5 flex items-center gap-3">
          <span>전체 {totalCount}건 · 카테고리 필터</span>
          {manageToken && (
            <span className="text-haro-600 font-semibold bg-haro-50 px-2 py-0.5 rounded">
              매니저 모드 ON
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <FilterChip
            href={withParams({ tier: undefined, category: undefined, token: tokenParam })}
            active={!tierFilter && !categoryFilter}
            label="전체"
          />
          {(["T1", "T2", "T3"] as Tier[]).map((t) => (
            <FilterChip
              key={t}
              href={withParams({ tier: t, category: undefined, token: tokenParam })}
              active={tierFilter === t && !categoryFilter}
              label={`${t}. ${TIER_LABEL[t]}`}
            />
          ))}
          <span className="border-l border-slate-200 mx-1 h-5" />
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              href={withParams({ category: String(c.id), tier: undefined, token: tokenParam })}
              active={categoryFilter === c.id}
              label={`${c.code} ${c.title}`}
            />
          ))}
          <span className="ml-auto text-xs text-slate-400">
            {manageToken ? "💡 카드를 다른 단계로 끌어 옮기세요" : "👀 read-only"}
          </span>
        </div>
      </section>

      {/* 칸반 (client) — minmax(0,1fr) row 차지 */}
      <div style={{ minHeight: 0 }}>
        <Kanban initialItems={items} manageToken={manageToken} />
      </div>
    </div>
  );
}

function withParams(p: { tier?: string; category?: string; token?: string }) {
  const qs = new URLSearchParams();
  if (p.tier) qs.set("tier", p.tier);
  if (p.category) qs.set("category", p.category);
  if (p.token) qs.set("token", p.token);
  const s = qs.toString();
  return s ? `/?${s}` : "/";
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  const base = "text-xs px-2.5 py-1 rounded-full border transition";
  const cls = active
    ? "bg-haro-500 text-white border-haro-500 font-semibold"
    : "bg-white text-slate-700 border-slate-200 hover:border-haro-500";
  return (
    <a href={href} className={`${base} ${cls}`}>
      {label}
    </a>
  );
}
