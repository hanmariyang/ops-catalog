/**
 * 메인 — 단계 칸반 (드래그&드롭).
 *
 * 인증 도입 전 누구나 read+write.
 */

import { listCategories, listGroups, listProjects } from "@/lib/api";
import { Kanban } from "@/components/Kanban";
import { SearchBox } from "@/components/SearchBox";
import { GROUP_BADGE, TIER_LABEL } from "@/lib/labels";
import type { Tier } from "@/lib/api";

type SearchParams = {
  tier?: string;
  category?: string;
  group?: string;
  archived?: string;
  q?: string;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const tierFilter = (sp.tier as Tier) || undefined;
  const categoryFilter = sp.category ? Number(sp.category) : undefined;
  const groupFilter = sp.group ? Number(sp.group) : undefined;
  const archivedView = sp.archived === "1";
  const searchQuery = (sp.q ?? "").trim();

  const [categoriesRes, groupsRes, allRes] = await Promise.all([
    listCategories(),
    listGroups(),
    listProjects({
      tier: tierFilter,
      category: categoryFilter,
      group: groupFilter,
      search: searchQuery || undefined,
      ...(archivedView ? { status: "archived" } : {}),
    }),
  ]);
  const categories = categoriesRes.results;
  const groups = groupsRes.results;
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
      {/* 필터 바 */}
      <section>
        <div className="text-xs text-slate-500 mb-1.5 flex items-center gap-3 flex-wrap">
          <SearchBox />
          <span>
            {searchQuery && <span className="text-haro-600 font-semibold">"{searchQuery}" </span>}
            {archivedView ? "보관함" : "전체"} {totalCount}건
            {groupFilter && groups.find((g) => g.id === groupFilter)
              ? ` · 그룹: ${groups.find((g) => g.id === groupFilter)!.name}`
              : " · 카테고리/그룹 필터"}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <FilterChip
            href={withParams({ archived: archivedView ? "1" : undefined, q: searchQuery || undefined })}
            active={!tierFilter && !categoryFilter && !groupFilter}
            label="전체"
          />
          {(["T1", "T2", "T3"] as Tier[]).map((t) => (
            <FilterChip
              key={t}
              href={withParams({ tier: t, archived: archivedView ? "1" : undefined, q: searchQuery || undefined })}
              active={tierFilter === t && !categoryFilter && !groupFilter}
              label={`${t}. ${TIER_LABEL[t]}`}
            />
          ))}
          <span className="border-l border-slate-200 mx-1 h-5" />
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              href={withParams({ category: String(c.id), archived: archivedView ? "1" : undefined, q: searchQuery || undefined })}
              active={categoryFilter === c.id}
              label={`${c.code} ${c.title}`}
            />
          ))}
          {groups.length > 0 && (
            <>
              <span className="border-l border-slate-200 mx-1 h-5" />
              {groups.map((g) => {
                const active = groupFilter === g.id;
                return (
                  <a
                    key={g.id}
                    href={withParams({ group: String(g.id), archived: archivedView ? "1" : undefined, q: searchQuery || undefined })}
                    className={`text-xs px-2.5 py-1 rounded-full border transition ${
                      active
                        ? `${GROUP_BADGE[g.color]} font-semibold ring-2 ring-haro-500 ring-offset-1`
                        : `${GROUP_BADGE[g.color]} opacity-60 hover:opacity-100`
                    }`}
                  >
                    {g.name}
                  </a>
                );
              })}
            </>
          )}
          <span className="border-l border-slate-200 mx-1 h-5" />
          <FilterChip
            href={withParams({
              tier: tierFilter,
              category: categoryFilter ? String(categoryFilter) : undefined,
              group: groupFilter ? String(groupFilter) : undefined,
              archived: archivedView ? undefined : "1",
              q: searchQuery || undefined,
            })}
            active={archivedView}
            label={archivedView ? "← 활성으로" : "🗄 보관함"}
          />
          <span className="ml-auto text-xs text-slate-400">
            {archivedView ? "보관된 항목 — 복구는 상세 페이지" : "💡 카드를 다른 단계로 끌어 옮기세요"}
          </span>
        </div>
      </section>

      <div style={{ minHeight: 0 }}>
        <Kanban initialItems={items} archivedView={archivedView} />
      </div>
    </div>
  );
}

function withParams(p: {
  tier?: string;
  category?: string;
  group?: string;
  archived?: string;
  q?: string;
}) {
  const qs = new URLSearchParams();
  if (p.tier) qs.set("tier", p.tier);
  if (p.category) qs.set("category", p.category);
  if (p.group) qs.set("group", p.group);
  if (p.archived) qs.set("archived", p.archived);
  if (p.q) qs.set("q", p.q);
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
