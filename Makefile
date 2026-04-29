.PHONY: help start stop restart logs status clean build shell-backend shell-frontend init import migrate

DOCKER_COMPOSE := $(shell if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then echo "docker compose"; elif command -v docker-compose >/dev/null 2>&1; then echo "docker-compose"; else echo ""; fi)

help:
	@echo "ops-catalog 로컬 개발 환경 명령어"
	@echo ""
	@echo "사용법: make [명령어]"
	@echo ""
	@echo "서비스 관리:"
	@echo "  make init       - 최초 셋업 (build + up + migrate + import)"
	@echo "  make start      - 서비스 시작 (백그라운드)"
	@echo "  make stop       - 서비스 종료"
	@echo "  make restart    - 재시작"
	@echo "  make logs       - 로그 (-f)"
	@echo "  make status     - 컨테이너 상태"
	@echo "  make build      - 이미지 재빌드"
	@echo "  make clean      - 컨테이너·볼륨 삭제"
	@echo "  make shell-backend  - 백엔드 컨테이너 쉘"
	@echo "  make shell-frontend - 프론트 컨테이너 쉘"
	@echo ""
	@echo "데이터:"
	@echo "  make migrate    - Django migrate"
	@echo "  make import     - 포켓만 엑셀 import (1회)"

init:
	@$(DOCKER_COMPOSE) build
	@$(DOCKER_COMPOSE) up -d
	@echo "⏳ Postgres 헬스체크 대기..."
	@sleep 5
	@$(DOCKER_COMPOSE) exec backend python manage.py migrate --noinput
	@echo "✅ 초기 셋업 완료. 'make import' 로 엑셀 데이터 적재."

start:
	@$(DOCKER_COMPOSE) up -d

stop:
	@$(DOCKER_COMPOSE) down

restart: stop start

logs:
	@$(DOCKER_COMPOSE) logs -f

status:
	@$(DOCKER_COMPOSE) ps

build:
	@$(DOCKER_COMPOSE) build --no-cache

clean:
	@$(DOCKER_COMPOSE) down -v

shell-backend:
	@$(DOCKER_COMPOSE) exec backend /bin/bash

shell-frontend:
	@$(DOCKER_COMPOSE) exec frontend /bin/sh

migrate:
	@$(DOCKER_COMPOSE) exec backend python manage.py migrate

import:
	@$(DOCKER_COMPOSE) exec backend python manage.py import_pocketman \
		--xlsx /app/data/pocketman.xlsx
