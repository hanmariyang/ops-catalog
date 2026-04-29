"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import Link from "next/link";

import type { ProjectListItem, Stage } from "@/lib/api";
import {
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  STAGE_DESC,
  STAGE_LABEL,
  TIER_COLOR,
} from "@/lib/labels";

const STAGES: Stage[] = [1, 2, 3];

type Props = {
  initialItems: ProjectListItem[];
  manageToken?: string;
};

/**
 * 칸반 보드 — 단계 1·2·3 컬럼 사이 드래그&드롭.
 *
 * 매니저(token 보유) 만 실제 단계 변경 가능. 익명도 카드를 잡을 수는 있으나
 * drop 시 API 가 403 반환 → 원위치 복귀.
 */
export function Kanban({ initialItems, manageToken }: Props) {
  const [items, setItems] = useState(initialItems);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const byStage = (s: Stage) => items.filter((p) => p.stage === s);
  const activeItem = activeId ? items.find((p) => p.id === activeId) : null;

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(Number(e.active.id));
    setError(null);
  };

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const projectId = Number(e.active.id);
    const overId = e.over?.id;
    if (!overId || !overId.toString().startsWith("stage-")) return;

    const target = Number(overId.toString().replace("stage-", "")) as Stage;
    const item = items.find((p) => p.id === projectId);
    if (!item || item.stage === target) return;

    if (!manageToken) {
      setError("매니저 토큰이 필요합니다 — /manage?token=... 로 접속하세요.");
      return;
    }

    // optimistic update
    const prevStage = item.stage;
    setItems((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, stage: target } : p))
    );

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/projects/${projectId}/advance-stage/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Manage-Token": manageToken,
          },
          body: JSON.stringify({
            to_stage: target,
            reason: "칸반 드래그",
            actor_label: "매니저",
          }),
        }
      );
      if (!res.ok) {
        // rollback
        setItems((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, stage: prevStage } : p))
        );
        const text = await res.text();
        setError(`단계 변경 실패 (${res.status}): ${text.slice(0, 100)}`);
      }
    } catch (err) {
      setItems((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, stage: prevStage } : p))
      );
      setError(`네트워크 오류: ${(err as Error).message}`);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
          {error}
        </div>
      )}
      {!manageToken && (
        <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded">
          🔒 익명 모드 — 카드는 클릭만 가능. 단계 변경은 매니저 권한 필요.
        </div>
      )}
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {STAGES.map((stage) => (
            <StageColumn
              key={stage}
              stage={stage}
              items={byStage(stage)}
              draggable={!!manageToken}
              manageToken={manageToken}
            />
          ))}
        </div>
        <DragOverlay>
          {activeItem ? <CardView p={activeItem} dragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function StageColumn({
  stage,
  items,
  draggable,
  manageToken,
}: {
  stage: Stage;
  items: ProjectListItem[];
  draggable: boolean;
  manageToken?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stage}` });

  return (
    <div
      ref={setNodeRef}
      className={`bg-slate-100 rounded-xl p-4 min-h-[240px] transition ${
        isOver ? "ring-2 ring-haro-500 bg-haro-50" : ""
      }`}
    >
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="font-bold text-base">{STAGE_LABEL[stage]}</h2>
        <span className="text-xs text-slate-500 font-semibold">{items.length}건</span>
      </div>
      <p className="text-xs text-slate-500 mb-3 pb-3 border-b border-slate-200">
        {STAGE_DESC[stage]}
      </p>
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-xs text-slate-400 text-center py-8">
            (해당 단계 항목 없음)
          </div>
        ) : (
          items.map((p) => (
            <DraggableCard
              key={p.id}
              p={p}
              draggable={draggable}
              manageToken={manageToken}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DraggableCard({
  p,
  draggable,
  manageToken,
}: {
  p: ProjectListItem;
  draggable: boolean;
  manageToken?: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: p.id,
    disabled: !draggable,
  });

  // drag 가 활성화되면 native <a> 의 link 동작이 dnd-kit pointer 를 가로채므로
  // 카드 본체를 div 로 만들고, 별도 "상세 보기" 링크를 우측 상단에 분리.
  return (
    <div
      ref={setNodeRef}
      style={{
        opacity: isDragging ? 0.4 : 1,
        touchAction: draggable ? "none" : "auto",
      }}
      {...(draggable ? listeners : {})}
      {...(draggable ? attributes : {})}
      className={`relative bg-white rounded-lg border border-slate-200 p-3 hover:shadow-md hover:border-haro-500 transition ${
        draggable ? "cursor-grab active:cursor-grabbing select-none" : ""
      }`}
    >
      <CardInner p={p} manageToken={manageToken} dragHandle={draggable} />
    </div>
  );
}

function CardView({ p, dragging }: { p: ProjectListItem; dragging?: boolean }) {
  return (
    <div
      className={`block bg-white rounded-lg border border-slate-200 p-3 ${
        dragging ? "shadow-lg border-haro-500 rotate-1" : ""
      }`}
    >
      <CardInner p={p} dragHandle={false} />
    </div>
  );
}

function CardInner({
  p,
  manageToken,
  dragHandle,
}: {
  p: ProjectListItem;
  manageToken?: string;
  dragHandle: boolean;
}) {
  const detailHref = manageToken
    ? `/projects/${p.id}?token=${manageToken}`
    : `/projects/${p.id}`;
  return (
    <>
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
        <Link
          href={detailHref}
          draggable={false}
          onPointerDown={(e) => e.stopPropagation()}
          className="ml-auto text-[10px] text-slate-400 hover:text-haro-600 hover:underline"
        >
          상세 →
        </Link>
      </div>
      <div className="text-sm font-semibold leading-snug line-clamp-2">{p.title}</div>
      <div className="text-xs text-slate-500 mt-1.5 flex justify-between">
        <span>{p.proposer_display}</span>
        <span>{p.category_title}</span>
      </div>
      {dragHandle && (
        <div className="text-[9px] text-slate-300 mt-1 leading-none select-none">
          ⋮⋮ 드래그로 단계 이동 · 상세는 우측 링크
        </div>
      )}
    </>
  );
}
