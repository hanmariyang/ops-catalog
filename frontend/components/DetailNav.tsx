"use client";

import Link from "next/link";

import type { MergedInto } from "@/lib/api";

type Section = {
  id: string;
  label: string;
  visible?: boolean;
};

type Props = {
  hasHistory: boolean;
  mergedInto: MergedInto | null;
};

/**
 * 상세 페이지 상단 sticky anchor nav.
 * 섹션 점프 + 자식인 경우 우측에 "⤴ 메인: …" 칩 (메인 프로젝트로 점프).
 */
export function DetailNav({ hasHistory, mergedInto }: Props) {
  const sections: Section[] = [
    { id: "section-original", label: "원문" },
    { id: "section-mutable", label: "평가" },
    { id: "section-edit", label: "편집" },
    { id: "section-groups", label: "그룹" },
    { id: "section-merge", label: "병합" },
    { id: "section-history", label: "이력", visible: hasHistory },
  ];

  function jump(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // URL hash 갱신 (history 안 쌓이게 replace)
      history.replaceState(null, "", `#${id}`);
    }
  }

  return (
    <div className="sticky top-0 z-10 -mx-1 px-1 py-1.5 bg-slate-50/95 backdrop-blur border-b border-slate-200 flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] text-slate-400 tracking-wider font-bold mr-1">
        SECTIONS
      </span>
      {sections
        .filter((s) => s.visible !== false)
        .map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => jump(e, s.id)}
            className="text-xs px-2 py-0.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-haro-500 hover:text-haro-600 transition"
          >
            {s.label}
          </a>
        ))}
      {mergedInto && (
        <Link
          href={`/projects/${mergedInto.id}`}
          className="ml-auto flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 hover:bg-amber-200 transition truncate max-w-[60%]"
          title={`이 프로젝트는 R${mergedInto.source_id} "${mergedInto.title}" 에 병합되어 있습니다`}
        >
          <span>⤴</span>
          <span className="truncate">
            메인: R{mergedInto.source_id} {mergedInto.title}
          </span>
        </Link>
      )}
    </div>
  );
}
