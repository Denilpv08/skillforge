import os
from datetime import datetime
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Defaults to allow importing app settings during tests.
os.environ.setdefault("DB_HOST", "127.0.0.1")
os.environ.setdefault("DB_PORT", "3306")
os.environ.setdefault("DB_USER", "test")
os.environ.setdefault("DB_PASSWORD", "test")
os.environ.setdefault("DB_NAME", "test")
os.environ.setdefault("SECRET_KEY", "test-secret")

from app.core.dependencies import get_current_user, get_db
from app.db.base import Base
from app.main import app
from app.models.course import Course, CourseStatus, Lesson
from app.models.enrollment import Enrollment, LessonProgress
from app.models.organization import Organization
from app.models.quiz import Quiz, QuizAttempt
from app.models.user import User, UserRole


@pytest.fixture()
def db_session() -> Iterator[Session]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()

    org = Organization(name="Org Test", slug="org-test", is_active=True)
    session.add(org)
    session.flush()

    instructor = User(
        organization_id=org.id,
        email="instructor@test.com",
        password_hash="hash",
        full_name="Instructor One",
        role=UserRole.INSTRUCTOR,
        is_active=True,
    )
    other_instructor = User(
        organization_id=org.id,
        email="other-instructor@test.com",
        password_hash="hash",
        full_name="Instructor Two",
        role=UserRole.INSTRUCTOR,
        is_active=True,
    )
    student_a = User(
        organization_id=org.id,
        email="student-a@test.com",
        password_hash="hash",
        full_name="Student A",
        role=UserRole.STUDENT,
        is_active=True,
    )
    student_b = User(
        organization_id=org.id,
        email="student-b@test.com",
        password_hash="hash",
        full_name="Student B",
        role=UserRole.STUDENT,
        is_active=True,
    )
    session.add_all([instructor, other_instructor, student_a, student_b])
    session.flush()

    own_course = Course(
        organization_id=org.id,
        instructor_id=instructor.id,
        title="Instructor Course",
        slug="instructor-course",
        status=CourseStatus.PUBLISHED,
    )
    foreign_course = Course(
        organization_id=org.id,
        instructor_id=other_instructor.id,
        title="Other Course",
        slug="other-course",
        status=CourseStatus.PUBLISHED,
    )
    session.add_all([own_course, foreign_course])
    session.flush()

    lesson = Lesson(course_id=own_course.id, title="Lesson 1", order_index=1)
    session.add(lesson)
    session.flush()

    enrollment_a = Enrollment(
        user_id=student_a.id,
        course_id=own_course.id,
        progress_pct=60,
    )
    enrollment_b = Enrollment(
        user_id=student_b.id,
        course_id=own_course.id,
        progress_pct=100,
        completed_at=datetime.utcnow(),
    )
    enrollment_foreign = Enrollment(
        user_id=student_a.id,
        course_id=foreign_course.id,
        progress_pct=20,
    )
    session.add_all([enrollment_a, enrollment_b, enrollment_foreign])
    session.flush()

    session.add(
        LessonProgress(
            enrollment_id=enrollment_a.id,
            lesson_id=lesson.id,
            completed_at=datetime.utcnow(),
            watch_time_sec=240,
        )
    )

    own_quiz = Quiz(course_id=own_course.id, title="Quiz Own", pass_score=70, max_attempts=3)
    foreign_quiz = Quiz(
        course_id=foreign_course.id,
        title="Quiz Foreign",
        pass_score=70,
        max_attempts=3,
    )
    session.add_all([own_quiz, foreign_quiz])
    session.flush()

    session.add_all(
        [
            QuizAttempt(
                user_id=student_a.id,
                quiz_id=own_quiz.id,
                score=80,
                passed=True,
                answers_json={},
            ),
            QuizAttempt(
                user_id=student_b.id,
                quiz_id=own_quiz.id,
                score=50,
                passed=False,
                answers_json={},
            ),
            QuizAttempt(
                user_id=instructor.id,
                quiz_id=foreign_quiz.id,
                score=90,
                passed=True,
                answers_json={},
            ),
        ]
    )

    session.commit()

    def _override_get_db() -> Iterator[Session]:
        try:
            yield session
        finally:
            pass

    def _override_get_current_user() -> User:
        return instructor

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_user] = _override_get_current_user

    yield session

    app.dependency_overrides.clear()
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session: Session) -> TestClient:
    return TestClient(app)


def test_get_instructor_courses_only_own(client: TestClient):
    response = client.get("/api/v1/instructor/courses")
    assert response.status_code == 200

    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Instructor Course"


def test_get_instructor_students_paginated(client: TestClient):
    response = client.get("/api/v1/instructor/students", params={"page": 1, "per_page": 1})
    assert response.status_code == 200

    payload = response.json()
    assert payload["page"] == 1
    assert payload["per_page"] == 1
    assert payload["total"] == 2
    assert len(payload["data"]) == 1


def test_get_instructor_quizzes_paginated(client: TestClient):
    response = client.get("/api/v1/instructor/quizzes", params={"page": 1, "per_page": 5})
    assert response.status_code == 200

    payload = response.json()
    assert payload["total"] == 1
    assert len(payload["data"]) == 1
    assert payload["data"][0]["quiz_title"] == "Quiz Own"
    assert len(payload["data"][0]["score_distribution"]) == 5


def test_get_instructor_analytics(client: TestClient):
    response = client.get("/api/v1/instructor/analytics")
    assert response.status_code == 200

    payload = response.json()
    assert "retention_rate" in payload
    assert payload["retention_rate"] >= 0
    assert "enrollments_by_week" in payload
    assert "completions_by_month" in payload
