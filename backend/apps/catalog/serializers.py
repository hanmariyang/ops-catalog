"""DRF serializers — PII 보호 (D17): 이메일은 제외, 이름은 공개 동의 따라."""

from rest_framework import serializers

from apps.catalog.models import (
    Category,
    Evaluation,
    Group,
    Project,
    StageTransition,
)
from apps.catalog.services.staging import explain_suggestion, suggest_stage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "code", "tier", "num", "title", "note"]


class GroupBadgeSerializer(serializers.ModelSerializer):
    """카드/리스트에 그룹 표시용 — 가벼운 스키마."""

    class Meta:
        model = Group
        fields = ["id", "name", "color"]


class MergedChildSerializer(serializers.ModelSerializer):
    """카드/상세에 흡수된 자식 프로젝트 표시용 — 가벼운 스키마.

    원문 박제 (title, proposer, priority, source_id) 만 노출.
    """

    proposer_display = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ["id", "source_id", "title", "proposer_display", "priority"]

    def get_proposer_display(self, obj: "Project") -> str:
        return obj.display_proposer


class MergedIntoSerializer(serializers.ModelSerializer):
    """자식 상세에 '이 프로젝트는 X 에 병합됨' 안내용."""

    class Meta:
        model = Project
        fields = ["id", "source_id", "title"]


class GroupListSerializer(serializers.ModelSerializer):
    """그룹 리스트 페이지용 — 멤버 수 포함."""

    project_count = serializers.IntegerField(source="projects.count", read_only=True)

    class Meta:
        model = Group
        fields = ["id", "name", "description", "color", "project_count", "created_at", "updated_at"]


class GroupWriteSerializer(serializers.ModelSerializer):
    """그룹 create/update 용."""

    class Meta:
        model = Group
        fields = ["id", "name", "description", "color"]
        read_only_fields = ["id"]


class StageTransitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StageTransition
        fields = [
            "id",
            "from_stage",
            "to_stage",
            "reason",
            "actor_label",
            "created_at",
        ]


class EvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluation
        fields = [
            "id",
            "difficulty",
            "est_effort_days",
            "deploy_intent",
            "note",
            "created_at",
        ]


class ProjectListSerializer(serializers.ModelSerializer):
    """칸반 카드 / 목록용 — 가벼운 스키마, PII 제외."""

    proposer_display = serializers.SerializerMethodField()
    category_code = serializers.CharField(source="category.code", read_only=True)
    category_title = serializers.CharField(source="category.title", read_only=True)
    tier = serializers.CharField(source="category.tier", read_only=True)
    groups = GroupBadgeSerializer(many=True, read_only=True)
    merged_children = MergedChildSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "source_id",
            "title",
            "proposer_display",
            "category_code",
            "category_title",
            "tier",
            "priority",
            "difficulty",
            "stage",
            "status",
            "deploy_intent",
            "groups",
            "merged_children",
        ]

    def get_proposer_display(self, obj: Project) -> str:
        return obj.display_proposer


class ProjectWriteSerializer(serializers.ModelSerializer):
    """매니저 create/update 용 — 모든 가변 필드 노출."""

    class Meta:
        model = Project
        fields = [
            "id",
            "source_id",
            "title",
            "description",
            "proposer",
            "proposer_email",
            "org",
            "impact_scope",
            "manual_minutes",
            "monthly_uses",
            "priority",
            "category",
            "difficulty",
            "deploy_intent",
            "stage",
            "status",
            "result_url",
            "name_public",
        ]
        read_only_fields = ["id"]


class ProjectDetailSerializer(serializers.ModelSerializer):
    """상세 페이지용 — 원문 박제 영역 + 평가 영역 + 추천 단계."""

    proposer_display = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    suggested_stage = serializers.SerializerMethodField()
    suggestion_reason = serializers.SerializerMethodField()
    stage_transitions = StageTransitionSerializer(many=True, read_only=True)
    evaluations = EvaluationSerializer(many=True, read_only=True)
    groups = GroupBadgeSerializer(many=True, read_only=True)
    merged_into = MergedIntoSerializer(read_only=True)
    merged_children = MergedChildSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            # 원문
            "id",
            "source_id",
            "title",
            "description",
            "proposer_display",
            "org",
            "impact_scope",
            "manual_minutes",
            "monthly_uses",
            "priority",
            # 분류·평가
            "category",
            "difficulty",
            "deploy_intent",
            "stage",
            "suggested_stage",
            "suggestion_reason",
            "status",
            "result_url",
            "name_public",
            # 이력
            "stage_transitions",
            "evaluations",
            # 그룹
            "groups",
            # 병합
            "merged_into",
            "merged_children",
            # 메타
            "created_at",
            "updated_at",
        ]
        # 이메일은 절대 직렬화 X
        # owner FK 도 인증 도입 후 노출

    def get_proposer_display(self, obj: Project) -> str:
        return obj.display_proposer

    def get_suggested_stage(self, obj: Project) -> int:
        return suggest_stage(obj)

    def get_suggestion_reason(self, obj: Project) -> str:
        return explain_suggestion(obj)


class GroupDetailSerializer(serializers.ModelSerializer):
    """그룹 상세 — 그룹 메타 + 소속 프로젝트 카드 그리드용."""

    project_count = serializers.IntegerField(source="projects.count", read_only=True)
    member_projects = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = [
            "id",
            "name",
            "description",
            "color",
            "project_count",
            "member_projects",
            "created_at",
            "updated_at",
        ]

    def get_member_projects(self, obj: Group):
        qs = obj.projects.select_related("category").order_by(
            "category__num", "proposer", "source_id"
        )
        return ProjectListSerializer(qs, many=True).data
