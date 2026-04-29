"""단계 자동 산출 룰 (HM-26 D4).

저장 시 자동 적용 X — UI 에서 "추천: N단계" 만 표시, 사람이 클릭해야 적용.
룰 변경되어도 기존 데이터 안 흔들림.
"""

from __future__ import annotations

from apps.catalog.models import Difficulty, Priority, Project, Stage


def suggest_stage(project: Project) -> int:
    """priority + difficulty + deploy_intent → 추천 단계 (1/2/3).

    룰 (HM-26 v3 + priority-only fallback):
    - 평가 완료 시:
      - 3단계: P0 + 난이도 높음 + 배포 의도 True
      - 2단계: P0/P1 + 난이도 낮음 + 배포 의도 False
    - 미평가(difficulty=unset) 시 priority fallback:
      - 3단계: P0 (먼저 분배 — 인솔파 우선 검토 후보)
      - 2단계: P1
      - 1단계: P2 / P3 / 미지정
    """
    p = project.priority
    d = project.difficulty
    deploy = project.deploy_intent

    # 평가 완료 시 정확 룰
    if p == Priority.P0 and d == Difficulty.HIGH and deploy:
        return Stage.S3
    if p in (Priority.P0, Priority.P1) and d == Difficulty.LOW and not deploy:
        return Stage.S2

    # 미평가 fallback — priority 만으로 우선 분배
    if d == Difficulty.UNSET:
        if p == Priority.P0:
            return Stage.S3
        if p == Priority.P1:
            return Stage.S2

    return Stage.S1


def explain_suggestion(project: Project) -> str:
    """추천 근거 짧은 텍스트 — UI tooltip 용."""
    p = project.priority
    d = project.difficulty
    deploy = project.deploy_intent
    suggested = suggest_stage(project)

    if suggested == Stage.S3:
        return f"{p} + 난이도 '{d}' + 배포 의도 → 3단계"
    if suggested == Stage.S2:
        return f"{p} + 난이도 '{d}' + 미배포 → 2단계"
    return f"{p} (또는 미평가) → 1단계 (default)"
