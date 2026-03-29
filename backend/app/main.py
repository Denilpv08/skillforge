from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import (
    analytics,
    auth,
    courses,
    enrollments,
    learning_paths,
    quizzes,
    users,
)

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

app.include_router(auth.router,        prefix="/api/v1")
app.include_router(courses.router,     prefix="/api/v1")
app.include_router(enrollments.router, prefix="/api/v1")
app.include_router(quizzes.router,     prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(learning_paths.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
    }