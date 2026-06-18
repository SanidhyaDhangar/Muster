from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./muster.db"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60 * 12
    cors_origins: str = "http://localhost:5173"

    admin_username: str = "admin"
    admin_password: str = "admin123"
    professor_username: str = "professor"
    professor_password: str = "prof123"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
