# ops-catalog Project Instructions

> 「교육운영실 프로젝트 카탈로그」 — 한마리양 워크스페이스의 별도 풀스택 프로젝트. EduOps/EduWorks 와 동일 패턴. 이 CLAUDE.md 가 본 프로젝트 작업의 1차 기준.

상위 컨텍스트는 한마리양 루트 `CLAUDE.md` 와 `deliverables/HM-26-pocketman-library-plan/v3-finalization.md` 참조.

---

## 기술 스택
- Backend: Django REST Framework (Python 3.11)
- Frontend: Next.js 15 (App Router, React 19, TypeScript)
- Database: PostgreSQL 16 (격리, 신규 인스턴스)
- 인증: 후속 도입 (스키마는 미리, 라우팅 비활성)

## 로컬 포트
- Postgres 5502 / Backend 8002 / Frontend 3002

## 핵심 도메인
- `apps/catalog/` — Project / Category / StageTransition / Evaluation
- 단계 산출 룰: `apps/catalog/services/staging.py::suggest_stage`
- 엑셀 import: `python manage.py import_pocketman --xlsx <path>`

## 데이터 원칙 (v3 D9)
- **엑셀 원문 (title/description/proposer/priority/source_id) 은 immutable**
- **평가·진행 (difficulty/stage/owner/status) 만 가변**
- 마이그레이션·감사 시 두 층 구분

## 단계 정의 (v3)
- 1단계: P2/P3 → 담당자 직접
- 2단계: P0/P1 + difficulty=low + deploy_intent=False → 인솔파 위임 후보
- 3단계: P0 + difficulty=high + deploy_intent=True → 인솔파 직접 위임

자동 산출은 **추천**만, 적용은 매니저 클릭 (UI 에 "추천: N단계" 표시).

## 공개 정책
- 익명 = read-only
- 모든 write 액션 = Django admin 또는 `/manage?token=...`
- `robots.txt Disallow: /` + `<meta name="robots" content="noindex">` 필수

## PII (v3 D17)
- 이메일은 DB 저장만, 모든 API 응답 직렬화에서 제외 (`fields = [...]` 명시 또는 `exclude`)
- 이름은 공개 동의 토글 (`name_public: bool`), 미동의 시 이니셜
- seed/fixture 에 실제 이메일 박지 말 것

## 배포 (Railway)
- 단일 environment(production), 서비스 이름으로 test/prod 구분
- 자동 migrate: `entrypoint.sh` 가 `migrate --noinput` 실행
- 실서버 작업 시 사용자 명시 승인 필요 (EduOps 와 동일 원칙)

## 격리 헌장 (v3 D7)
- Triforge 측에 데이터 자동 미러 금지 (§1)
- 외부 인용은 `wontak://library/project/<id>` URI 만
- TF-671 외부 공유 noexpose default

## 폐기 조건 (v3 D19)
- 활성 항목 10건 미만 + 신규 분기 5건 미만 → archive-only 모드
- PII 사고 1건 → 즉시 비공개 + Decision 자동 로그

## 작업 지침
- 모든 데이터 변경은 `apps/catalog/admin.py` 또는 hidden-token API 경유
- 새 필드 추가 시 EduOps 처럼 마이그레이션 PR 에 함께 포함
- requirements.txt 변경 시 `make build` 후 동작 확인
- Django settings 의 `SECRET_KEY` 는 dev 평문 OK 이되, prod 는 Railway 환경변수
