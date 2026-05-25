"""
Basic health and sanity tests for the RetailOS API.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """GET /health should return 200 with status=healthy."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data
    assert "version" in data


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    """GET / should return a welcome message."""
    response = await client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


@pytest.mark.asyncio
async def test_docs_available(client: AsyncClient):
    """GET /docs should be accessible in development mode."""
    response = await client.get("/docs")
    # Returns HTML (200) or redirect in debug mode
    assert response.status_code in (200, 307)


@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    """Register a new org + user, then login and verify the token works."""
    # Register
    register_resp = await client.post(
        "/api/v1/auth/register",
        json={
            "org_name": "Happy Fuel Inc.",
            "org_slug": "happy-fuel",
            "first_name": "Bob",
            "last_name": "Smith",
            "email": "bob@happyfuel.com",
            "password": "securepass123",
        },
    )
    assert register_resp.status_code == 201, register_resp.text
    tokens = register_resp.json()
    assert "access_token" in tokens
    assert tokens["token_type"] == "bearer"

    # Use the returned token to fetch /me
    me_resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert me_resp.status_code == 200
    me = me_resp.json()
    assert me["email"] == "bob@happyfuel.com"
    assert me["role"] == "OWNER"

    # Login with credentials
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "bob@happyfuel.com", "password": "securepass123"},
    )
    assert login_resp.status_code == 200
    login_tokens = login_resp.json()
    assert "access_token" in login_tokens


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    """Login with wrong password should return 401."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "wrongpass"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_protected_endpoint_requires_auth(client: AsyncClient):
    """Accessing a protected endpoint without a token should return 401 or 403."""
    response = await client.get("/api/v1/stores/")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_create_and_list_store(client: AsyncClient, owner_headers: dict):
    """An owner should be able to create and then list a store."""
    create_resp = await client.post(
        "/api/v1/stores/",
        json={
            "name": "Corner Fuel Stop",
            "city": "Chicago",
            "state": "IL",
            "timezone": "America/Chicago",
            "pos_type": "OTHER",
        },
        headers=owner_headers,
    )
    assert create_resp.status_code == 201, create_resp.text
    store = create_resp.json()
    assert store["name"] == "Corner Fuel Stop"
    store_id = store["id"]

    list_resp = await client.get("/api/v1/stores/", headers=owner_headers)
    assert list_resp.status_code == 200
    stores = list_resp.json()
    assert any(s["id"] == store_id for s in stores)


@pytest.mark.asyncio
async def test_register_duplicate_slug(client: AsyncClient):
    """Registering with a duplicate org slug should return 409."""
    payload = {
        "org_name": "Fuel Co A",
        "org_slug": "unique-slug-xyz",
        "first_name": "Carol",
        "last_name": "Jones",
        "email": "carol@fuelco.com",
        "password": "password123",
    }
    r1 = await client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 201

    payload["email"] = "carol2@fuelco.com"  # different email, same slug
    r2 = await client.post("/api/v1/auth/register", json=payload)
    assert r2.status_code == 409
