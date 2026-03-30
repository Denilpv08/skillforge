from pydantic_settings import BaseSettings
from functools import lru_cache
import secrets


class Settings(BaseSettings):
    app_name: str = "SkillForge"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "development"

    host: str = "0.0.0.0"
    port: int = 8000

    db_host: str
    db_port: int = 3306
    db_user: str
    db_password: str
    db_name: str

    secret_key: str = ""
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    allowed_origins: str = "http://localhost:3000"

    @property
    def database_url(self) -> str:
        return (
            f"mysql+pymysql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.secret_key:
            raise ValueError("SECRET_KEY environment variable is required")
        if not self.db_host:
            raise ValueError("DB_HOST environment variable is required")
        if not self.db_name:
            raise ValueError("DB_NAME environment variable is required")

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()