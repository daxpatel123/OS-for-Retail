"""
Pytest configuration and shared fixtures for RetailOS backend tests.
"""
import asyncio
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.core.security import UserRole, create_access_token, get_password_hash
from app.main import app
from app.models.organization import Organization
from app.models.store import Store
from app.models.user import User

# Use an in-memory SQLite database for tests (note: some PostgreSQL-specific
# features like JSONB fall back to JSON in SQLite).
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create a single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    """Create async engine backed by in-memory SQLite."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture()
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Provide a transactional test session that rolls back after each test."""
    session_factory = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )
    async with session_factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture()
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Provide an HTTPX async test client with DB dependency overridden."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://testserver"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture()
async def test_org(db_session: AsyncSession) -> Organization:
    """Create a test organization."""
    org = Organization(
        name="Test Gas Stations Inc.",
        slug="test-gas",
        subscription_plan="starter",
        is_active=True,
    )
    db_session.add(org)
    await db_session.flush()
    return org


@pytest_asyncio.fixture()
async def test_store(db_session: AsyncSession, test_org: Organization) -> Store:
    """Create a test store."""
    store = Store(
        org_id=test_org.id,
        name="Main Street Fuel & Go",
        city="Springfield",
        state="IL",
        timezone="America/Chicago",
        pos_type="OTHER",
        is_active=True,
    )
    db_session.add(store)
    await db_session.flush()
    return store


@pytest_asyncio.fixture()
async def test_owner(db_session: AsyncSession, test_org: Organization) -> User:
    """Create an owner user for the test org."""
    user = User(
        org_id=test_org.id,
        email="owner@testgas.com",
        hashed_password=get_password_hash("testpassword123"),
        first_name="Alice",
        last_name="Owner",
        role=UserRole.OWNER,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest.fixture()
def owner_token(test_owner: User, test_org: Organization) -> str:
    """Generate a valid JWT access token for the test owner."""
    return create_access_token(test_owner.id, test_org.id, UserRole.OWNER)


@pytest.fixture()
def owner_headers(owner_token: str) -> dict:
    """HTTP Authorization headers for the test owner."""
    return {"Authorization": f"Bearer {owner_token}"}
