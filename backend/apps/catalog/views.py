"""ops-catalog API views.

MVP 정책 (D15): 익명 read 허용. write 액션은 hidden token (settings.MANAGE_TOKEN) 또는 staff 만.
"""

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.catalog.models import Category, Project, Stage, StageTransition
from apps.catalog.serializers import (
    CategorySerializer,
    ProjectDetailSerializer,
    ProjectListSerializer,
)


def _has_manage_token(request) -> bool:
    """X-Manage-Token 헤더 또는 ?token= 쿼리로 매니저 권한 확인."""
    token = settings.MANAGE_TOKEN
    if not token:
        return False
    incoming = request.headers.get("X-Manage-Token") or request.query_params.get("token")
    return incoming == token


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ProjectViewSet(viewsets.ModelViewSet):
    """카탈로그 항목.

    - GET (list/retrieve): 익명 OK
    - PATCH/POST/action: hidden token 또는 staff 만
    """

    queryset = Project.objects.select_related("category").prefetch_related(
        "stage_transitions", "evaluations"
    )
    filterset_fields = ["stage", "category", "priority", "status", "tier"]
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "description", "proposer"]

    def get_serializer_class(self):
        if self.action == "list":
            return ProjectListSerializer
        return ProjectDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        # tier 필터는 category.tier 로 매핑
        tier = self.request.query_params.get("tier")
        if tier:
            qs = qs.filter(category__tier=tier)
        return qs.order_by("source_id")

    def _check_manage(self, request):
        if request.user.is_authenticated and request.user.is_staff:
            return True
        return _has_manage_token(request)

    def update(self, request, *args, **kwargs):
        if not self._check_manage(request):
            return Response({"detail": "manager only"}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if not self._check_manage(request):
            return Response({"detail": "manager only"}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        # 익명 write 차단 (D15·OQ2). 매니저 토큰만 허용.
        if not self._check_manage(request):
            return Response({"detail": "manager only"}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not self._check_manage(request):
            return Response({"detail": "manager only"}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="advance-stage")
    def advance_stage(self, request, pk=None):
        """단계 승급/강등 (D5: 매니저 권한만)."""
        if not self._check_manage(request):
            return Response({"detail": "manager only"}, status=status.HTTP_403_FORBIDDEN)
        project = self.get_object()
        target = request.data.get("to_stage")
        if target not in (1, 2, 3):
            return Response({"detail": "to_stage must be 1, 2 or 3"}, status=400)
        reason = request.data.get("reason", "")
        actor_label = request.data.get("actor_label", "주인")
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
