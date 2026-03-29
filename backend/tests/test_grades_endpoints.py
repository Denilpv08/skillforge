import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault("DB_HOST", "127.0.0.1")
os.environ.setdefault("DB_PORT", "3306")
os.environ.setdefault("DB_USER", "test")
os.environ.setdefault("DB_PASSWORD", "test")
os.environ.setdefault("DB_NAME", "test")
os.environ.setdefault("SECRET_KEY", "test-secret")

from app.core.dependencies import get_current_user, get_db
from app.db.base import Base
from app.main import app
from app.models.course import Course, CourseStatus
from app.models.enrollment import Enrollment
from app.models.organization import Organization
from app.models.quiz import Quiz, QuizAttempt
from app.models.user import User, UserRole


@pytest.fixture()
def setup_context() -> Iterator[dict[str, object]]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()

    org = Organization(name="Org Grades", slug="org-grades", is_active=True)
    session.add(org)
    session.flush()

    instructor = User(
        organization_id=org.id,
        email="instructor@grades.com",
        password_hash="hash",
        full_name="Instructor Grades",
        role=UserRole.INSTRUCTOR,
        is_active=True,
    )
    student = User(
        organization_id=org.id,
        email="student@grades.com",
        password_hash="hash",
        full_name="Student Grades",
        role=UserRole.STUDENT,
        is_active=True,
    )
    session.add_all([instructor, student])
    session.flush()

    course = Course(
        organization_id=org.id,
        instructor_id=instructor.id,
        title="Curso Evaluaciones",
        slug="curso-evaluaciones",
        status=CourseStatus.PUBLISHED,
    )
    session.add(course)
    session.flush()

    enrollment = Enrollment(
        user_id=student.id,
        course_id=course.id,
        progress_pct=80,
    )
    session.add(enrollment)
    session.flush()

    quiz_one = Quiz(
        course_id=course.id,
        title="Quiz 1",
        pass_score=70,
        max_attempts=3,
        weight=1.0,
    )
    quiz_two = Quiz(
        course_id=course.id,
        title="Quiz 2",
        pass_score=70,
        max_attempts=3,
        weight=2.0,
    )
    session.add_all([quiz_one, quiz_two])
    session.flush()

    session.add_all(
        [
            QuizAttempt(
                user_id=student.id,
                quiz_id=quiz_one.id,
                score=80,
                passed=True,
                answers_json={},
            ),
            QuizAttempt(
                user_id=student.id,
                quiz_id=quiz_two.id,
                score=60,
                passed=False,
                answers_json={},
            ),
        ]
    )

    session.commit()

    active_user = {"value": student}

    def _override_get_db() -> Iterator[Session]:
        try:
            yield session
        finally:
            pass

    def _override_get_current_user() -> User:
        return active_user["value"]

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_user] = _override_get_current_user

    yield {
        "session": session,
        "student": student,
        "instructor": instructor,
        "course": course,
        "active_user": active_user,
    }

    app.dependency_overrides.clear()
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(setup_context: dict[str, object]) -> TestClient:
    return TestClient(app)


def test_get_my_grades_returns_courses_and_achievements(
    client: TestClient,
    setup_context: dict[str, object],
):
    setup_context["active_user"]["value"] = setup_context["student"]

    response = client.get("/api/v1/grades/my-grades")
    assert response.status_code == 200

    payload = response.json()
    assert len(payload["courses"]) == 1
    assert payload["courses"][0]["course_title"] == "Curso Evaluaciones"
    assert payload["courses"][0]["average_score"] > 0
    assert len(payload["achievements"]) == 3


def test_get_course_gradebook_for_instructor(
    client: TestClient,
    setup_context: dict[str, object],
):
    setup_context["active_user"]["value"] = setup_context["instructor"]
    course = setup_context["course"]

    response = client.get(f"/api/v1/grades/course/{course.id}")
    assert response.status_code == 200

    payload = response.json()
    assert payload["course_id"] == course.id
    assert len(payload["quizzes"]) == 2
    assert len(payload["students"]) == 1
    assert len(payload["quiz_averages"]) == 2


def test_get_grades_summary(
    client: TestClient,
    setup_context: dict[str, object],
):
    setup_context["active_user"]["value"] = setup_context["student"]

    response = client.get("/api/v1/grades/summary")
    assert response.status_code == 200

    payload = response.json()
    assert payload["total_courses"] == 1
    assert payload["overall_average"] > 0
    assert "active_streak_days" in payload
