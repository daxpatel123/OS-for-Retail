# RetailOS

RetailOS is an AI-powered operating system for gas station and convenience store management, combining real-time fuel pricing, inventory control, invoice OCR, and a natural-language assistant in a single unified platform. It is built as a cloud-native, containerised web application designed to be deployed on a single server or scaled horizontally on Kubernetes.

---

## Architecture

```
                        ┌──────────────────────────────────────────┐
                        │               Browser / Client            │
                        └────────────────────┬─────────────────────┘
                                             │ HTTP / WebSocket
                        ┌────────────────────▼─────────────────────┐
                        │             Nginx (port 80)               │
                        │   /api/* → backend   /  → frontend        │
                        └──────────┬──────────────────┬────────────┘
                                   │                  │
               ┌───────────────────▼──┐    ┌──────────▼───────────────┐
               │  FastAPI Backend      │    │  Next.js Frontend         │
               │  (Python 3.11)        │    │  (React / TypeScript)     │
               │  port 8000            │    │  port 3000                │
               └──────┬───────┬───────┘    └──────────────────────────┘
                      │       │
          ┌───────────▼──┐  ┌─▼──────────────────┐
          │  PostgreSQL   │  │  Redis              │
          │  (port 5432)  │  │  (port 6379)        │
          │  Primary DB   │  │  Cache + Task Queue │
          └───────────────┘  └────────┬────────────┘
                                      │
                          ┌───────────▼────────────┐
                          │  Celery Worker           │
                          │  (async task processing) │
                          │  OCR · AI jobs · reports │
                          └──────────────────────────┘
```

---

## Quick Start (Docker Compose)

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) 24+
- [Docker Compose](https://docs.docker.com/compose/install/) v2+
- 4 GB RAM minimum (8 GB recommended)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/OS-for-Retail.git
cd OS-for-Retail
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set at minimum:

| Variable | Description |
|---|---|
| `SECRET_KEY` | Random 32+ character secret (see comment in file) |
| `ANTHROPIC_API_KEY` | API key from [console.anthropic.com](https://console.anthropic.com) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | AWS credentials (required for Textract OCR and S3) |

### 3. Build and start all services

```bash
make build
make up
```

Or without Make:

```bash
docker-compose build
docker-compose up -d
```

### 4. Run database migrations

```bash
make migrate
```

### 5. (Optional) Seed demo data

```bash
make seed
```

### 6. Open the application

| Service | URL |
|---|---|
| Web UI | http://localhost |
| REST API | http://localhost/api |
| Interactive API docs | http://localhost/api/docs |
| ReDoc | http://localhost/api/redoc |

---

## Environment Setup

All configuration is driven by environment variables. See [`.env.example`](.env.example) for the full reference. Key groups:

- **Database** — `DATABASE_URL` (async) and `DATABASE_URL_SYNC` (Alembic)
- **Redis** — `REDIS_URL` for both Celery broker/backend and application cache
- **Security** — `SECRET_KEY`, JWT settings
- **Anthropic** — `ANTHROPIC_API_KEY` for the AI assistant
- **AWS** — credentials and region for S3 uploads and Textract OCR
- **OCR Provider** — `OCR_PROVIDER=local|textract|google_vision`

---

## API Documentation

Interactive Swagger UI is available at **`/api/docs`** when the backend is running.

The REST API follows OpenAPI 3.1 and is versioned under `/api/v1/`.

Key endpoint groups:

| Prefix | Description |
|---|---|
| `/api/v1/auth` | Registration, login, token refresh |
| `/api/v1/fuel` | Fuel prices, delivery logs |
| `/api/v1/inventory` | Products, stock levels, alerts |
| `/api/v1/invoices` | Upload, OCR extraction, line-item review |
| `/api/v1/flash-reports` | Daily/weekly P&L summaries |
| `/api/v1/assistant` | AI chat completions (streaming) |

---

## Feature List (MVP)

- **Dashboard** — At-a-glance KPIs: fuel volume, revenue, margin, stock alerts
- **Fuel Management** — Track pump prices, delivery records, and profitability by grade
- **Inventory Control** — Product catalogue with par-level alerts and reorder suggestions
- **Invoice OCR** — Upload supplier invoices (PDF/image); AI extracts line items automatically
- **Flash Reports** — Automated daily and weekly profit-and-loss summaries
- **AI Assistant** — Natural-language chat powered by Claude for business Q&A and insights
- **Alert Center** — Configurable threshold alerts for low stock, price anomalies, and compliance
- **Role-based Access** — Owner, Manager, and Cashier permission levels

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Backend** | FastAPI 0.115, Python 3.11, Pydantic v2 |
| **Database** | PostgreSQL 16, SQLAlchemy 2 (async) |
| **Migrations** | Alembic |
| **Cache / Queue** | Redis 7, Celery 5 |
| **AI** | Anthropic Claude (via `anthropic` SDK) |
| **OCR** | AWS Textract (primary), local PDF parser (fallback) |
| **File Storage** | AWS S3 |
| **Auth** | JWT (python-jose), bcrypt |
| **Reverse Proxy** | Nginx (alpine) |
| **Containerisation** | Docker, Docker Compose |

---

## Development Setup (without Docker)

### Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp ../.env.example .env
# Edit .env — point DATABASE_URL / REDIS_URL at local services

# Run migrations
alembic upgrade head

# Start the development server (hot reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Celery Worker

```bash
# In a second terminal (same venv, same backend/ directory)
celery -A app.workers.celery_app worker --loglevel=info
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy and configure environment
cp ../.env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000

# Start the dev server
npm run dev
```

The frontend will be available at http://localhost:3000 and the API at http://localhost:8000.

---

## Project Structure

```
OS-for-Retail/
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/v1/           # Route handlers
│   │   ├── core/             # Config, DB, security
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # Business logic layer
│   │   ├── workers/          # Celery tasks
│   │   └── scripts/          # One-off utilities (seed, etc.)
│   ├── alembic/              # DB migration scripts
│   ├── tests/                # Pytest test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # Next.js application
│   └── src/
│       ├── app/              # App Router pages
│       ├── components/       # Reusable UI components
│       ├── hooks/            # Custom React hooks
│       ├── lib/              # API client, utilities
│       ├── store/            # Global state (Zustand / Redux)
│       └── types/            # Shared TypeScript types
├── nginx/
│   └── nginx.conf            # Reverse proxy config
├── docker-compose.yml
├── Makefile                  # Dev convenience targets
├── .env.example              # Environment variable template
└── README.md
```

---

## Useful Make Targets

```
make up            Start all services in the background
make down          Stop all services
make build         Rebuild all Docker images
make migrate       Run Alembic migrations (upgrade head)
make seed          Populate the database with demo data
make logs          Tail backend logs
make shell-backend Open a bash shell inside the backend container
make shell-db      Open a psql shell on the database
make test          Run the backend test suite
make format        Auto-format Python code (black + isort)
```

---

## Contributing

1. Fork the repository and create a feature branch (`git checkout -b feat/my-feature`).
2. Commit with conventional commits (`feat:`, `fix:`, `chore:`).
3. Open a pull request — CI must pass before merging.

## License

MIT © RetailOS Contributors
