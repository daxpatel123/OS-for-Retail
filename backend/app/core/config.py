from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/retailos"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    SECRET_KEY: str = "change-me-in-production-must-be-at-least-32-characters-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Anthropic AI
    ANTHROPIC_API_KEY: str = ""

    # OCR Provider
    OCR_PROVIDER: str = "textract"

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # AWS
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    S3_BUCKET: str = "retailos-uploads"

    # App metadata
    PROJECT_NAME: str = "RetailOS API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8080"]


settings = Settings()
