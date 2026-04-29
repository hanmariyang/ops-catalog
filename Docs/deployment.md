# Railway 배포 가이드 (ops-catalog)

EduOps 패턴 답습 — 단일 environment(production) 안에 test·prod 서비스 병치.

GitHub repo: https://github.com/hanmariyang/ops-catalog
브랜치: `main` (실서버) / `develop` (테스트)

---

## 1. Railway 로그인 (1회)

```bash
# 한마리양 워크스페이스 세션에서:
! railway login          # 브라우저 OAuth 열림
railway whoami           # 확인
```

---

## 2. 프로젝트 생성 + GitHub 연결

**웹 UI 권장** — Railway 가 GitHub repo 를 watching 하면 push 만으로 자동 배포.

1. https://railway.app/new 접속
2. **"Deploy from GitHub repo"** → `hanmariyang/ops-catalog` 선택
3. 프로젝트명: `ops-catalog`

이 시점에 Railway 가 root 의 `Dockerfile` 을 찾으려 시도. 우리는 `backend/`, `frontend/` 에 각각 있으니 **service 별로 root directory 지정** 필요 (다음 단계).

---

## 3. 4 서비스 + 2 Postgres 구성

EduOps 패턴 그대로:

| 서비스명 | branch | root | service type |
|---|---|---|---|
| `ops-catalog - Backend - Test` | `develop` | `backend` | from repo (Dockerfile) |
| `ops-catalog - Backend` | `main` | `backend` | from repo (Dockerfile) |
| `ops-catalog - Frontend - Test` | `develop` | `frontend` | from repo (Dockerfile) |
| `ops-catalog - Frontend` | `main` | `frontend` | from repo (Dockerfile) |
| `Postgres - Test` | — | — | Database plugin |
| `Postgres` | — | — | Database plugin |

각 서비스 Settings 에서:
- **Source**: `hanmariyang/ops-catalog` · branch (위 표) · root directory (`backend` 또는 `frontend`)
- **Build**: Dockerfile (자동 감지)
- **Generate Domain** 클릭하면 `*.up.railway.app` 부여됨

---

## 4. 환경변수 (각 서비스)

### Backend Test / Backend Prod 공통

| 변수 | 값 |
|---|---|
| `DJANGO_SECRET_KEY` | 32+자 랜덤 (`python -c "import secrets; print(secrets.token_urlsafe(48))"`) |
| `DJANGO_DEBUG` | `False` |
| `DJANGO_ALLOWED_HOSTS` | `<railway-domain>,*.up.railway.app` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Test 는 Postgres-Test 참조) |
| `MANAGE_TOKEN` | 32+자 랜덤 (test/prod 별개) |
| `CORS_ALLOWED_ORIGINS` | 해당 frontend 의 railway 도메인 |
| `ENVIRONMENT` | `test` 또는 `production` |
| `DJANGO_SUPERUSER_USERNAME` | `hanmari` |
| `DJANGO_SUPERUSER_PASSWORD` | 32+자 랜덤 |
| `DJANGO_SUPERUSER_EMAIL` | `hanmari@yourdomain` |
| `PORT` | (Railway 자동 주입) |

### Frontend Test / Frontend Prod

| 변수 | 값 |
|---|---|
| `NEXT_PUBLIC_API_URL` | 해당 backend 의 railway 도메인 |
| `BACKEND_API_URL` | 해당 backend 의 railway 도메인 (server-side fetch 용) |
| `NEXT_PUBLIC_ENVIRONMENT` | `test` 또는 `production` |
| `MANAGE_TOKEN` | backend 와 동일한 값 (manage 페이지 서버사이드 비교) |

> **로컬 `.env.local` 의 값은 그대로 쓰지 말 것** — prod 는 별도 secret. `MANAGE_TOKEN` 도 분리.

---

## 5. 배포 후 수동 작업 (각 환경 1회)

### 5-1. Backend 가 자동 migrate 적용했는지 확인

`entrypoint.sh` 가 `migrate --noinput` 자동 실행. 첫 배포 후 Postgres 에 테이블 생김.

### 5-2. Superuser 자동 생성 확인

`entrypoint.sh` 가 `DJANGO_SUPERUSER_*` 환경변수 보고 자동 생성. Railway 의 service shell 또는 admin 로그인으로 확인.

### 5-3. 엑셀 import (1회)

```bash
# Railway CLI:
railway link --service "ops-catalog - Backend - Test"
railway run python manage.py import_pocketman --xlsx /path/to/pocketman.xlsx
```

또는 Railway 웹 UI 의 service shell 에서 직접. **운영 DB 에 import 시 사용자 명시 승인 후 실행 (CLAUDE.md 원칙).**

엑셀 파일을 Railway 컨테이너에 어떻게 넣을지:
- 옵션 A: 첫 배포 전에 `backend/data/pocketman.xlsx` 를 1회만 commit → import 후 다시 .gitignore (PII 잠시 노출되므로 비추천)
- 옵션 B: Railway shell 로 `curl` 받아오기 (private signed URL 필요)
- **옵션 C (권장)**: import 작업을 로컬에서 실행하고 결과 데이터를 `pg_dump`/`psql` 로 운영 DB 에 옮기기

---

## 6. 도메인 (선택)

Railway 가 부여하는 `*.up.railway.app` 으로 충분히 동작. 자체 도메인은 후속 결정.

---

## 7. 동작 확인 체크리스트

- [ ] `https://<frontend-test>.up.railway.app/` 접속 → 칸반 3열 보임
- [ ] `https://<backend-test>.up.railway.app/health/` → `{"status":"ok"}`
- [ ] `https://<backend-test>.up.railway.app/admin` 로그인
- [ ] import 후 카탈로그 46건 표시
- [ ] `<frontend>/manage?token=<MANAGE_TOKEN>` → 매니저 페이지
- [ ] `<frontend>/manage` (token 없이) → 접근 권한 없음
- [ ] `robots.txt` 응답 `Disallow: /`

---

## 8. 후속 작업 (인증 도입 후)

- NextAuth (frontend) + DRF simplejwt (backend) 활성화
- staff 사용자 추가
- `/manage?token=` 라우트를 `/dashboard` 로 자연 승격
- hidden token 환경변수 제거
