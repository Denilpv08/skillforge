from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError

from app.db.session import SessionLocal
from app.core.security import decode_token
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository

security = HTTPBearer()

def get_db():
    """
    Dependency que provee una sesión de DB por request.
    El patrón 'yield' garantiza que la sesión se cierra
    aunque ocurra una excepción — evita connection leaks.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Extrae y valida el usuario del JWT en cada request protegido."""
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        user_id: str = payload.get("sub")
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = UserRepository(db).get_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user

def require_roles(*roles: UserRole):
    """
    Factory de dependencias para control de acceso por rol.
    Patrón: Higher-Order Function.

    Uso:
        @router.get("/admin", dependencies=[Depends(require_roles(UserRole.ADMIN))])
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user
    return role_checker