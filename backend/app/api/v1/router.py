"""
Main API v1 router. Includes all sub-routers.
"""
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.stores import router as stores_router
from app.api.v1.products import router as products_router
from app.api.v1.inventory import router as inventory_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.invoices import router as invoices_router
from app.api.v1.flash_reports import router as flash_reports_router
from app.api.v1.fuel import router as fuel_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.assistant import router as assistant_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(stores_router)
api_router.include_router(products_router)
api_router.include_router(inventory_router)
api_router.include_router(transactions_router)
api_router.include_router(invoices_router)
api_router.include_router(flash_reports_router)
api_router.include_router(fuel_router)
api_router.include_router(dashboard_router)
api_router.include_router(alerts_router)
api_router.include_router(assistant_router)
