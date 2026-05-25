"""
Authentication routes: login, register, token refresh, and current user.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    UserRole,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.core.deps import GetCurrentUser, CurrentUser
from app.models.organization import Organization
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterOrganizationRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Authenticate with email and password. Returns access + refresh tokens."""
    result = await db.execute(
        select(User).where(User.email == payload.email, User.is_active == True)
    )
    user = result.scalar_one_or_none()

    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    role = UserRole(user.role.value)
    access_token = create_access_token(user.id, user.org_id, role)
    refresh_token = create_refresh_token(user.id, user.org_id, role)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    payload: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Exchange a valid refresh token for a new access + refresh token pair."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token_data = decode_token(payload.refresh_token)
    except JWTError:
        raise credentials_exception

    if token_data.get("type") != "refresh":
        raise credentials_exception

    from uuid import UUID

    user_id = UUID(token_data["sub"])
    org_id = UUID(token_data["org_id"])
    role = UserRole(token_data["role"])

    result = await db.execute(
        select(User).where(User.id == user_id, User.is_active == True)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception

    new_access = create_access_token(user_id, org_id, role)
    new_refresh = create_refresh_token(user_id, org_id, role)

    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterOrganizationRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Register a new organization and its first owner user.
    Returns tokens for immediate login.
    """
    # Ensure slug is unique
    slug_check = await db.execute(
        select(Organization).where(Organization.slug == payload.org_slug)
    )
    if slug_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization slug already taken",
        )

    # Ensure email is unique
    email_check = await db.execute(select(User).where(User.email == payload.email))
    if email_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create org
    org = Organization(
        name=payload.org_name,
        slug=payload.org_slug,
        subscription_plan="starter",
        is_active=True,
    )
    db.add(org)
    await db.flush()  # Get org.id before creating user

    # Create owner user
    user = User(
        org_id=org.id,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=UserRole.OWNER,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    role = UserRole.OWNER
    access_token = create_access_token(user.id, org.id, role)
    refresh_token = create_refresh_token(user.id, org.id, role)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Annotated[CurrentUser, GetCurrentUser]):
    """Return the currently authenticated user's profile."""
    return UserResponse(
        id=current_user.user.id,
        org_id=current_user.org_id,
        email=current_user.user.email,
        first_name=current_user.user.first_name,
        last_name=current_user.user.last_name,
        role=current_user.role.value,
        is_active=current_user.user.is_active,
    )
