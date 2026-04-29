"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { ProjectDetail, Category } from "@/lib/api";
import { DIFFICULTY_LABEL, STATUS_LABEL } from "@/lib/labels";

type Props = {
  project: ProjectDetail;
  categories: Category[];
  manageToken: string;
};

/**
 * 매니저 인라인 편집 폼.
 * 가변 필드만 노출 (원문 박제 영역은 변경 X — D9).
 */
export function EditForm({ project, categories, manageToken }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [form, setForm] = useState({
    category: project.category.id,
    difficulty: project.difficulty,
    deploy_intent: project.deploy_intent,
    stage: project.stage,
    status: project.status,
    result_url: project.result_url || "",
    name_public: project.name_public ?? true,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/projects/${project.id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Manage-Token": manageToken,
          },
          body: JSON.stringify(form),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        setMsg({ kind: "err", text: `${res.status}: ${text.slice(0, 200)}` });
        return;
      }
      setMsg({ kind: "ok", text: "저장 완료" });
      router.refresh();
    } catch (err) {
      setMsg({ kind: "err", text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSave}
      className="mt-4 bg-amber-50 rounded-xl border border-amber-200 p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-bold text-amber-700 tracking-wider">
          매니저 인라인 편집
        </div>
        {msg && (
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              msg.kind === "ok"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {msg.text}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <Field label="카테고리">
          <select
            value={form.category}
            onChange={(e) => set("category", Number(e.target.value))}
            className="w-full border rounded px-2 py-1.5 bg-white"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} {c.title}
              </option>
            ))}
          </select>
        </Field>

        <Field label="기술 난이도">
          <select
            value={form.difficulty}
            onChange={(e) => set("difficulty", e.target.value as typeof form.difficulty)}
            className="w-full border rounded px-2 py-1.5 bg-white"
          >
            {(["unset", "low", "mid", "high"] as const).map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_LABEL[d]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="배포 의도">
          <label className="flex items-center gap-2 px-2 py-1.5 bg-white border rounded">
            <input
              type="checkbox"
              checked={form.deploy_intent}
              onChange={(e) => set("deploy_intent", e.target.checked)}
            />
            <span>전체 배포 의도</span>
          </label>
        </Field>

        <Field label="현재 단계">
          <select
            value={form.stage}
            onChange={(e) => set("stage", Number(e.target.value) as 1 | 2 | 3)}
            className="w-full border rounded px-2 py-1.5 bg-white"
          >
            <option value={1}>1단계</option>
            <option value={2}>2단계</option>
            <option value={3}>3단계</option>
          </select>
        </Field>

        <Field label="진행 상태">
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value as typeof form.status)}
            className="w-full border rounded px-2 py-1.5 bg-white"
          >
            {(["not_started", "in_progress", "done", "archived"] as const).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="결과 링크 (URL)">
          <input
            type="url"
            value={form.result_url}
            onChange={(e) => set("result_url", e.target.value)}
            placeholder="https://..."
            className="w-full border rounded px-2 py-1.5 bg-white"
          />
        </Field>

        <Field label="이름 공개">
          <label className="flex items-center gap-2 px-2 py-1.5 bg-white border rounded">
            <input
              type="checkbox"
              checked={form.name_public}
              onChange={(e) => set("name_public", e.target.checked)}
            />
            <span>제안자 풀네임 공개</span>
          </label>
        </Field>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-haro-500 text-white text-xs font-semibold px-4 py-2 rounded hover:bg-haro-600 disabled:opacity-50"
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
      <p className="text-[10px] text-slate-500 mt-3">
        ⚠ 원문(제목·청사진·제안자·우선순위)은 immutable. 수정이 필요하면 Django admin 사용.
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1 font-semibold">
        {label}
      </div>
      {children}
    </div>
  );
}
