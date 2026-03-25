from datetime import datetime, timedelta
from typing import Any
import bcrypt
from jose import JWTError, jwt
from app.core.config import settings

def hash_password(password: str) -> str:
    """Convierte una contraseña en texto plano a su hash bcrypt."""
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica que una contraseña coincide con su hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )

def create_access_token(data: dict[str, Any]) -> str:
    payload = data.copy()
    expire = datetime.utcnow() + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload.update({"exp": expire, "type": "access"})
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)

def create_refresh_token(data: dict[str, Any]) -> str:
    payload = {"sub": data["sub"], "type": "refresh"}
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    payload.update({"exp": expire})
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])