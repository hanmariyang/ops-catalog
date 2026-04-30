"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { Category } from "@/lib/api";
import { DIFFICULTY_LABEL, STATUS_LABEL } from "@/lib/labels";

type Props = {
  categories: Category[];
  manageToken: string;
};

const PRIORITY_OPTIONS = ["unset", "P0", "P1", "P2", "P3"] as const;

/**
 * 신규 카탈로그 항목 생성 폼.
 * source_id 는 백엔드에서 자동 부여 (max+1, 1000 이상 시스템 생성).
 */
export function CreateForm({ categories, manageToken }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    proposer: "",
    proposer_email: "",
    org: "교육운영실 직속",
    category: categories[0]?.id ?? 0,
    priority: "unset" as (typeof PRIORITY_OPTIONS)[number],
    difficulty: "unset" as "low" | "mid" | "high" | "unset",
    deploy_intent: false,
    stage: 1 as 1 | 2 | 3 | 4,
    status: "not_started" as "not_started" | "in_progress" | "done" | "archived",
    name_public: true,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/v1/projects/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Manage-Token": manageToken,
          },
          body: JSON.stringify(form),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        setMsg({ kind: "err", text: `${res.status}: ${text.slice(0, 300)}` });
        return;
      }
      const created = await res.json();
      setMsg({ kind: "ok", text: `생성 완료 (id=${created.id} · R${created.source_id})` });
      // 새 항목 상세 페이지로 이동
      setTimeout(() => {
        router.push(`/projects/${created.id}?token=${manageToken}`);
      }, 600);
    } catch (err) {
      setMsg({ kind: "err", text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSave}
      className="bg-white rounded-xl border border-slate-200 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] font-bold text-haro-600 tracking-wider">
            NEW PROJECT
          </div>
          <h2 className="font-bold text-base mt-0.5">신규 카탈로그 항목 생성</h2>
        </div>
        {msg && (
          <span
            className={`text-xs px-2 py-1 rounded ${
              msg.kind === "ok"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {msg.text}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <Field label="한줄요약 (필수)" wide>
          <input
            required
            maxLength={300}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="예: 매 챕터 회고 자동 적재봇"
            className="w-full border rounded px-2 py-1.5 bg-white"
          />
        </Field>

        <Field label="AI 청사진 / 상세 설명 (필수)" wide>
          <textarea
            required
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            placeholder="기능·동작·기대 효과 등"
            className="w-full border rounded px-2 py-1.5 bg-white font-sans"
          />
        </Field>

        <Field label="제안자 (필수)">
          <input
            required
            value={form.proposer}
            onChange={(e) => set("proposer", e.target.value)}
            className="w-full border rounded px-2 py-1.5 bg-white"
          />
        </Field>

        <Field label="제안자 이메일">
          <input
            type="email"
            value={form.proposer_email}
            onChange={(e) => set("proposer_email", e.target.value)}
            placeholder="공개되지 않음"
            className="w-full border rounded px-2 py-1.5 bg-white"
          />
        </Field>

        <Field label="조직">
          <input
            value={form.org}
            onChange={(e) => set("org", e.target.value)}
            className="w-full border rounded px-2 py-1.5 bg-white"
          />
        </Field>

        <Field label="우선순위">
          <select
            value={form.priority}
            onChange={(e) => set("priority", e.target.value as typeof form.priority)}
            className="w-full border rounded px-2 py-1.5 bg-white"
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p === "unset" ? "(미지정)" : p}
              </option>
            ))}
          </select>
        </Field>

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

        <Field label="배포 의도 / 시작 단계">
          <div className="flex gap-2">
            <label className="flex items-center gap-1.5 px-2 py-1.5 bg-white border rounded flex-1">
              <input
                type="checkbox"
                checked={form.deploy_intent}
                onChange={(e) => set("deploy_intent", e.target.checked)}
              />
              <span>전체 배포</span>
            </label>
            <select
              value={form.stage}
              onChange={(e) => set("stage", Number(e.target.value) as 1 | 2 | 3 | 4)}
              className="border rounded px-2 py-1.5 bg-white"
            >
              <option value={1}>1단계</option>
              <option value={2}>2단계</option>
              <option value={3}>3단계</option>
              <option value={4}>기타</option>
            </select>
          </div>
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
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-haro-500 text-white text-xs font-semibold px-5 py-2 rounded hover:bg-haro-600 disabled:opacity-50"
        >
          {saving ? "생성 중…" : "생성"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1 font-semibold">
        {label}
      </div>
      {children}
    </div>
  );
}
