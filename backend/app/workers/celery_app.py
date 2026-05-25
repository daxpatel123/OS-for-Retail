"""
Celery application factory.

Configures broker (Redis) and result backend for async task processing.
"""
from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "retailos",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Task routing
    task_routes={
        "app.workers.tasks.parse_flash_report_task": {"queue": "parsing"},
        "app.workers.tasks.parse_invoice_task": {"queue": "parsing"},
        "app.workers.tasks.run_inventory_alerts_task": {"queue": "alerts"},
        "app.workers.tasks.run_shrinkage_scan_task": {"queue": "alerts"},
    },
    # Retry settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    # Result expiry (24 hours)
    result_expires=86400,
)
