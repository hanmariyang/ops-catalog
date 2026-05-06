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

export function GroupCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<GroupColorCode>("orange");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setMsg({ kind: "err", text: "이름을 입력하세요" });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/groups/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), color }),
      });
      if (!res.ok) {
        const text = await res.text();
        setMsg({ kind: "err", text: `${res.status}: ${text.slice(0, 200)}` });
        return;
      }
      const created = await res.json();
      setMsg({ kind: "ok", text: `생성됨: ${created.name}` });
      setName("");
      setDescription("");
      setColor("orange");
      router.refresh();
    } catch (err) {
      setMsg({ kind: "err", text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-xl border border-slate-200 p-4 grid gap-3 text-xs"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-bold text-haro-600 tracking-wider">NEW GROUP</div>
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
          이름 *
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: AI 자동화"
          className="border rounded px-2 py-1.5"
          maxLength={100}
          required
        />
      </label>

      <label className="grid gap-1">
        <span className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">
          설명 (선택)
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="이 그룹의 의미·기준을 한 줄로"
          className="border rounded px-2 py-1.5 min-h-[60px]"
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
              title={GROUP_COLOR_LABEL[c]}
              className={`text-[10px] font-bold px-2 py-1 rounded border transition ${
                GROUP_BADGE[c]
              } ${color === c ? "ring-2 ring-haro-500 ring-offset-1" : ""}`}
            >
              {GROUP_COLOR_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-haro-500 text-white text-xs font-semibold px-4 py-2 rounded hover:bg-haro-600 disabled:opacity-50"
        >
          {saving ? "생성 중…" : "그룹 생성"}
        </button>
      </div>
    </form>
  );
}
