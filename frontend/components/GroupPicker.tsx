"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import type { GroupBadge, GroupListItem } from "@/lib/api";
import { GROUP_BADGE } from "@/lib/labels";

type Props = {
  projectId: number;
  currentGroups: GroupBadge[];
  allGroups: GroupListItem[];
};

/**
 * 프로젝트의 그룹 멤버십 편집기.
 * 클릭으로 토글 → 즉시 set-groups 호출 (로컬 상태에서 토글 후 PATCH).
 */
export function GroupPicker({ projectId, currentGroups, allGroups }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(currentGroups.map((g) => g.id)),
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function toggle(groupId: number) {
    if (busy) return;
    const next = new Set(selected);
    if (next.has(groupId)) next.delete(groupId);
    else next.add(groupId);
    setSelected(next);
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/projects/${projectId}/set-groups/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ group_ids: Array.from(next) }),
        },
      );
      if (!res.ok) {
        // 롤백
        setSelected(selected);
        const text = await res.text();
        setMsg({ kind: "err", text: `${res.status}: ${text.slice(0, 120)}` });
        return;
      }
      setMsg({ kind: "ok", text: "그룹 변경됨" });
      router.refresh();
    } catch (err) {
      setSelected(selected);
      setMsg({ kind: "err", text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-4 bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-bold text-slate-400 tracking-wider">
          그룹 ({selected.size})
        </div>
        <div className="flex items-center gap-2">
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
          <Link href="/groups" className="text-[10px] text-haro-600 hover:underline">
            그룹 관리 →
          </Link>
        </div>
      </div>

      {allGroups.length === 0 ? (
        <p className="text-xs text-slate-500">
          아직 그룹이 없어요.{" "}
          <Link href="/groups" className="text-haro-600 hover:underline">
            그룹 페이지
          </Link>
          에서 먼저 만들어보세요.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {allGroups.map((g) => {
            const active = selected.has(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggle(g.id)}
                disabled={busy}
                className={`text-xs font-bold px-2 py-1 rounded border transition disabled:opacity-50 ${
                  GROUP_BADGE[g.color]
                } ${active ? "ring-2 ring-haro-500 ring-offset-1" : "opacity-50 hover:opacity-100"}`}
                title={g.description || g.name}
              >
                {active ? "✓ " : "+ "}
                {g.name}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
