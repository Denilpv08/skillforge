from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, require_roles
from app.models.user import User, UserRole
from app.schemas.analytics import (
    AdminAnalyticsOut,
    InstructorAnalyticsOut,
    StudentAnalyticsOut,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/admin",
    response_model=AdminAnalyticsOut,
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN))],
)
def get_admin_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AnalyticsService(db).get_admin_analytics(current_user)


@router.get(
    "/instructor",
    response_model=InstructorAnalyticsOut,
    dependencies=[Depends(require_roles(UserRole.INSTRUCTOR))],
)
def get_instructor_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AnalyticsService(db).get_instructor_analytics(current_user)


@router.get(
    "/student",
    response_model=StudentAnalyticsOut,
    dependencies=[Depends(require_roles(UserRole.STUDENT))],
)
def get_student_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AnalyticsService(db).get_student_analytics(current_user)
