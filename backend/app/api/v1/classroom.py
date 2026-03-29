from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.classroom import (
    ClassroomProgressOut,
    LessonProgressPatchIn,
    LessonProgressPatchOut,
    NoteOut,
    NoteUpsertIn,
)
from app.services.classroom_service import ClassroomService

router = APIRouter(tags=["Classroom"])


@router.get("/notes", response_model=NoteOut | None)
def get_note(
    lesson_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return ClassroomService(db).get_note(current_user, lesson_id)


@router.post("/notes", response_model=NoteOut)
def upsert_note(
    payload: NoteUpsertIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return ClassroomService(db).upsert_note(current_user, payload)


@router.get("/notes/by-course", response_model=list[NoteOut])
def get_notes_by_course(
    course_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return ClassroomService(db).get_notes_by_course(current_user, course_id)


@router.patch("/lessons/{lesson_id}/progress", response_model=LessonProgressPatchOut)
def patch_lesson_progress(
    lesson_id: str,
    payload: LessonProgressPatchIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return ClassroomService(db).update_lesson_progress(
        current_user,
        lesson_id,
        payload,
    )


@router.get("/classroom/{course_id}/progress", response_model=ClassroomProgressOut)
def get_classroom_progress(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return ClassroomService(db).get_course_progress(current_user, course_id)
