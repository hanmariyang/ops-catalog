/**
 * 그룹 리스트.
 *
 * 단계와 직교한 주제·도메인 묶음. 한 프로젝트가 여러 그룹에 속할 수 있음 (N:N).
 */

import Link from "next/link";

import { listGroups } from "@/lib/api";
import { GROUP_BADGE, GROUP_BORDER, GROUP_COLOR_LABEL } from "@/lib/labels";
import { GroupCreateForm } from "@/components/GroupCreateForm";

export default async function GroupsPage() {
  const groupsRes = await listGroups();
  const groups = groupsRes.results;

  return (
    <div className="max-w-5xl mx-auto py-2 overflow-y-auto">
      <div className="text-xs font-bold text-haro-600 tracking-wider">GROUPS</div>
      <div className="flex items-baseline gap-3 mt-1">
        <h1 className="text-2xl font-bold">그룹</h1>
        <Link href="/" className="text-xs text-haro-600 hover:underline">
          ← 카탈로그
        </Link>
      </div>
      <p className="text-sm text-slate-500 mt-2">
        프로젝트를 주제별로 묶어 관리. 한 프로젝트는 여러 그룹에 속할 수 있어요.
      </p>

      <section className="mt-6">
        <h2 className="text-xs font-bold text-slate-500 tracking-wider mb-2">
          전체 ({groups.length})
        </h2>
        {groups.length === 0 ? (
          <div className="text-xs text-slate-400 bg-white rounded-lg border border-slate-200 px-4 py-6 text-center">
            아직 그룹이 없어요. 아래에서 첫 그룹을 만들어보세요.
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-2">
            {groups.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/groups/${g.id}`}
                  className={`block bg-white rounded-lg border-2 px-4 py-3 hover:border-haro-500 transition ${GROUP_BORDER[g.color]}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded border ${GROUP_BADGE[g.color]}`}
                    >
                      {g.name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {g.project_count}건 · {GROUP_COLOR_LABEL[g.color]}
                    </span>
                  </div>
                  {g.description && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                      {g.description}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xs font-bold text-slate-500 tracking-wider mb-2">
          신규 그룹
        </h2>
        <GroupCreateForm />
      </section>
    </div>
  );
}
