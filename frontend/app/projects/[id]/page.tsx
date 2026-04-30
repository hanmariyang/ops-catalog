/**
 * 프로젝트 상세.
 *
 * 위쪽: 엑셀 원문 (immutable, 박제)
 * 아래쪽: 평가·진행 (가변) + 추천 단계 + 인라인 편집 폼
 */

import Link from "next/link";
import { notFound } from "next/navigation";

import { getProject, listCategories } from "@/lib/api";
import { EditForm } from "@/components/EditForm";
import {
  DIFFICULTY_LABEL,
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  STAGE_LABEL,
  STATUS_LABEL,
  TIER_COLOR,
} from "@/lib/labels";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let p;
  try {
    p = await getProject(Number(id));
  } catch {
    notFound();
  }
  const categoriesRes = await listCategories();

  return (
    <div className="max-w-4xl mx-auto overflow-y-auto">
      <Link href="/" className="text-xs text-haro-600 hover:underline">
        ← 카탈로그로
      </Link>

      <div className="mt-3 flex items-center gap-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${TIER_COLOR[p.tier]}`}>
          {p.category.code} {p.category.title}
        </span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${PRIORITY_COLOR[p.priority]}`}>
          {PRIORITY_LABEL[p.priority]}
        </span>
        <span className="text-xs font-bold text-haro-600 bg-haro-50 px-2 py-0.5 rounded">
          R{p.source_id}
        </span>
      </div>
      <h1 className="text-2xl font-bold mt-2 leading-snug">{p.title}</h1>

      {/* 원문 박제 */}
      <section className="mt-6 bg-white rounded-xl border border-slate-200 p-5">
        <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-2">
          엑셀 원문 (IMMUTABLE)
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-4 text-xs mb-4">
          <Field label="제안자" value={p.proposer_display} />
          <Field label="조직" value={p.org || "—"} />
          <Field label="영향범위" value={p.impact_scope || "—"} />
          <Field label="우선순위" value={PRIORITY_LABEL[p.priority]} />
          <Field label="수동 소요 (1회/분)" value={p.manual_minutes ?? "—"} />
          <Field label="월 사용횟수" value={p.monthly_uses ?? "—"} />
        </dl>
        <div className="text-xs font-semibold text-slate-500 mb-1.5">AI 청사진</div>
        <pre className="text-sm whitespace-pre-wrap font-sans text-slate-800 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100">
          {p.description}
        </pre>
      </section>

      {/* 평가·진행 */}
      <section className="mt-4 bg-white rounded-xl border border-slate-200 p-5">
        <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-2">
          평가·진행 (MUTABLE)
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-4 text-xs">
          <Field label="현재 단계" value={STAGE_LABEL[p.stage]} highlight />
          <Field label="추천 단계" value={STAGE_LABEL[p.suggested_stage]} sub={p.suggestion_reason} />
          <Field label="기술 난이도" value={DIFFICULTY_LABEL[p.difficulty]} />
          <Field label="배포 의도" value={p.deploy_intent ? "예" : "아니오"} />
          <Field label="진행 상태" value={STATUS_LABEL[p.status]} />
          <Field label="결과 링크" value={p.result_url || "—"} />
        </dl>
      </section>

      {/* 인라인 편집 폼 — 누구나 편집 가능 */}
      <EditForm project={p} categories={categoriesRes.results} />

      {/* 단계 변동 이력 */}
      {p.stage_transitions.length > 0 && (
        <section className="mt-4 bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-2">
            단계 변동 이력
          </div>
          <ul className="text-xs space-y-2">
            {p.stage_transitions.map((t) => (
              <li key={t.id} className="flex gap-3">
                <span className="text-slate-400">{t.created_at.slice(0, 10)}</span>
                <span>
                  {t.from_stage ?? "—"} → <strong>{t.to_stage}</strong>
                </span>
                <span className="text-slate-500">{t.actor_label}</span>
                {t.reason && <span className="text-slate-600">· {t.reason}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  highlight,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
  sub?: string;
}) {
  return (
    <div>
      <dt className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">
        {label}
      </dt>
      <dd className={highlight ? "font-bold text-haro-600" : "text-slate-800"}>
        {value}
        {sub && <div className="text-[10px] text-slate-500 font-normal mt-0.5">{sub}</div>}
      </dd>
    </div>
  );
}
