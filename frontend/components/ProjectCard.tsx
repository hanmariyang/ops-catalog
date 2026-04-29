import Link from "next/link";
import type { ProjectListItem } from "@/lib/api";
import { PRIORITY_COLOR, PRIORITY_LABEL, TIER_COLOR } from "@/lib/labels";

export function ProjectCard({ p }: { p: ProjectListItem }) {
  return (
    <Link
      href={`/projects/${p.id}`}
      className="block bg-white rounded-lg border border-slate-200 p-3 hover:shadow-md hover:border-haro-500 transition"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${TIER_COLOR[p.tier]}`}>
          {p.category_code}
        </span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${PRIORITY_COLOR[p.priority]}`}>
          {PRIORITY_LABEL[p.priority]}
        </span>
        <span className="text-[10px] font-bold text-haro-600 bg-haro-50 px-1.5 py-0.5 rounded">
          R{p.source_id}
        </span>
      </div>
      <div className="text-sm font-semibold leading-snug line-clamp-2">{p.title}</div>
      <div className="text-xs text-slate-500 mt-1.5 flex justify-between">
        <span>{p.proposer_display}</span>
        <span>{p.category_title}</span>
      </div>
    </Link>
  );
}
