"""ops-catalog API views.

MVP — 인증 도입 전. 모든 read/write 익명 허용 (HM-26 D15 의 hidden token 운영 폐기).
인증 도입 시 ProjectViewSet 의 update/create/destroy 에 permission 다시 박을 것.
"""

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.catalog.models import Category, Group, Project, StageTransition
from apps.catalog.serializers import (
    CategorySerializer,
    GroupDetailSerializer,
    GroupListSerializer,
    GroupWriteSerializer,
    ProjectDetailSerializer,
    ProjectListSerializer,
    ProjectWriteSerializer,
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ProjectViewSet(viewsets.ModelViewSet):
    """카탈로그 항목 — 모든 동작 익명 허용."""

    queryset = Project.objects.select_related("category", "merged_into").prefetch_related(
        "stage_transitions", "evaluations", "groups", "merged_children"
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
        params = self.request.query_params
        tier = params.get("tier")
        if tier:
            qs = qs.filter(category__tier=tier)
        group_id = params.get("group")
        if group_id:
            qs = qs.filter(groups__id=group_id)
        # 보관함(archived) 디폴트 제외 — list 액션에만 적용.
        # detail/update/destroy 은 단건 접근이라 항상 풀 queryset (보관 항목 복구 가능해야 함).
        # ?include_archived=1 또는 ?status=archived 시 포함.
        if self.action == "list":
            include_archived = params.get("include_archived") in ("1", "true", "True")
            explicit_status = params.get("status")
            if not include_archived and explicit_status != "archived":
                qs = qs.exclude(status="archived")
            # 병합된 자식은 칸반 list 에서 자동 제외 — 메인 카드에 흡수되어 보임.
            # ?include_merged=1 시 포함 (admin·디버깅용).
            include_merged = params.get("include_merged") in ("1", "true", "True")
            if not include_merged:
                qs = qs.filter(merged_into__isnull=True)
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

    @action(detail=True, methods=["post"], url_path="merge-into")
    def merge_into(self, request, pk=None):
        """이 프로젝트를 다른 메인 프로젝트에 병합 (자식이 됨).

        body: {"main_id": N}
        제약 (단일 레벨):
          1. self merge 불가 (main_id == self.id)
          2. main 이 이미 자식이면 불가 (main.merged_into is not None)
          3. self 가 자식을 가지면 불가 (self.merged_children.exists()) — chain 방지
        """
        child = self.get_object()
        main_id = request.data.get("main_id")
        if not main_id:
            return Response(
                {"detail": "main_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if main_id == child.id:
            return Response(
                {"detail": "자기 자신에게 병합할 수 없습니다"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if child.merged_children.exists():
            return Response(
                {
                    "detail": "이 프로젝트는 이미 메인입니다 (자식 보유). 자식을 먼저 분리하거나 메인을 다른 프로젝트로 만드세요."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            main = Project.objects.get(pk=main_id)
        except Project.DoesNotExist:
            return Response(
                {"detail": f"main_id={main_id} 프로젝트가 없습니다"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if main.merged_into_id is not None:
            return Response(
                {"detail": "메인 프로젝트가 이미 다른 프로젝트의 자식입니다 (단일 레벨만 허용)"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        child.merged_into = main
        child.save(update_fields=["merged_into", "updated_at"])
        return Response(ProjectDetailSerializer(child).data)

    @action(detail=True, methods=["post"], url_path="unmerge")
    def unmerge(self, request, pk=None):
        """병합 해제 — 자식 → 독립 프로젝트로 복귀."""
        child = self.get_object()
        if child.merged_into_id is None:
            return Response(
                {"detail": "병합되지 않은 프로젝트입니다"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        child.merged_into = None
        child.save(update_fields=["merged_into", "updated_at"])
        return Response(ProjectDetailSerializer(child).data)

    @action(detail=True, methods=["post"], url_path="set-groups")
    def set_groups(self, request, pk=None):
        """프로젝트의 소속 그룹을 한번에 교체.

        body: {"group_ids": [1, 2, 3]}  — 빈 배열이면 모든 그룹에서 제거.
        """
        project = self.get_object()
        ids = request.data.get("group_ids")
        if not isinstance(ids, list):
            return Response(
                {"detail": "group_ids must be a list of integers"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # 존재하는 그룹만 필터 (없는 id 는 silently ignore)
        valid_groups = Group.objects.filter(id__in=ids)
        project.groups.set(valid_groups)
        return Response(ProjectDetailSerializer(project).data)


class GroupViewSet(viewsets.ModelViewSet):
    """그룹 — 단계와 직교한 주제·도메인 묶음. 익명 read+write 허용 (인증 도입 전)."""

    queryset = Group.objects.prefetch_related("projects__category").all()

    def get_serializer_class(self):
        if self.action == "list":
            return GroupListSerializer
        if self.action == "retrieve":
            return GroupDetailSerializer
        return GroupWriteSerializer
