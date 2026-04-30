"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * 헤더 우측 - 매니저 로그인/로그아웃 표시.
 *
 * URL ?token=... 으로 들어온 토큰을 backend /api/v1/auth/verify/ 로 검증.
 * 일치 → "매니저 모드 ON" / 불일치 → "토큰 불일치" 안내.
 */
export function AuthBadge() {
  const params = useSearchParams();
  const pathname = usePathname();
  const token = params.get("token") || "";

  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setValid(false);
      return;
    }
    setValid(null);
    fetch(`/api/v1/auth/verify/`, {
      headers: { "X-Manage-Token": token },
    })
      .then((r) => r.json())
      .then((d) => setValid(!!d.valid))
      .catch(() => setValid(false));
  }, [token]);

  // 토큰 자체가 없음 → 로그인 버튼
  if (!token) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-haro-500 text-white hover:bg-haro-600 transition"
      >
        🔑 매니저 로그인
      </Link>
    );
  }

  // 검증 중
  if (valid === null) {
    return (
      <span className="text-xs text-slate-500 px-2 py-1">확인 중…</span>
    );
  }

  // 검증 실패 — 토큰 불일치
  if (!valid) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
      >
        ⚠ 토큰 불일치 — 재입력
      </Link>
    );
  }

  // 검증 성공 — 매니저 모드
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
