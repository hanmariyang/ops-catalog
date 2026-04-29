"""DRF serializers — PII 보호 (D17): 이메일은 제외, 이름은 공개 동의 따라."""

from rest_framework import serializers

from apps.catalog.models import (
    Category,
    Evaluation,
    Project,
    StageTransition,
)
from apps.catalog.services.staging import explain_suggestion, suggest_stage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "code", "tier", "num", "title", "note"]


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
        ]

    def get_proposer_display(self, obj: Project) -> str:
        return obj.display_proposer


class ProjectWriteSerializer(serializers.ModelSerializer):
    """매니저 create/update 용 — 모든 가변 필드 노출."""

    class Meta:
        model = Project
        fields = [
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


class ProjectDetailSerializer(serializers.ModelSerializer):
    """상세 페이지용 — 원문 박제 영역 + 평가 영역 + 추천 단계."""

    proposer_display = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    suggested_stage = serializers.SerializerMethodField()
    suggestion_reason = serializers.SerializerMethodField()
    stage_transitions = StageTransitionSerializer(many=True, read_only=True)
    evaluations = EvaluationSerializer(many=True, read_only=True)

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
            # 이력
            "stage_transitions",
            "evaluations",
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
