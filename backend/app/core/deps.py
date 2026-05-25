from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import UserRole, decode_token, has_role_permission
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


class CurrentUser:
    """Container for the authenticated user and their decoded token claims."""

    def __init__(self, user: User, org_id: UUID, role: UserRole):
        self.user = user
        self.org_id = org_id
        self.role = role
        self.user_id = user.id


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CurrentUser:
    """Validate Bearer token and return the authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise credentials_exception

    try:
        payload = decode_token(credentials.credentials)
    except JWTError:
        raise credentials_exception

    token_type = payload.get("type")
    if token_type != "access":
        raise credentials_exception

    user_id_str: str | None = payload.get("sub")
    org_id_str: str | None = payload.get("org_id")
    role_str: str | None = payload.get("role")

    if not user_id_str or not org_id_str or not role_str:
        raise credentials_exception

    try:
        user_id = UUID(user_id_str)
        org_id = UUID(org_id_str)
        role = UserRole(role_str)
    except (ValueError, KeyError):
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return CurrentUser(user=user, org_id=org_id, role=role)


def require_role(minimum_role: UserRole):
    """Factory that returns a dependency enforcing a minimum role."""

    async def role_checker(
        current_user: Annotated[CurrentUser, Depends(get_current_user)],
    ) -> CurrentUser:
        if not has_role_permission(current_user.role, minimum_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {minimum_role.value} role or higher",
            )
        return current_user

    return role_checker


# Convenience dependency aliases
RequireOwner = Depends(require_role(UserRole.OWNER))
RequireManager = Depends(require_role(UserRole.MANAGER))
RequireAccountant = Depends(require_role(UserRole.ACCOUNTANT))
RequireEmployee = Depends(require_role(UserRole.EMPLOYEE))
GetCurrentUser = Depends(get_current_user)
