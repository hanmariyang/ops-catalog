# 교육운영실 프로젝트 카탈로그 (ops-catalog)

> 한마리양 워크스페이스의 별도 풀스택 프로젝트. 외부 엑셀 「포켓만프로젝트」(46건의 AI 자동화 아이디어) 를 도서관 카탈로그 형태로 관리하고, 단계 1~3 그룹핑으로 진행을 추적한다.

**상위 작업 트래킹**: 한마리양 워크스페이스의 HM-25 → HM-26 → HM-27 (스캐폴드)
**기획 문서**: `../../deliverables/HM-26-pocketman-library-plan/v3-finalization.md`

---

## 단계 정의

| 단계 | 조건 | 처리 |
|---|---|---|
| **1단계** | P2 또는 P3 | 담당자 직접 진행 (인솔파는 도구만 제공) |
| **2단계** | P0/P1 + 난이도 낮음 + 미배포 | 인솔파 위임 후보 |
| **3단계** | P0 + 난이도 높음 + 배포 | 인솔파 직접 위임 (최우선) |

자동 산출은 *추천*, 적용은 *사람* (매니저).

---

## 기술 스택

- **Backend**: Django REST Framework (Python 3.11)
- **Frontend**: Next.js 15 (App Router, React 19, TypeScript)
- **DB**: PostgreSQL 16 (격리, 신규 인스턴스)
- **배포**: Railway (test/prod 서비스 분리)
- **인증**: 후속 도입 (DRF allauth/simplejwt 스키마 미리 박혀 있음, 라우팅 비활성)

### 포트 (로컬)

| 서비스 | 포트 |
|---|---|
| Postgres | 5502 |
| Backend (Django) | 8002 |
| Frontend (Next.js) | 3002 |

---

## 시작하기 (로컬)

```bash
# 1. 환경변수 파일 복사
cp backend/.env.local.example backend/.env.local
cp frontend/.env.local.example frontend/.env.local

# 2. 최초 셋업 (build + up + migrate)
make init

# 3. 엑셀 데이터 import (1회)
# data/pocketman.xlsx 에 원본 엑셀 두고 실행
mkdir -p backend/data && cp "../../archive/포켓만프로젝트/[리더십] 포켓만프로젝트 우선순위.xlsx" backend/data/pocketman.xlsx
make import

# 4. 접속
# - 카탈로그: http://localhost:3002
# - Django admin: http://localhost:8002/admin
```

---

## 공개 정책

- **퍼블릭 운영 (MVP)** — 익명은 read-only. 검색엔진 인덱싱 차단 (`robots.txt Disallow: /` + `meta noindex`).
- **모든 write** = Django admin 또는 `/manage?token=...` (hidden token URL).
- **인증 도입은 후속** — staff 권한 분리 시점에 NextAuth 또는 DRF 인증 활성화.

### PII 처리
- 제안자 이메일 — DB 저장만, 카드 표면·API 응답 직렬화에서 제외
- 제안자 이름 — 공개 동의 토글 (미동의 시 이니셜)

---

## 배포 (Railway)

EduOps 패턴 답습 — 단일 environment(production) 안에 test·prod 서비스 병치, 서비스 이름으로 구분.

| 서비스 | 브랜치 | 용도 |
|---|---|---|
| `ops-catalog - Backend - Test` | `develop` | 테스트 백엔드 |
| `ops-catalog - Backend` | `main` | 실 백엔드 |
| `ops-catalog - Frontend - Test` | `develop` | 테스트 프론트 |
| `ops-catalog - Frontend` | `main` | 실 프론트 |

`backend/entrypoint.sh` 가 매 배포마다 자동 migrate.

---

## 디렉토리 구조

```
ops-catalog/
├── docker-compose.yml
├── Makefile
├── backend/
│   ├── Dockerfile, Dockerfile.dev
│   ├── entrypoint.sh, entrypoint.dev.sh
│   ├── manage.py, requirements.txt, railway.toml
│   ├── config/                   # Django settings/urls
│   └── apps/
│       └── catalog/              # 도메인
│           ├── models.py         # Project / Category / StageTransition / Evaluation
│           ├── admin.py
│           ├── services/
│           │   └── staging.py    # suggest_stage 룰
│           └── management/commands/
│               └── import_pocketman.py
└── frontend/
    ├── Dockerfile, Dockerfile.dev
    ├── package.json, next.config.mjs, tsconfig.json
    ├── public/robots.txt
    └── app/
        ├── page.tsx              # 칸반 3열 (퍼블릭)
        ├── projects/[id]/page.tsx
        └── manage/page.tsx       # hidden token URL (매니저)
```

---

## 라이선스

MIT (예정)
