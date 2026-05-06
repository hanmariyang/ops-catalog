"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { GroupColorCode } from "@/lib/api";
import { GROUP_BADGE, GROUP_COLOR_LABEL } from "@/lib/labels";

const COLORS: GroupColorCode[] = [
  "slate",
  "orange",
  "amber",
  "green",
  "cyan",
  "blue",
  "purple",
  "pink",
  "red",
];

type Props = {
  group: {
    id: number;
    name: string;
    description: string;
    color: GroupColorCode;
  };
};

export function GroupEditPanel({ group }: Props) {
  const router = useRouter();
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [color, setColor] = useState<GroupColorCode>(group.color);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/groups/${group.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), description: description.trim(), color }),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        setMsg({ kind: "err", text: `${res.status}: ${text.slice(0, 200)}` });
        return;
      }
      setMsg({ kind: "ok", text: "저장됨" });
      router.refresh();
    } catch (err) {
      setMsg({ kind: "err", text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    const ok = confirm(
      `그룹 "${group.name}" 을 삭제할까요?\n\n그룹만 사라지고 소속된 프로젝트는 그대로 유지됩니다.\n프로젝트의 그룹 멤버십만 제거돼요.`,
    );
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/groups/${group.id}/`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        alert(`삭제 실패 (${res.status})`);
        return;
      }
      router.push("/groups");
    } catch (err) {
      alert(`네트워크 오류: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSave}
      className="bg-amber-50 rounded-xl border border-amber-200 p-4 grid gap-3 text-xs"
    >
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold text-amber-700 tracking-wider">EDIT</div>
        {msg && (
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              msg.kind === "ok" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            }`}
          >
            {msg.text}
          </span>
        )}
      </div>

      <label className="grid gap-1">
        <span className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">
          이름
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded px-2 py-1.5 bg-white"
          maxLength={100}
          required
        />
      </label>

      <label className="grid gap-1">
        <span className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">
          설명
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border rounded px-2 py-1.5 bg-white min-h-[60px]"
        />
      </label>

      <div className="grid gap-1">
        <span className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">
          색상
        </span>
        <div className="flex flex-wrap gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`text-[10px] font-bold px-2 py-1 rounded border transition ${
                GROUP_BADGE[c]
              } ${color === c ? "ring-2 ring-haro-500 ring-offset-1" : ""}`}
            >
              {GROUP_COLOR_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between gap-2">
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="text-xs font-semibold px-3 py-2 rounded border border-red-300 text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
        >
          그룹 삭제
        </button>
        <button
          type="submit"
          disabled={busy}
          className="bg-haro-500 text-white text-xs font-semibold px-4 py-2 rounded hover:bg-haro-600 disabled:opacity-50"
        >
          {busy ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}
