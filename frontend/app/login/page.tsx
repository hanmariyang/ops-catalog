/**
 * 매니저 로그인 페이지.
 *
 * MVP — 인증 도입 전 hidden token URL 방식. 입력값을 그대로 query param 으로 redirect.
 * 토큰 일치 여부는 home/manage 의 server component 가 검증.
 *
 * 인증 도입 후엔 이 페이지가 정식 로그인 (NextAuth/DRF) 으로 자연 승격.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/";
  const [token, setToken] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) return;
    // next URL 에 token 파라미터 부착해서 이동.
    const url = new URL(next, window.location.origin);
    url.searchParams.set("token", trimmed);
    router.push(url.pathname + (url.search ? url.search : ""));
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <Link href="/" className="text-xs text-haro-600 hover:underline">
        ← 카탈로그로
      </Link>

      <div className="mt-4 bg-white rounded-xl border border-slate-200 p-6">
        <div className="text-xs font-bold text-haro-600 tracking-wider">MANAGER LOGIN</div>
        <h1 className="text-xl font-bold mt-1">매니저 토큰 입력</h1>
        <p className="text-sm text-slate-500 mt-2">
          인증 권한 도입 전 임시 운영 — 매니저 토큰을 입력하면 카드 드래그·편집·생성이 가능해집니다.
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <div>
            <label className="text-[10px] text-slate-600 uppercase tracking-wider mb-1 font-semibold block">
              매니저 토큰
            </label>
            <input
              ref={inputRef}
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="MANAGE_TOKEN 값 (32+자)"
              className="w-full border rounded px-3 py-2 bg-white font-mono text-sm"
              autoComplete="off"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              backend/.env.local 의 MANAGE_TOKEN 값. 운영자에게 받으세요.
            </p>
          </div>

          <button
            type="submit"
            disabled={!token.trim()}
            className="w-full bg-haro-500 text-white font-semibold px-4 py-2.5 rounded hover:bg-haro-600 disabled:opacity-50"
          >
            로그인
          </button>
        </form>

        <div className="mt-4 text-[10px] text-slate-400 leading-relaxed">
          ⓘ 토큰이 일치하지 않으면 카탈로그는 read-only 모드로 동작합니다 (입력 자체는 거부되지 않음).
          <br />
          ⓘ URL 에 토큰이 노출됩니다 — 공용 PC 에서는 사용 후 로그아웃 권장.
        </div>
      </div>
    </div>
  );
}
