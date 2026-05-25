from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class StoreCreate(BaseModel):
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    phone: Optional[str] = None
    timezone: str = "America/Chicago"
    pos_type: str = "OTHER"


class StoreUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    phone: Optional[str] = None
    timezone: Optional[str] = None
    pos_type: Optional[str] = None
    is_active: Optional[bool] = None


class StoreResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    org_id: UUID
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    phone: Optional[str] = None
    timezone: str
    pos_type: str
    is_active: bool


class RegisterCreate(BaseModel):
    store_id: UUID
    name: str
    terminal_id: Optional[str] = None


class RegisterResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    store_id: UUID
    name: str
    terminal_id: Optional[str] = None
    is_active: bool
