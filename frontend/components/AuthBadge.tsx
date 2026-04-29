"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * 헤더 우측 - 매니저 로그인/로그아웃 표시.
 *
 * URL ?token=... 기반 (인증 도입 전 임시). 일치 여부는 server 가 검증하고,
 * 이 컴포넌트는 단순히 토큰 *존재* 만 보고 매니저 모드 라벨을 표시.
 */
export function AuthBadge() {
  const params = useSearchParams();
  const pathname = usePathname();
  const token = params.get("token") || "";

  if (!token) {
    return (
      <Link
        href="/login"
        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-haro-500 text-white hover:bg-haro-600 transition"
      >
        🔑 매니저 로그인
      </Link>
    );
  }

  // 토큰이 있으면 — 매니저 모드 표시 + 로그아웃
  // 로그아웃은 token 제외한 같은 URL 로 redirect
  const otherParams = new URLSearchParams();
  for (const [k, v] of params.entries()) {
    if (k !== "token") otherParams.set(k, v);
  }
  const logoutHref = otherParams.toString()
    ? `${pathname}?${otherParams.toString()}`
    : pathname;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-haro-600 bg-haro-50 px-2 py-1 rounded">
        매니저 모드 ON
      </span>
      <Link
        href={logoutHref}
        className="text-xs text-slate-500 hover:text-slate-800 hover:underline"
      >
        로그아웃
      </Link>
    </div>
  );
}
