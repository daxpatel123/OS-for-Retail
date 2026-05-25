# ─────────────────────────────────────────────────────────────────────────────
# RetailOS — Makefile
# Convenience wrappers around docker-compose commands.
# Usage:  make <target>
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: up down build migrate seed logs shell-backend shell-db test format help

# ── Compose lifecycle ─────────────────────────────────────────────────────────

## up: Start all services in detached mode
up:
	docker-compose up -d

## down: Stop and remove containers (volumes are preserved)
down:
	docker-compose down

## build: Rebuild all Docker images from scratch
build:
	docker-compose build

# ── Database ──────────────────────────────────────────────────────────────────

## migrate: Apply all pending Alembic migrations (upgrade head)
migrate:
	docker-compose exec backend alembic upgrade head

## seed: Populate the database with demo / seed data
seed:
	docker-compose exec backend python -m app.scripts.seed_data

# ── Observability ─────────────────────────────────────────────────────────────

## logs: Tail live logs from the backend container (Ctrl-C to stop)
logs:
	docker-compose logs -f backend

# ── Shells ────────────────────────────────────────────────────────────────────

## shell-backend: Open an interactive bash shell inside the backend container
shell-backend:
	docker-compose exec backend bash

## shell-db: Open a psql session on the retailos database
shell-db:
	docker-compose exec postgres psql -U retailos -d retailos

# ── Quality ───────────────────────────────────────────────────────────────────

## test: Run the full backend pytest suite with verbose output
test:
	docker-compose exec backend pytest tests/ -v

## format: Auto-format Python source with black and isort
format:
	docker-compose exec backend black app/
	docker-compose exec backend isort app/

# ── Help ──────────────────────────────────────────────────────────────────────

## help: List all available make targets with descriptions
help:
	@grep -E '^## ' Makefile | sed 's/## //' | column -t -s ':'
