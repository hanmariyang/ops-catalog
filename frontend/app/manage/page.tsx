/**
 * 매니저 액션 페이지 (D15) — hidden token URL.
 *
 * 사용: /manage?token=<MANAGE_TOKEN>
 *
 * MVP 에선 안내·링크 모음 정도. 실제 액션은 Django admin (http://localhost:8002/admin) 또는
 * 후속에서 이 페이지에 form/api 연결.
 */

type SearchParams = { token?: string };

export default async function ManagePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const token = sp.token || "";
  const expected = process.env.MANAGE_TOKEN || "";

  // 서버사이드 비교 (브라우저로 expected 가 새지 않음 — env 는 NEXT_PUBLIC_ 아님)
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

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="text-xs font-bold text-haro-600 tracking-wider">MANAGER MODE</div>
      <h1 className="text-2xl font-bold mt-1">매니저 액션</h1>
      <p className="text-sm text-slate-500 mt-2">
        D15 — 인증 도입 전 hidden token URL 로 임시 운영. 모든 write 액션은 매니저만.
      </p>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card
          title="Django Admin"
          description="카탈로그 항목·카테고리·평가·이력 직접 편집. 가장 빠른 매니저 인터페이스."
          href="http://localhost:8002/admin"
        />
        <Card
          title="API — 단계 승급/강등"
          description={`POST /api/v1/projects/{id}/advance-stage/\nheaders: { "X-Manage-Token": "..." }`}
        />
        <Card
          title="엑셀 import (1회)"
          description="컨테이너에서 'python manage.py import_pocketman --xlsx <path>' 실행. 이미 import 됐다면 update 모드."
        />
        <Card
          title="향후 (인증 도입 후)"
          description="이 페이지가 /dashboard 로 자연 승격. URL 깨지지 않게 route 만 비워둠."
        />
      </section>
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
