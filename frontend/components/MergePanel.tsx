"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import type { MergedChild, MergedInto, ProjectListItem } from "@/lib/api";
import { PRIORITY_COLOR, PRIORITY_LABEL } from "@/lib/labels";

type Props = {
  projectId: number;
  mergedInto: MergedInto | null;
  mergedChildren: MergedChild[];
  candidates: ProjectListItem[]; // 병합 대상 후보 (자기 자신·자식·이미 자식인 메인 제외 처리는 이 컴포넌트에서)
  currentCategoryCode?: string; // 빈 query 일 때 같은 카테고리 후보 우선 정렬용
  currentCategoryId?: number;
};

/**
 * 프로젝트 병합 (Merge) 패널 — 단일 레벨, 본문 분리 보존.
 *
 * 상태별 UI:
 *  - 자식 보유 (merged_children) → 자식 리스트 + [분리]
 *  - 부모 보유 (merged_into)     → 안내 banner + [병합 해제]
 *  - 둘 다 아님                   → 검색·셀렉트 + [병합]
 *
 * 자식 보유와 부모 보유가 동시에 일어날 수 없도록 백엔드에서 제약 (chain 방지).
 */
export function MergePanel({
  projectId,
  mergedInto,
  mergedChildren,
  candidates,
  currentCategoryCode,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // 병합 대상 후보.
  // - 제외: 자기 자신
  // - 백엔드 추가 제약 (단일 레벨): 자식 보유 메인은 자식이 될 수 없음 → UI 에서도 가능 후보로 노출은 하되,
  //   사용자가 클릭 시 백엔드가 거부 (이미 자식인 메인 / chain). 표시상 "메인 (N건)" 배지로 안내.
  // 정렬:
  //   query 없을 때 → 같은 카테고리 우선 → 같은 tier → source_id 오름차순 (Top 8 고정 노출)
  //   query 있을 때 → 일치 점수 우선 (제목 hit > 제안자 > source_id) 후 source_id (Top 8)
  const eligible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = candidates.filter((p) => p.id !== projectId);

    if (!q) {
      const sorted = [...pool].sort((a, b) => {
        const aSame = a.category_code === currentCategoryCode ? 1 : 0;
        const bSame = b.category_code === currentCategoryCode ? 1 : 0;
        if (aSame !== bSame) return bSame - aSame; // 같은 카테고리 우선
        const aTier = a.tier;
        const bTier = b.tier;
        if (aTier !== bTier) return aTier.localeCompare(bTier);
        return a.source_id - b.source_id;
      });
      return sorted.slice(0, 8);
    }

    return pool
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.proposer_display.toLowerCase().includes(q) ||
          String(p.source_id).includes(q),
      )
      .slice(0, 8);
  }, [candidates, projectId, query, currentCategoryCode]);

  async function call(path: string, body?: unknown) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const text = await res.text();
        let detail = text;
        try {
          detail = JSON.parse(text).detail || text;
        } catch {
          /* ignore */
        }
        setMsg({ kind: "err", text: `${res.status}: ${detail.slice(0, 200)}` });
        return false;
      }
      router.refresh();
      return true;
    } catch (err) {
      setMsg({ kind: "err", text: (err as Error).message });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function onMerge(mainId: number) {
    const target = candidates.find((c) => c.id === mainId);
    const ok = confirm(
      `이 프로젝트를\n  → "${target?.title}"\n에 병합할까요?\n\n칸반에서 자식으로 흡수되어 메인 카드 안에 작게 표시됩니다.\n언제든 분리할 수 있어요.`,
    );
    if (!ok) return;
    await call(`/api/v1/projects/${projectId}/merge-into/`, { main_id: mainId });
    setQuery("");
  }

  async function onUnmerge() {
    const ok = confirm("이 프로젝트를 메인에서 분리할까요?\n다시 독립 프로젝트로 칸반에 보입니다.");
    if (!ok) return;
    await call(`/api/v1/projects/${projectId}/unmerge/`);
  }

  async function onReleaseChild(childId: number, childTitle: string) {
    const ok = confirm(`"${childTitle}" 을 이 메인에서 분리할까요?`);
    if (!ok) return;
    await call(`/api/v1/projects/${childId}/unmerge/`);
  }

  return (
    <section className="mt-4 bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-bold text-slate-400 tracking-wider">
          병합 (MERGE)
        </div>
        {msg && (
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              msg.kind === "ok" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            }`}
          >
            {msg.text}
          </span>
        )}
      </div>

      {/* 자식인 경우 — 부모 안내 + 해제 */}
      {mergedInto && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs flex items-center gap-3">
          <span className="text-amber-700 font-semibold">⤴ 메인:</span>
          <Link
            href={`/projects/${mergedInto.id}`}
            className="text-haro-600 hover:underline font-semibold flex-1 truncate"
          >
            R{mergedInto.source_id} · {mergedInto.title}
          </Link>
          <button
            type="button"
            onClick={onUnmerge}
            disabled={busy}
            className="text-xs font-semibold px-3 py-1.5 rounded border border-amber-400 text-amber-800 bg-white hover:bg-amber-100 disabled:opacity-50"
          >
            병합 해제
          </button>
        </div>
      )}

      {/* 메인인 경우 — 자식 리스트 + 분리 */}
      {mergedChildren.length > 0 && (
        <div>
          <div className="text-[10px] font-bold text-slate-500 tracking-wider mb-2">
            병합된 프로젝트 ({mergedChildren.length})
          </div>
          <ul className="space-y-1">
            {mergedChildren.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-2 text-xs bg-slate-50 rounded px-2 py-1.5 border border-slate-200"
              >
                <span
                  className={`text-[9px] font-bold px-1 py-0.5 rounded leading-none ${PRIORITY_COLOR[c.priority]} flex-shrink-0`}
                >
                  {PRIORITY_LABEL[c.priority]}
                </span>
                <span className="text-slate-400 flex-shrink-0">R{c.source_id}</span>
                <Link
                  href={`/projects/${c.id}`}
                  className="text-slate-700 truncate flex-1 hover:underline"
                >
                  {c.title}
                </Link>
                <span className="text-slate-500 flex-shrink-0 truncate max-w-[100px]">
                  {c.proposer_display}
                </span>
                <button
                  type="button"
                  onClick={() => onReleaseChild(c.id, c.title)}
                  disabled={busy}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-300 text-slate-600 bg-white hover:bg-slate-100 disabled:opacity-50 flex-shrink-0"
                >
                  분리
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 둘 다 아님 — 병합 대상 검색·선택 */}
      {!mergedInto && mergedChildren.length === 0 && (
        <div className="grid gap-2">
          <p className="text-xs text-slate-600">
            이 프로젝트가 다른 메인 프로젝트의 중복·변형이라면, 메인을 선택해 병합하세요.
            병합 후엔 칸반에서 메인 카드 안에 작게 표시됩니다.
          </p>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="메인 프로젝트 검색 (제목·제안자·R번호)"
            className="border rounded px-2 py-1.5 text-xs"
          />
          <div className="text-[10px] text-slate-500">
            {query.trim()
              ? `검색 결과 ${eligible.length}건`
              : `추천 후보 ${eligible.length}건${currentCategoryCode ? ` (같은 카테고리 ${currentCategoryCode} 우선)` : ""}`}
          </div>
          <ul className="grid gap-1 max-h-72 overflow-y-auto">
            {eligible.length === 0 ? (
              <li className="text-xs text-slate-400 px-2 py-2">
                {query.trim() ? "매칭되는 후보가 없어요." : "후보 프로젝트가 없어요."}
              </li>
            ) : (
              eligible.map((c) => {
                const sameCategory =
                  !query.trim() && currentCategoryCode === c.category_code;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => onMerge(c.id)}
                      disabled={busy}
                      className={`w-full text-left flex items-center gap-2 text-xs rounded px-2 py-1.5 border disabled:opacity-50 transition ${
                        sameCategory
                          ? "bg-haro-50 border-haro-200 hover:border-haro-500"
                          : "bg-slate-50 border-slate-200 hover:bg-haro-50 hover:border-haro-500"
                      }`}
                    >
                      <span
                        className={`text-[9px] font-bold px-1 py-0.5 rounded leading-none ${PRIORITY_COLOR[c.priority]} flex-shrink-0`}
                      >
                        {PRIORITY_LABEL[c.priority]}
                      </span>
                      <span className="text-slate-400 flex-shrink-0">R{c.source_id}</span>
                      <span className="text-slate-700 truncate flex-1 font-semibold">
                        {c.title}
                      </span>
                      <span className="text-slate-500 flex-shrink-0 truncate max-w-[100px]">
                        {c.proposer_display}
                      </span>
                      {sameCategory && (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-haro-200 text-haro-800 flex-shrink-0">
                          {c.category_code}
                        </span>
                      )}
                      {c.merged_children.length > 0 && (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-800 flex-shrink-0">
                          메인 ({c.merged_children.length}건)
                        </span>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </section>
  );
}
