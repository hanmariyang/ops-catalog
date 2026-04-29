import type { Metadata } from "next";
import { Suspense } from "react";

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
    <html lang="ko">
      <body className="font-sans">
        <header className="border-b border-slate-200 bg-white">
          <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-haro-600 tracking-wider">OPS-CATALOG</div>
              <h1 className="text-lg font-bold mt-0.5">교육운영실 프로젝트 카탈로그</h1>
            </div>
            <Suspense
              fallback={
                <span className="text-xs text-slate-500">public · read-only</span>
              }
            >
              <AuthBadge />
            </Suspense>
          </div>
        </header>
        <main className="max-w-screen-2xl mx-auto px-6 py-6">{children}</main>
        <footer className="border-t border-slate-200 mt-12">
          <div className="max-w-screen-2xl mx-auto px-6 py-4 text-xs text-slate-500 flex justify-between">
            <span>한마리양 · ops-catalog</span>
            <span>HM-25 → HM-26 → HM-27</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
