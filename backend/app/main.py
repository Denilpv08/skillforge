from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth  # nuevo

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/api/docs" if settings.debug else None,
    redoc_url="/api/redoc" if settings.debug else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(auth.router, prefix="/api/v1")


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
    }