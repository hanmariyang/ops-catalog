import type { Metadata } from "next";
import Link from "next/link";

import { AuthBadge } from "@/components/AuthBadge";
import "./globals.css";

export const metadata: Metadata = {
  title: "교육운영실 프로젝트 카탈로그",
  description: "교육운영실 AI 자동화 아이디어 카탈로그 — 단계별 진행 추적",
  // D16: 검색엔진 인덱싱 차단
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="h-full">
      <body
        className="font-sans h-screen overflow-hidden"
        style={{
          display: "grid",
          gridTemplateRows: "auto minmax(0, 1fr) auto",
        }}
      >
        <header className="border-b border-slate-200 bg-white">
          <div className="px-3 sm:px-4 py-2 flex items-center justify-between">
            <div className="flex items-baseline gap-3 min-w-0">
              <Link href="/" className="text-[10px] font-bold text-haro-600 tracking-wider flex-shrink-0 hover:underline">
                OPS-CATALOG
              </Link>
              <h1 className="text-sm font-bold truncate">교육운영실 프로젝트 카탈로그</h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href="/groups"
                className="text-xs font-semibold text-slate-600 px-2 py-1 rounded hover:bg-slate-100 transition"
              >
                그룹
              </Link>
              <Link
                href="/manage"
                className="text-xs font-semibold bg-haro-500 text-white px-2.5 py-1 rounded hover:bg-haro-600 transition"
              >
                + 신규 추가
              </Link>
              <AuthBadge />
            </div>
          </div>
        </header>
        <main className="overflow-hidden px-3 sm:px-4 py-2 min-h-0 grid">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="px-3 sm:px-4 py-1 text-[10px] text-slate-500 flex justify-between">
            <span>한마리양 · ops-catalog</span>
            <span>HM-25 → HM-26 → HM-27</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
