import os
from collections.abc import Iterator
from unittest.mock import patch, MagicMock
from datetime import datetime

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
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing-purposes-only")

from app.core.dependencies import get_db, get_current_user
from app.db.base import Base
from app.main import app
from app.models.course import Course, CourseStatus
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.core.security import hash_password, verify_password, create_access_token, decode_token


@pytest.fixture()
def db_session() -> Iterator[Session]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()

    org = Organization(name="Test Org", slug="test-org", is_active=True)
    session.add(org)
    session.flush()

    instructor = User(
        organization_id=org.id,
        email="instructor@test.com",
        password_hash=hash_password("password123"),
        full_name="Test Instructor",
        role=UserRole.INSTRUCTOR,
        is_active=True,
    )
    student = User(
        organization_id=org.id,
        email="student@test.com",
        password_hash=hash_password("password123"),
        full_name="Test Student",
        role=UserRole.STUDENT,
        is_active=True,
    )
    session.add_all([instructor, student])
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=engine)


class TestPasswordSecurity:
    def test_hash_password_creates_hash(self):
        password = "testpassword123"
        hashed = hash_password(password)
        assert hashed != password
        assert len(hashed) > 0

    def test_verify_password_correct(self):
        password = "testpassword123"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        password = "testpassword123"
        hashed = hash_password(password)
        assert verify_password("wrongpassword", hashed) is False

    def test_password_hash_is_unique(self):
        hash1 = hash_password("password")
        hash2 = hash_password("password")
        assert hash1 != hash2


class TestJWTTokens:
    def test_create_and_decode_access_token(self):
        token_data = {
            "sub": "user123",
            "email": "test@test.com",
            "role": "STUDENT",
        }
        token = create_access_token(token_data)
        decoded = decode_token(token)

        assert decoded["sub"] == "user123"
        assert decoded["email"] == "test@test.com"
        assert decoded["role"] == "STUDENT"
        assert decoded["type"] == "access"
        assert "exp" in decoded

    def test_token_contains_expiration(self):
        token_data = {"sub": "user123"}
        token = create_access_token(token_data)
        decoded = decode_token(token)

        assert "exp" in decoded
        exp = datetime.fromtimestamp(decoded["exp"])
        now = datetime.utcnow()
        assert exp > now


class TestCourseModel:
    def test_create_course(self, db_session: Session):
        from app.models.user import User
        instructor = db_session.query(User).filter_by(role=UserRole.INSTRUCTOR).first()

        course = Course(
            organization_id=instructor.organization_id,
            instructor_id=instructor.id,
            title="Test Course",
            slug="test-course",
            status=CourseStatus.DRAFT,
        )
        db_session.add(course)
        db_session.commit()

        assert course.id is not None
        assert course.status == CourseStatus.DRAFT

    def test_course_status_transitions(self, db_session: Session):
        from app.models.user import User
        instructor = db_session.query(User).filter_by(role=UserRole.INSTRUCTOR).first()

        course = Course(
            organization_id=instructor.organization_id,
            instructor_id=instructor.id,
            title="Status Test Course",
            slug="status-test-course",
            status=CourseStatus.DRAFT,
        )
        db_session.add(course)
        db_session.commit()

        course.status = CourseStatus.PUBLISHED
        db_session.commit()
        db_session.refresh(course)

        assert course.status == CourseStatus.PUBLISHED

        course.status = CourseStatus.ARCHIVED
        db_session.commit()
        db_session.refresh(course)

        assert course.status == CourseStatus.ARCHIVED


class TestUserModel:
    def test_user_roles(self, db_session: Session):
        student = db_session.query(User).filter_by(role=UserRole.STUDENT).first()
        instructor = db_session.query(User).filter_by(role=UserRole.INSTRUCTOR).first()

        assert student.role == UserRole.STUDENT
        assert instructor.role == UserRole.INSTRUCTOR
        assert student.is_active is True
        assert instructor.is_active is True

    def test_user_organization_relationship(self, db_session: Session):
        from app.models.user import User
        instructor = db_session.query(User).filter_by(role=UserRole.INSTRUCTOR).first()

        assert instructor.organization_id is not None
        org = instructor.organization
        assert org is not None
        assert org.slug == "test-org"


class TestOrganizationModel:
    def test_organization_creation(self, db_session: Session):
        new_org = Organization(
            name="New Test Org",
            slug="new-test-org",
            is_active=True,
        )
        db_session.add(new_org)
        db_session.commit()

        assert new_org.id is not None
        assert new_org.name == "New Test Org"
        assert new_org.is_active is True
