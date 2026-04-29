"""ops-catalog 도메인 모델.

데이터 2층 구조 (HM-26 D9):
- 엑셀 원문 (source_id/title/description/proposer/priority) — immutable
- 평가·진행 (difficulty/stage/owner/status) — 가변
"""

from django.conf import settings
from django.db import models


class Tier(models.TextChoices):
    T1 = "T1", "T1. 수강생 케어·운영"
    T2 = "T2", "T2. 콘텐츠·지식 인프라"
    T3 = "T3", "T3. 업무·행정·CS"


class Category(models.Model):
    """T1·1 ~ T3·8 의 8개 카테고리. import 시 자동 생성."""

    code = models.CharField(max_length=8, unique=True, help_text="예: T1·1")
    tier = models.CharField(max_length=2, choices=Tier.choices)
    num = models.IntegerField(help_text="카테고리 번호 (1~8)")
    title = models.CharField(max_length=100)
    note = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ["num"]
        verbose_name = "카테고리"
        verbose_name_plural = "카테고리"

    def __str__(self) -> str:
        return f"{self.code} {self.title}"


class Priority(models.TextChoices):
    P0 = "P0", "P0 (지금 반복하는 일의 시간을 확실히 줄여줌)"
    P1 = "P1", "P1 (시간을 줄여주긴 하나 효과가 상대적으로 작음)"
    P2 = "P2", "P2 (시간 절약보다는 업무 품질 개선에 가까움)"
    P3 = "P3", "P3 (기존 업무 외 새로운 업무 제안/아이디어)"
    UNSET = "unset", "(미지정)"


class Difficulty(models.TextChoices):
    LOW = "low", "낮음"
    MID = "mid", "중간"
    HIGH = "high", "높음"
    UNSET = "unset", "(미평가)"


class Stage(models.IntegerChoices):
    S1 = 1, "1단계 (담당자 직접 진행)"
    S2 = 2, "2단계 (인솔파 위임 후보)"
    S3 = 3, "3단계 (인솔파 직접 위임)"
    S4 = 4, "기타 (제외·별도 관리)"


class Status(models.TextChoices):
    NOT_STARTED = "not_started", "시작 전"
    IN_PROGRESS = "in_progress", "진행 중"
    DONE = "done", "완료"
    ARCHIVED = "archived", "보관"


class Project(models.Model):
    """카탈로그 1 항목 (엑셀 1 행 = 1 Project).

    immutable 필드 — 엑셀 원문 박제.
    """

    # ── 원문 박제 (immutable) ──
    source_id = models.IntegerField(unique=True, help_text="엑셀 원본 행 번호 (R2~R47)")
    title = models.CharField(max_length=300, help_text="엑셀 한줄요약")
    description = models.TextField(help_text="엑셀 AI 청사진")
    proposer = models.CharField(max_length=100, help_text="제안자 이름")
    proposer_email = models.EmailField(blank=True, help_text="제안자 이메일 (PII, 비표시)")
    division = models.CharField(max_length=50, default="교육운영실")
    org = models.CharField(max_length=100, blank=True, help_text="엑셀 '조직' 컬럼 원문")
    impact_scope = models.CharField(max_length=100, blank=True, help_text="영향범위")
    manual_minutes = models.IntegerField(null=True, blank=True, help_text="수동 소요시간 (1회/분)")
    monthly_uses = models.IntegerField(null=True, blank=True, help_text="월 사용횟수")
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.UNSET)

    # ── 가변 (평가·진행) ──
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="projects"
    )
    difficulty = models.CharField(
        max_length=10, choices=Difficulty.choices, default=Difficulty.UNSET
    )
    deploy_intent = models.BooleanField(default=False, help_text="전체 배포 의도")
    stage = models.IntegerField(choices=Stage.choices, default=Stage.S1)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_projects",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NOT_STARTED)
    result_url = models.URLField(blank=True)

    # ── PII 노출 제어 (D17) ──
    name_public = models.BooleanField(
        default=True,
        help_text="제안자 이름 공개 동의. False 면 이니셜만 노출",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["source_id"]
        verbose_name = "카탈로그 항목"
        verbose_name_plural = "카탈로그 항목"
        indexes = [
            models.Index(fields=["stage"]),
            models.Index(fields=["category", "stage"]),
        ]

    def __str__(self) -> str:
        return f"R{self.source_id} · {self.proposer} — {self.title[:40]}"

    @property
    def display_proposer(self) -> str:
        """공개동의 미체크 시 이니셜만 반환."""
        if self.name_public:
            return self.proposer
        if not self.proposer:
            return ""
        # 한글 이름 첫 글자 + "*" 또는 영문 이니셜
        first = self.proposer[0]
        return f"{first}{'·' * max(0, len(self.proposer) - 1)}"


class StageTransition(models.Model):
    """단계 변동 이력 (1→2→3 승급, 강등, 종결)."""

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="stage_transitions"
    )
    from_stage = models.IntegerField(choices=Stage.choices, null=True, blank=True)
    to_stage = models.IntegerField(choices=Stage.choices)
    reason = models.TextField(blank=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stage_transitions",
    )
    actor_label = models.CharField(
        max_length=100,
        blank=True,
        help_text="actor FK 없을 때 fallback (예: '주인', 'import-script')",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "단계 변동 이력"
        verbose_name_plural = "단계 변동 이력"

    def __str__(self) -> str:
        return f"{self.project} · {self.from_stage}→{self.to_stage}"


class Evaluation(models.Model):
    """기술 난이도 평가 (Project 와 1:N — 시간순 누적)."""

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="evaluations")
    difficulty = models.CharField(max_length=10, choices=Difficulty.choices)
    est_effort_days = models.IntegerField(null=True, blank=True, help_text="예상 공수 (일)")
    deploy_intent = models.BooleanField(default=False)
    evaluator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="evaluations",
    )
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "기술 난이도 평가"
        verbose_name_plural = "기술 난이도 평가"

    def __str__(self) -> str:
        return f"{self.project} · {self.difficulty} ({self.created_at:%Y-%m-%d})"
