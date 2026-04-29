"use client";

import { useEffect, useState } from "react";
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
  STAGE_ACCENT,
  STAGE_DESC,
  STAGE_LABEL,
  TIER_COLOR,
} from "@/lib/labels";

const STAGES: Stage[] = [1, 2, 3, 4];

type Props = {
  initialItems: ProjectListItem[];
  manageToken?: string;
};

/**
 * 칸반 보드 — 단계 1·2·3·4 (4열 반응형, 컴팩트 카드).
 *
 * 반응형: 1col (mobile) · 2col (sm) · 4col (lg+)
 * 컬럼: 자체 max-h scroll (헤더 고정)
 * 카드: 한 줄 요약 + 메타 마이크로 한 줄
 *
 * SSR/hydration 안전 — mount 전·익명 모드 → 정적, mount 후+매니저 → DndContext.
 */
export function Kanban({ initialItems, manageToken }: Props) {
  const [items, setItems] = useState(initialItems);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      setError("매니저 토큰이 필요합니다 — /login 에서 로그인하세요.");
      return;
    }

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

  const dndActive = mounted && !!manageToken;

  return (
    <div>
      {error && (
        <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
          {error}
        </div>
      )}
      {!manageToken && (
        <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] rounded">
          🔒 익명 모드 — 카드는 클릭만 가능. 단계 변경은 매니저 권한 필요.
        </div>
      )}

      {dndActive ? (
        <DndContext
          id="ops-catalog-kanban"
          sensors={sensors}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <BoardGrid>
            {STAGES.map((stage) => (
              <DroppableColumn
                key={stage}
                stage={stage}
                items={byStage(stage)}
                manageToken={manageToken}
              />
            ))}
          </BoardGrid>
          <DragOverlay>
            {activeItem ? <CardView p={activeItem} dragging /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <BoardGrid>
          {STAGES.map((stage) => (
            <StaticColumn
              key={stage}
              stage={stage}
              items={byStage(stage)}
              manageToken={manageToken}
            />
          ))}
        </BoardGrid>
      )}
    </div>
  );
}

// ── 그리드 (반응형 좌→우 진행 X, 단순 grid) ────────────
function BoardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {children}
    </div>
  );
}

// ── 정적 컬럼 ───────────────────────────────────────
function StaticColumn({
  stage,
  items,
  manageToken,
}: {
  stage: Stage;
  items: ProjectListItem[];
  manageToken?: string;
}) {
  return (
    <ColumnFrame stage={stage} count={items.length}>
      {items.length === 0 ? (
        <EmptyHint />
      ) : (
        items.map((p) => (
          <StaticCard key={p.id} p={p} manageToken={manageToken} />
        ))
      )}
    </ColumnFrame>
  );
}

function StaticCard({
  p,
  manageToken,
}: {
  p: ProjectListItem;
  manageToken?: string;
}) {
  return (
    <div className="relative bg-white rounded-md border border-slate-200 px-2 py-1.5 hover:border-haro-500 transition">
      <CardInner p={p} manageToken={manageToken} dragHandle={false} />
    </div>
  );
}

// ── 드래그 컬럼 ───────────────────────────────────
function DroppableColumn({
  stage,
  items,
  manageToken,
}: {
  stage: Stage;
  items: ProjectListItem[];
  manageToken: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stage}` });
  return (
    <ColumnFrame
      stage={stage}
      count={items.length}
      droppableRef={setNodeRef}
      highlight={isOver}
    >
      {items.length === 0 ? (
        <EmptyHint />
      ) : (
        items.map((p) => (
          <DraggableCard key={p.id} p={p} manageToken={manageToken} />
        ))
      )}
    </ColumnFrame>
  );
}

function DraggableCard({
  p,
  manageToken,
}: {
  p: ProjectListItem;
  manageToken: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: p.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        opacity: isDragging ? 0.4 : 1,
        touchAction: "none",
      }}
      {...listeners}
      {...attributes}
      className="relative bg-white rounded-md border border-slate-200 px-2 py-1.5 hover:border-haro-500 transition cursor-grab active:cursor-grabbing select-none"
    >
      <CardInner p={p} manageToken={manageToken} dragHandle />
    </div>
  );
}

// ── 컬럼 프레임 ───────────────────────────────────
function ColumnFrame({
  stage,
  count,
  children,
  droppableRef,
  highlight,
}: {
  stage: Stage;
  count: number;
  children: React.ReactNode;
  droppableRef?: (node: HTMLElement | null) => void;
  highlight?: boolean;
}) {
  return (
    <section
      ref={droppableRef}
      className={`bg-slate-100 rounded-lg flex flex-col transition ${
        highlight ? "ring-2 ring-haro-500 bg-haro-50" : ""
      }`}
      style={{ maxHeight: "calc(100vh - 240px)" }}
    >
      {/* 헤더 (고정) */}
      <header className="px-3 pt-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-1 h-3.5 rounded-sm ${STAGE_ACCENT[stage]}`} />
          <h2 className="font-bold text-sm flex-1">{STAGE_LABEL[stage]}</h2>
          <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded">
            {count}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
          {STAGE_DESC[stage]}
        </p>
      </header>

      {/* 카드 리스트 (자체 scroll) */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
        {children}
      </div>
    </section>
  );
}

function EmptyHint() {
  return (
    <div className="text-[10px] text-slate-400 text-center py-6">
      (해당 단계 항목 없음)
    </div>
  );
}

// ── 카드 내용 (컴팩트) ───────────────────────────
function CardView({ p, dragging }: { p: ProjectListItem; dragging?: boolean }) {
  return (
    <div
      className={`bg-white rounded-md border border-slate-200 px-2 py-1.5 ${
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
      {/* line 1 — 제목 (1줄 truncate) */}
      <div className="flex items-start gap-1.5">
        <span
          className={`text-[9px] font-bold px-1 py-0.5 rounded leading-none ${PRIORITY_COLOR[p.priority]} flex-shrink-0`}
        >
          {PRIORITY_LABEL[p.priority]}
        </span>
        <div className="text-[12px] font-semibold leading-tight line-clamp-1 flex-1 min-w-0">
          {p.title}
        </div>
        <Link
          href={detailHref}
          draggable={false}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-[10px] text-slate-400 hover:text-haro-600 leading-none flex-shrink-0"
          title="상세 보기"
        >
          →
        </Link>
      </div>

      {/* line 2 — 메타 마이크로 (Tier·R번호·제안자) */}
      <div className="flex items-center gap-1.5 mt-1 text-[10px] leading-none">
        <span className={`px-1 py-0.5 rounded font-bold ${TIER_COLOR[p.tier]}`}>
          {p.category_code}
        </span>
        <span className="text-slate-500">R{p.source_id}</span>
        <span className="text-slate-400 truncate">{p.proposer_display}</span>
      </div>
    </>
  );
}
