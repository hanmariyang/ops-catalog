/**
 * 매니저 페이지 — 신규 카탈로그 항목 생성.
 *
 * 인증 도입 전 누구나 접근 가능. 인증 활성화 후 staff 만 허용.
 */

import Link from "next/link";

import { CreateForm } from "@/components/CreateForm";
import { listCategories } from "@/lib/api";

export default async function ManagePage() {
  const categoriesRes = await listCategories();
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";

  return (
    <div className="max-w-4xl mx-auto py-2 overflow-y-auto">
      <div className="text-xs font-bold text-haro-600 tracking-wider">
        MANAGER
      </div>
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-bold mt-1">신규 항목 추가</h1>
        <Link href="/" className="text-xs text-haro-600 hover:underline">
          ← 카탈로그
        </Link>
      </div>
      <p className="text-sm text-slate-500 mt-2">
        인증 도입 전 운영 단계. 누구나 추가/수정 가능.
      </p>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <Card
          title="Django Admin"
          description="카테고리·평가·이력 등 모든 모델 직접 편집."
          href={`${apiBase}/admin`}
        />
        <Card
          title="API"
          description={`POST /api/v1/projects/\nPOST /api/v1/projects/{id}/advance-stage/`}
        />
      </section>

      <div className="mt-8">
        <CreateForm categories={categoriesRes.results} />
      </div>

      <div className="mt-6 text-xs text-slate-500">
        💡 기존 항목 수정은 카탈로그 → 카드의 → 링크 → 상세 페이지의 인라인 편집 폼.
      </div>
    </div>
  );
}

function Card({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href?: string;
}) {
  const inner = (
    <>
      <h3 className="font-bold text-sm">{title}</h3>
      <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-wrap">
        {description}
      </p>
    </>
  );
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="block bg-white rounded-lg border border-slate-200 p-4 hover:border-haro-500 transition"
    >
      {inner}
      <span className="text-xs text-haro-600 mt-2 inline-block">→ 열기</span>
    </a>
  ) : (
    <div className="bg-white rounded-lg border border-slate-200 p-4">{inner}</div>
  );
}
