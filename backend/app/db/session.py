from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,      # Verifica conexión antes de usarla
    pool_size=10,            # Conexiones simultáneas en el pool
    max_overflow=20,         # Conexiones extra en picos de carga
    echo=settings.debug,     # Logs de SQL en modo debug
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)