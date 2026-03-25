import uuid
from datetime import datetime
from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class BaseModel(Base):
    """
    Clase base abstracta con campos comunes para todos los modelos.
    Patrón: Template Method — define la estructura común una sola vez.
    """
    __abstract__ = True  # SQLAlchemy no crea tabla para esta clase

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )