from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Optional
from uuid import UUID

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings


class UserRole(str, Enum):
    OWNER = "OWNER"
    MANAGER = "MANAGER"
    EMPLOYEE = "EMPLOYEE"
    ACCOUNTANT = "ACCOUNTANT"


# Role hierarchy: higher index = more permissions
ROLE_HIERARCHY = [
    UserRole.EMPLOYEE,
    UserRole.ACCOUNTANT,
    UserRole.MANAGER,
    UserRole.OWNER,
]


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a plain password."""
    return pwd_context.hash(password)


def create_access_token(
    user_id: UUID,
    org_id: UUID,
    role: UserRole,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT access token with user, org, and role claims."""
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    expire = datetime.now(timezone.utc) + expires_delta
    payload = {
        "sub": str(user_id),
        "org_id": str(org_id),
        "role": role.value,
        "type": "access",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(
    user_id: UUID,
    org_id: UUID,
    role: UserRole,
) -> str:
    """Create a JWT refresh token."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(user_id),
        "org_id": str(org_id),
        "role": role.value,
        "type": "refresh",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token. Raises JWTError on failure."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise


def has_role_permission(user_role: UserRole, required_role: UserRole) -> bool:
    """Check if user_role meets or exceeds required_role in hierarchy."""
    user_level = ROLE_HIERARCHY.index(user_role) if user_role in ROLE_HIERARCHY else -1
    required_level = ROLE_HIERARCHY.index(required_role) if required_role in ROLE_HIERARCHY else -1
    return user_level >= required_level
