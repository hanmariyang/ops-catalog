"""ops-catalog API views.

MVP — 인증 도입 전. 모든 read/write 익명 허용 (HM-26 D15 의 hidden token 운영 폐기).
인증 도입 시 ProjectViewSet 의 update/create/destroy 에 permission 다시 박을 것.
"""

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.catalog.models import Category, Project, StageTransition
from apps.catalog.serializers import (
    CategorySerializer,
    ProjectDetailSerializer,
    ProjectListSerializer,
    ProjectWriteSerializer,
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ProjectViewSet(viewsets.ModelViewSet):
    """카탈로그 항목 — 모든 동작 익명 허용."""

    queryset = Project.objects.select_related("category").prefetch_related(
        "stage_transitions", "evaluations"
    )
    filterset_fields = ["stage", "category", "priority", "status"]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ["title", "description", "proposer"]

    def get_serializer_class(self):
        if self.action == "list":
            return ProjectListSerializer
        if self.action in ("create", "update", "partial_update"):
            return ProjectWriteSerializer
        return ProjectDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        tier = self.request.query_params.get("tier")
        if tier:
            qs = qs.filter(category__tier=tier)
        # 카드 정렬: 카테고리 번호 → 제안자 → 행 번호
        return qs.order_by("category__num", "proposer", "source_id")

    def create(self, request, *args, **kwargs):
        # source_id 미지정 시 자동 부여 (max+1, 시스템 생성은 1000 이상)
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        if not data.get("source_id"):
            existing_max = (
                Project.objects.order_by("-source_id")
                .values_list("source_id", flat=True)
                .first()
                or 0
            )
            data["source_id"] = max(existing_max, 999) + 1
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=["post"], url_path="advance-stage")
    def advance_stage(self, request, pk=None):
        """단계 승급/강등."""
        project = self.get_object()
        target = request.data.get("to_stage")
        if target not in (1, 2, 3, 4):
            return Response(
                {"detail": "to_stage must be 1, 2, 3 or 4"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        reason = request.data.get("reason", "")
        actor_label = request.data.get("actor_label", "익명")
        from_stage = project.stage
        project.stage = target
        project.save(update_fields=["stage", "updated_at"])
        StageTransition.objects.create(
            project=project,
            from_stage=from_stage,
            to_stage=target,
            reason=reason,
            actor_label=actor_label,
            actor=request.user if request.user.is_authenticated else None,
        )
        return Response(ProjectDetailSerializer(project).data)
