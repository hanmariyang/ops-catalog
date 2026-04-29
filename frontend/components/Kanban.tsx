"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
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
import { useViewportSize } from "@/lib/use-viewport";

const STAGES: Stage[] = [1, 2, 3, 4];

/**
 * 한 분면이 전체의 BIG_RATIO 초과면 그 분면이 row 1 전체 차지 (1+3 레이아웃).
 * 이하면 2x2 균등.
 */
const BIG_RATIO = 0.4;

type LayoutKind = "stack" | "two-by-two" | "one-plus-three";

type Props = {
  initialItems: ProjectListItem[];
  manageToken?: string;
};

/**
 * 카탈로그 보드 — 분포 적응형 4분면.
 *
 * 화면 크기 + 카드 수 분포에 따라 grid 형태 *자체* 가 바뀜:
 * - sm: 4x1 stack (세로)
 * - md: 항상 2x2 균등
 * - lg+: 분포 따라
 *   - 모든 단계 비슷 (max ratio ≤ 0.4) → 2x2 균등
 *   - 한 단계 압도 (max ratio > 0.4) → 1+3 (큰 셀이 1행 전체, 나머지 3개가 2행)
 *
 * 좌우 폭 비례가 아니라 cell 배치 자체가 바뀌는 반응형.
 */
export function Kanban({ initialItems, manageToken }: Props) {
  const [items, setItems] = useState(initialItems);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { size, mounted } = useViewportSize();

  // initialItems 가 바뀌면 (router refresh 후) 동기화
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const counts = useMemo(() => {
    const map: Record<Stage, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const p of items) map[p.stage] += 1;
    return map;
  }, [items]);

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

  // 가장 큰 분면 + 비율 산출
  const total = counts[1] + counts[2] + counts[3] + counts[4];
  const biggestStage: Stage = STAGES.reduce((acc, s) =>
    counts[s] > counts[acc] ? s : acc
  );
  const maxRatio = total > 0 ? counts[biggestStage] / total : 0;

  // 레이아웃 종류 결정
  const layout: LayoutKind = !mounted
    ? "two-by-two"
    : size === "sm"
    ? "stack"
    : size === "md"
    ? "two-by-two"
    : maxRatio > BIG_RATIO
    ? "one-plus-three"
    : "two-by-two";

  // grid 컨테이너 스타일
  const gridStyle: React.CSSProperties =
    layout === "stack"
      ? { gridTemplateColumns: "1fr", gridAutoRows: "minmax(180px, auto)" }
      : layout === "two-by-two"
      ? {
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "minmax(0, 1fr) minmax(0, 1fr)",
          height: "calc(100vh - 130px)",
        }
      : // one-plus-three: 큰 셀이 1행 전체 (3 col span), 나머지 3개가 2행 1x3
        {
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gridTemplateRows: "minmax(0, 1.1fr) minmax(0, 1fr)",
          height: "calc(100vh - 130px)",
        };

  // 각 cell 의 명시적 grid 위치 — 자동 placement 충돌 방지
  const cellStyle = (stage: Stage): React.CSSProperties => {
    if (layout !== "one-plus-three") return {};
    if (stage === biggestStage) {
      return { gridColumn: "1 / -1", gridRow: 1 };
    }
    // biggest 를 제외한 나머지를 STAGES 순서대로 row 2 에 배치
    const others = STAGES.filter((s) => s !== biggestStage);
    const idx = others.indexOf(stage);
    return { gridColumn: idx + 1, gridRow: 2 };
  };

  return (
    <div>
      {error && (
        <div className="mb-2 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
          {error}
        </div>
      )}
      {!manageToken && (
        <div className="mb-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] rounded">
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
          <div className="grid gap-2" style={gridStyle}>
            {STAGES.map((stage) => (
              <DroppableColumn
                key={stage}
                stage={stage}
                items={byStage(stage)}
                manageToken={manageToken}
                cellStyle={cellStyle(stage)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeItem ? <CardView p={activeItem} dragging /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="grid gap-2" style={gridStyle}>
          {STAGES.map((stage) => (
            <StaticColumn
              key={stage}
              stage={stage}
              items={byStage(stage)}
              manageToken={manageToken}
              cellStyle={cellStyle(stage)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── 정적 컬럼 ─────────────────────────────────────
function StaticColumn({
  stage,
  items,
  manageToken,
  cellStyle,
}: {
  stage: Stage;
  items: ProjectListItem[];
  manageToken?: string;
  cellStyle: React.CSSProperties;
}) {
  return (
    <ColumnFrame stage={stage} count={items.length} cellStyle={cellStyle}>
      {renderCardsWithCategoryHeaders(items, (p) => (
        <StaticCard p={p} manageToken={manageToken} />
      ))}
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
  cellStyle,
}: {
  stage: Stage;
  items: ProjectListItem[];
  manageToken: string;
  cellStyle: React.CSSProperties;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stage}` });
  return (
    <ColumnFrame
      stage={stage}
      count={items.length}
      droppableRef={setNodeRef}
      highlight={isOver}
      cellStyle={cellStyle}
    >
      {renderCardsWithCategoryHeaders(items, (p) => (
        <DraggableCard p={p} manageToken={manageToken} />
      ))}
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

// ── 카테고리 헤더 묶음 ────────────────────────────
function renderCardsWithCategoryHeaders(
  items: ProjectListItem[],
  renderCard: (p: ProjectListItem) => React.ReactNode
) {
  if (items.length === 0) {
    return <EmptyHint />;
  }
  const out: React.ReactNode[] = [];
  let prevCat: string | null = null;
  for (const p of items) {
    if (p.category_code !== prevCat) {
      out.push(
        <CategoryHeader
          key={`hdr-${p.category_code}-${p.id}`}
          code={p.category_code}
          title={p.category_title}
        />
      );
      prevCat = p.category_code;
    }
    out.push(<Fragment key={p.id}>{renderCard(p)}</Fragment>);
  }
  return out;
}

function CategoryHeader({ code, title }: { code: string; title: string }) {
  return (
    <div className="flex items-center gap-1 mt-1 mb-0.5 px-0.5 select-none">
      <span className="text-[9px] font-bold text-slate-500 bg-slate-200 px-1 py-0.5 rounded">
        {code}
      </span>
      <span className="text-[9px] text-slate-500 truncate flex-1">{title}</span>
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
  cellStyle,
}: {
  stage: Stage;
  count: number;
  children: React.ReactNode;
  droppableRef?: (node: HTMLElement | null) => void;
  highlight?: boolean;
  cellStyle: React.CSSProperties;
}) {
  // grid cell 자체 높이 = grid track 가 결정. min-height 0 으로 inner scroll 을 보장.
  return (
    <section
      ref={droppableRef}
      style={{ ...cellStyle, minHeight: 0 }}
      className={`bg-slate-100 rounded-lg flex flex-col transition min-w-0 ${
        highlight ? "ring-2 ring-haro-500 bg-haro-50" : ""
      }`}
    >
      {/* 헤더 (sticky 안에서 항상 위) */}
      <header className="px-2.5 pt-2 pb-1.5 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className={`w-1 h-3.5 rounded-sm ${STAGE_ACCENT[stage]}`} />
          <h2 className="font-bold text-[12.5px] flex-1 truncate">
            {STAGE_LABEL[stage]}
          </h2>
          <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded">
            {count}
          </span>
        </div>
        <p className="text-[9.5px] text-slate-500 leading-snug line-clamp-1 mt-0.5">
          {STAGE_DESC[stage]}
        </p>
      </header>

      {/* 카드 리스트 (자체 scroll) */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1.5 space-y-1">
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
      <div className="flex items-center gap-1.5 mt-1 text-[10px] leading-none">
        <span className={`px-1 py-0.5 rounded font-bold ${TIER_COLOR[p.tier]}`}>
          {p.category_code}
        </span>
        <span className="text-slate-500 flex-shrink-0">R{p.source_id}</span>
        <span className="text-slate-400 truncate">{p.proposer_display}</span>
      </div>
    </>
  );
}
