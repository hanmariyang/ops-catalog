"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * 메인 칸반 헤더의 검색 박스.
 * - 입력 → 300ms debounce → ?q= 푸시 (router.replace 로 history 안 쌓이게)
 * - q 비우면 ?q 제거
 * - 다른 필터 (tier, category, group, archived) 는 그대로 보존
 * - "/" 키로 포커스
 */
export function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  // 외부 (필터 클릭 등) 로 q 가 바뀐 경우 동기화
  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  // "/" 키로 포커스 (input 안에서는 무시)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // debounce
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (value === current) return;
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = value.trim();
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/");
    }, 300);
    return () => clearTimeout(t);
  }, [value, router, searchParams]);

  return (
    <div className="relative flex-shrink-0">
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="검색 (제목·청사진·제안자)…"
        className="text-xs pl-7 pr-2 py-1 rounded-full border border-slate-200 bg-white w-56 sm:w-64 focus:border-haro-500 focus:outline-none focus:ring-1 focus:ring-haro-500"
        aria-label="프로젝트 검색"
      />
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
        🔍
      </span>
      {!value && (
        <kbd className="hidden sm:block absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 border border-slate-200 rounded px-1 leading-none py-0.5 pointer-events-none">
          /
        </kbd>
      )}
    </div>
  );
}
