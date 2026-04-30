/**
 * 헤더 우측 — 운영 라벨.
 * 인증 도입 전엔 누구나 read+write. 단순 라벨만 표시.
 */
export function AuthBadge() {
  return (
    <span className="text-xs text-slate-500 px-2 py-1">
      public · 누구나 편집 가능
    </span>
  );
}
