/**
 * 메인 — 단계 칸반 3열 (퍼블릭 read-only).
 *
 * D2 MVP: 칸반 3열 + 카테고리 필터(쿼리) + 카드. 익명도 볼 수 있음.
 */

import { listCategories, listProjects } from "@/lib/api";
import { ProjectCard } from "@/components/ProjectCard";
import { STAGE_DESC, STAGE_LABEL, TIER_LABEL } from "@/lib/labels";
import type { Stage, Tier } from "@/lib/api";

type SearchParams = { tier?: string; category?: string };

const STAGES: Stage[] = [1, 2, 3];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const tierFilter = (sp.tier as Tier) || undefined;
  const categoryFilter = sp.category ? Number(sp.category) : undefined;

  const [categoriesRes, ...stageData] = await Promise.all([
    listCategories(),
    ...STAGES.map((s) =>
      listProjects({ stage: s, tier: tierFilter, category: categoryFilter })
    ),
  ]);
  const categories = categoriesRes.results;

  const totalCount = stageData.reduce((acc, d) => acc + d.count, 0);

  return (
    <div>
      {/* 필터 바 */}
      <section className="mb-6">
        <div className="text-xs text-slate-500 mb-2">
          전체 {totalCount}건 · 카테고리 필터
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            href="/"
            active={!tierFilter && !categoryFilter}
            label="전체"
          />
          {(["T1", "T2", "T3"] as Tier[]).map((t) => (
            <FilterChip
              key={t}
              href={`/?tier=${t}`}
              active={tierFilter === t && !categoryFilter}
              label={`${t}. ${TIER_LABEL[t]}`}
              tierColor={t}
            />
          ))}
          <span className="border-l border-slate-200 mx-1 my-1" />
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              href={`/?category=${c.id}`}
              active={categoryFilter === c.id}
              label={`${c.code} ${c.title}`}
            />
          ))}
        </div>
      </section>

      {/* 칸반 3열 */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {STAGES.map((stage, i) => {
          const items = stageData[i].results;
          return (
            <div
              key={stage}
              className="bg-slate-100 rounded-xl p-4 min-h-[240px]"
            >
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="font-bold text-base">{STAGE_LABEL[stage]}</h2>
                <span className="text-xs text-slate-500 font-semibold">
                  {items.length}건
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3 pb-3 border-b border-slate-200">
                {STAGE_DESC[stage]}
              </p>
              <div className="space-y-2">
                {items.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-8">
                    (해당 단계 항목 없음)
                  </div>
                ) : (
                  items.map((p) => <ProjectCard key={p.id} p={p} />)
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
  tierColor,
}: {
  href: string;
  active: boolean;
  label: string;
  tierColor?: Tier;
}) {
  const base = "text-xs px-2.5 py-1 rounded-full border transition";
  const cls = active
    ? "bg-haro-500 text-white border-haro-500 font-semibold"
    : tierColor
    ? "bg-white text-slate-700 border-slate-200 hover:border-haro-500"
    : "bg-white text-slate-700 border-slate-200 hover:border-haro-500";
  return (
    <a href={href} className={`${base} ${cls}`}>
      {label}
    </a>
  );
}
