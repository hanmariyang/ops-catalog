/**
 * 그룹 상세 — 그룹 메타 + 소속 프로젝트 카드 그리드.
 */

import Link from "next/link";
import { notFound } from "next/navigation";

import { getGroup } from "@/lib/api";
import {
  GROUP_BADGE,
  GROUP_BORDER,
  GROUP_COLOR_LABEL,
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  STAGE_LABEL,
  TIER_COLOR,
} from "@/lib/labels";
import { GroupEditPanel } from "@/components/GroupEditPanel";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let group;
  try {
    group = await getGroup(Number(id));
  } catch {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto py-2 overflow-y-auto">
      <Link href="/groups" className="text-xs text-haro-600 hover:underline">
        ← 그룹 목록
      </Link>

      <header
        className={`mt-3 bg-white rounded-xl border-2 px-5 py-4 ${GROUP_BORDER[group.color]}`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded border ${GROUP_BADGE[group.color]}`}
          >
            {group.name}
          </span>
          <span className="text-[10px] text-slate-500">
            {GROUP_COLOR_LABEL[group.color]} · 소속 {group.project_count}건
          </span>
        </div>
        {group.description && (
          <p className="text-sm text-slate-700 mt-3 whitespace-pre-wrap">
            {group.description}
          </p>
        )}
      </header>

      <section className="mt-6">
        <h2 className="text-xs font-bold text-slate-500 tracking-wider mb-2">
          소속 프로젝트 ({group.member_projects.length})
        </h2>
        {group.member_projects.length === 0 ? (
          <div className="text-xs text-slate-400 bg-white rounded-lg border border-slate-200 px-4 py-6 text-center">
            아직 이 그룹에 속한 프로젝트가 없습니다.
            <br />
            카탈로그에서 카드 → 상세 페이지의 "그룹" 섹션에서 추가할 수 있어요.
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-2">
            {group.member_projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  className="block bg-white rounded-md border border-slate-200 px-3 py-2 hover:border-haro-500 transition"
                >
                  <div className="flex items-start gap-1.5">
                    <span
                      className={`text-[9px] font-bold px-1 py-0.5 rounded leading-none ${PRIORITY_COLOR[p.priority]} flex-shrink-0`}
                    >
                      {PRIORITY_LABEL[p.priority]}
                    </span>
                    <div className="text-[12px] font-semibold leading-tight line-clamp-2 flex-1">
                      {p.title}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px] leading-none">
                    <span
                      className={`px-1 py-0.5 rounded font-bold ${TIER_COLOR[p.tier]}`}
                    >
                      {p.category_code}
                    </span>
                    <span className="text-slate-500">R{p.source_id}</span>
                    <span className="text-slate-400 truncate flex-1">
                      {p.proposer_display}
                    </span>
                    <span className="text-slate-500 flex-shrink-0">
                      {STAGE_LABEL[p.stage].split(" ")[0]}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xs font-bold text-slate-500 tracking-wider mb-2">
          그룹 편집
        </h2>
        <GroupEditPanel
          group={{
            id: group.id,
            name: group.name,
            description: group.description,
            color: group.color,
          }}
        />
      </section>
    </div>
  );
}
