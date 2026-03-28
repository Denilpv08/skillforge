from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.dependencies import get_db, get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.learning_path import (
    LearningPathCreate, LearningPathUpdate,
    LearningPathOut, LearningPathCourseItem,
)
from app.services.learning_path_service import LearningPathService

router = APIRouter(prefix="/learning-paths", tags=["Learning Paths"])

class SetCoursesRequest(BaseModel):
    courses: list[LearningPathCourseItem]

@router.get("", response_model=list[LearningPathOut])
def list_paths(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Todos los usuarios autenticados pueden ver las rutas."""
    return LearningPathService(db).get_all(current_user.organization_id)

@router.post(
    "",
    response_model=LearningPathOut,
    status_code=201,
    dependencies=[
        Depends(require_roles(
            UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR
        ))
    ],
)
def create_path(
    data: LearningPathCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return LearningPathService(db).create(
        data, current_user.organization_id, current_user
    )

@router.get("/{path_id}", response_model=LearningPathOut)
def get_path(
    path_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return LearningPathService(db).get_by_id(
        path_id, current_user.organization_id
    )

@router.patch(
    "/{path_id}",
    response_model=LearningPathOut,
    dependencies=[
        Depends(require_roles(
            UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR
        ))
    ],
)
def update_path(
    path_id: str,
    data: LearningPathUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return LearningPathService(db).update(
        path_id, data, current_user.organization_id, current_user
    )

@router.put(
    "/{path_id}/courses",
    response_model=LearningPathOut,
    dependencies=[
        Depends(require_roles(
            UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR
        ))
    ],
)
def set_path_courses(
    path_id: str,
    data: SetCoursesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reemplaza los cursos de la ruta con el nuevo orden."""
    return LearningPathService(db).set_courses(
        path_id,
        [c.model_dump() for c in data.courses],
        current_user.organization_id,
        current_user,
    )

@router.delete("/{path_id}", status_code=204)
def delete_path(
    path_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    LearningPathService(db).delete(
        path_id, current_user.organization_id, current_user
    )