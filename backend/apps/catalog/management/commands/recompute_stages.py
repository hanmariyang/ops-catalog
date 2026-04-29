"""모든 Project 의 stage 를 suggest_stage 로 재계산.

사용:
    python manage.py recompute_stages              # dry-run (표시만)
    python manage.py recompute_stages --apply      # 실제 적용
    python manage.py recompute_stages --apply --reason "P0 우선 단계 분배"

각 변경에 대해 StageTransition 이력 자동 기록.
"""

from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.catalog.models import Project, StageTransition
from apps.catalog.services.staging import suggest_stage


class Command(BaseCommand):
    help = "모든 Project 의 stage 를 suggest_stage 로 재계산"

    def add_arguments(self, parser):
        parser.add_argument("--apply", action="store_true", help="실제 DB 변경 (기본은 dry-run)")
        parser.add_argument("--reason", default="recompute_stages 자동 적용", help="이력 reason")
        parser.add_argument(
            "--actor-label", default="recompute-script", help="이력 actor_label"
        )

    def handle(self, *args, **options):
        apply = options["apply"]
        reason = options["reason"]
        actor_label = options["actor_label"]

        changes = []
        for p in Project.objects.all().order_by("source_id"):
            suggested = suggest_stage(p)
            if suggested != p.stage:
                changes.append((p, p.stage, suggested))

        self.stdout.write(f"검사 대상: {Project.objects.count()}건")
        self.stdout.write(f"변경 대상: {len(changes)}건")

        # 단계별 분포
        dist = {1: 0, 2: 0, 3: 0}
        for p in Project.objects.all():
            dist[suggest_stage(p)] += 1
        self.stdout.write(
            f"적용 후 분포: 1단계={dist[1]} · 2단계={dist[2]} · 3단계={dist[3]}"
        )

        for p, frm, to in changes[:20]:
            self.stdout.write(
                f"  R{p.source_id} {p.priority} · {p.difficulty} · "
                f"{frm}→{to} · {p.title[:40]}"
            )
        if len(changes) > 20:
            self.stdout.write(f"  ... 그 외 {len(changes) - 20}건")

        if not apply:
            self.stdout.write(self.style.WARNING("dry-run — 실제 DB 변경 없음. --apply 로 적용."))
            return

        with transaction.atomic():
            for p, frm, to in changes:
                p.stage = to
                p.save(update_fields=["stage", "updated_at"])
                StageTransition.objects.create(
                    project=p,
                    from_stage=frm,
                    to_stage=to,
                    reason=reason,
                    actor_label=actor_label,
                )

        self.stdout.write(self.style.SUCCESS(f"✓ {len(changes)}건 적용 완료"))
