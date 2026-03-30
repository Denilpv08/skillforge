from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.core.rate_limit import limiter, logger
from app.api.v1 import (
    analytics,
    auth,
    classroom,
    courses,
    enrollments,
    grades,
    instructor,
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

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = request.state._start_time if hasattr(request.state, "_start_time") else None
    response = await call_next(request)
    logger.info(
        "request_completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
    )
    return response

app.include_router(auth.router,        prefix="/api/v1")
app.include_router(courses.router,     prefix="/api/v1")
app.include_router(enrollments.router, prefix="/api/v1")
app.include_router(quizzes.router,     prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(learning_paths.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(instructor.router, prefix="/api/v1")
app.include_router(classroom.router, prefix="/api/v1")
app.include_router(grades.router, prefix="/api/v1")

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
    }