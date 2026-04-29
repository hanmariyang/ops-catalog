/**
 * 매니저 액션 페이지 (D15) — hidden token URL.
 *
 * 사용: /manage?token=<MANAGE_TOKEN>
 * - 신규 카탈로그 항목 생성 폼
 * - 카탈로그 / Django admin 으로의 빠른 링크
 */

import Link from "next/link";

import { CreateForm } from "@/components/CreateForm";
import { listCategories } from "@/lib/api";

type SearchParams = { token?: string };

export default async function ManagePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const token = sp.token || "";
  const expected = process.env.MANAGE_TOKEN || "";
  const ok = !!expected && token === expected;

  if (!ok) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="text-2xl font-bold text-slate-700">접근 권한 없음</div>
        <p className="text-sm text-slate-500 mt-2">
          이 페이지는 매니저 토큰이 필요합니다. URL 파라미터를 확인하세요.
        </p>
        <p className="text-xs text-slate-400 mt-4">
          (인증 권한 도입 후 정식 로그인으로 대체될 예정)
        </p>
      </div>
    );
  }

  const categoriesRes = await listCategories();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";

  return (
    <div className="max-w-4xl mx-auto py-2">
      <div className="text-xs font-bold text-haro-600 tracking-wider">MANAGER MODE</div>
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-bold mt-1">매니저 액션</h1>
        <Link
          href={`/?token=${token}`}
          className="text-xs text-haro-600 hover:underline"
        >
          ← 카탈로그 (매니저 모드)
        </Link>
      </div>
      <p className="text-sm text-slate-500 mt-2">
        D15 — 인증 도입 전 hidden token URL. 모든 write 액션은 매니저만.
      </p>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <Card
          title="Django Admin"
          description="카테고리·평가·이력 등 모든 모델 직접 편집."
          href={`${apiBase}/admin`}
        />
        <Card
          title="API — 단계 승급/강등"
          description={`POST /api/v1/projects/{id}/advance-stage/\nheaders: { "X-Manage-Token": "..." }`}
        />
      </section>

      <div className="mt-8">
        <CreateForm categories={categoriesRes.results} manageToken={token} />
      </div>

      <div className="mt-6 text-xs text-slate-500">
        💡 기존 항목 수정은 카탈로그 → 카드 클릭 → 상세 페이지의 인라인 편집 폼.
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
      <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-wrap">{description}</p>
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
