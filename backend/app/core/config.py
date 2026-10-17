from typing import Literal
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    ENVIRONMENT: str = "development"

    DB_HOST: str
    DB_PORT: int = 5432
    DB_SSLMODE: Literal["disable", "prefer", "require", "verify-ca", "verify-full"] = "prefer"
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: Literal["HS256"] = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    ESTRADE_GOOGLE_TOKEN_JSON: str | None = None
    ESTRADE_GOOGLE_TOKEN_FILE: str = "google_token.json"
    ESTRADE_GMAIL_SENDER: str | None = None
    ESTRADE_PUBLIC_BASE_URL: str = "http://127.0.0.1:8000"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        hide_input_in_errors=True,
    )

    @model_validator(mode='after')
    def production_requirements(self):
        if self.ENVIRONMENT == 'production':
            if len(self.JWT_SECRET_KEY) < 32:
                raise ValueError('Production requires a signing secret of at least 32 characters')
            if not self.CORS_ORIGINS or any(not origin.startswith('https://') or '*' in origin for origin in self.CORS_ORIGINS):
                raise ValueError('Production requires explicit HTTPS CORS origins')
            if not self.ESTRADE_PUBLIC_BASE_URL.startswith('https://'):
                raise ValueError('Production certificate verification requires an HTTPS API origin')
            if self.DB_SSLMODE not in ('require', 'verify-ca', 'verify-full'):
                raise ValueError('Production requires encrypted PostgreSQL connections')
        return self

settings = Settings()