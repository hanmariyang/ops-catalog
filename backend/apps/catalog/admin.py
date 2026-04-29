"""Django admin — 인증 도입 전 매니저 액션의 1차 인터페이스 (D15)."""

from django.contrib import admin
from django.utils.html import format_html

from apps.catalog.models import (
    Category,
    Evaluation,
    Project,
    StageTransition,
)
from apps.catalog.services.staging import explain_suggestion, suggest_stage


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("code", "tier", "num", "title")
    list_filter = ("tier",)
    search_fields = ("code", "title")
    ordering = ("num",)


class StageTransitionInline(admin.TabularInline):
    model = StageTransition
    extra = 0
    readonly_fields = ("from_stage", "to_stage", "reason", "actor", "actor_label", "created_at")
    can_delete = False


class EvaluationInline(admin.TabularInline):
    model = Evaluation
    extra = 0
    fields = ("difficulty", "est_effort_days", "deploy_intent", "evaluator", "note", "created_at")
    readonly_fields = ("created_at",)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        "source_id",
        "title_short",
        "proposer",
        "category",
        "priority",
        "difficulty",
        "stage",
        "stage_suggestion",
        "status",
        "owner",
    )
    list_filter = ("stage", "category", "priority", "difficulty", "status", "deploy_intent")
    search_fields = ("title", "description", "proposer", "proposer_email")
    readonly_fields = (
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
        "stage_suggestion",
        "created_at",
        "updated_at",
    )
    fieldsets = (
        (
            "엑셀 원문 (immutable)",
            {
                "fields": (
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
                ),
            },
        ),
        (
            "분류·평가 (가변)",
            {
                "fields": (
                    "category",
                    "difficulty",
                    "deploy_intent",
                    "stage",
                    "stage_suggestion",
                    "owner",
                    "status",
                    "result_url",
                    "name_public",
                ),
            },
        ),
        ("기록", {"fields": ("created_at", "updated_at")}),
    )
    inlines = [EvaluationInline, StageTransitionInline]

    def title_short(self, obj):
        return (obj.title[:40] + "…") if len(obj.title) > 40 else obj.title

    title_short.short_description = "한줄요약"

    def stage_suggestion(self, obj):
        s = suggest_stage(obj)
        explain = explain_suggestion(obj)
        same = s == obj.stage
        color = "#10b981" if same else "#f59e0b"
        mark = "✓" if same else "→"
        return format_html(
            '<span style="color:{}">{} 추천: {}단계</span><br>'
            '<small style="color:#64748b">{}</small>',
            color, mark, s, explain,
        )

    stage_suggestion.short_description = "단계 추천"


@admin.register(StageTransition)
class StageTransitionAdmin(admin.ModelAdmin):
    list_display = ("project", "from_stage", "to_stage", "actor_label", "created_at")
    list_filter = ("from_stage", "to_stage")
    search_fields = ("project__title", "reason")
    readonly_fields = ("created_at",)


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ("project", "difficulty", "est_effort_days", "deploy_intent", "evaluator", "created_at")
    list_filter = ("difficulty", "deploy_intent")
    search_fields = ("project__title", "note")
    readonly_fields = ("created_at",)


admin.site.site_header = "교육운영실 프로젝트 카탈로그"
admin.site.site_title = "ops-catalog admin"
admin.site.index_title = "카탈로그 관리"
