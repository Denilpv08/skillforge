import os
from collections.abc import Iterator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault("DB_HOST", "127.0.0.1")
os.environ.setdefault("DB_PORT", "3306")
os.environ.setdefault("DB_USER", "test")
os.environ.setdefault("DB_PASSWORD", "test")
os.environ.setdefault("DB_NAME", "test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing-purposes-only")

from app.core.dependencies import get_db
from app.db.base import Base
from app.models.course import Course, CourseStatus, Category, Lesson
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.core.security import hash_password


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

    org = Organization(name="Course Test Org", slug="course-test-org", is_active=True)
    session.add(org)
    session.flush()

    instructor = User(
        organization_id=org.id,
        email="course-instructor@test.com",
        password_hash=hash_password("password123"),
        full_name="Course Instructor",
        role=UserRole.INSTRUCTOR,
        is_active=True,
    )
    admin = User(
        organization_id=org.id,
        email="course-admin@test.com",
        password_hash=hash_password("password123"),
        full_name="Course Admin",
        role=UserRole.ADMIN,
        is_active=True,
    )
    session.add_all([instructor, admin])
    session.flush()

    category = Category(
        organization_id=org.id,
        name="Programming",
        slug="programming",
        description="Programming courses",
    )
    session.add(category)
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=engine)


class TestCourseService:
    def test_create_course_with_all_fields(self, db_session: Session):
        from app.models.user import User
        instructor = db_session.query(User).filter_by(role=UserRole.INSTRUCTOR).first()
        category = db_session.query(Category).first()

        course = Course(
            organization_id=instructor.organization_id,
            instructor_id=instructor.id,
            title="Complete Python Course",
            slug="complete-python-course",
            description="Learn Python from scratch",
            category_id=category.id,
            status=CourseStatus.PUBLISHED,
            duration_hours=40.5,
        )
        db_session.add(course)
        db_session.commit()

        assert course.id is not None
        assert course.title == "Complete Python Course"
        assert course.status == CourseStatus.PUBLISHED
        assert course.duration_hours == 40.5
        assert course.category_id == category.id

    def test_course_defaults_to_draft(self, db_session: Session):
        from app.models.user import User
        instructor = db_session.query(User).filter_by(role=UserRole.INSTRUCTOR).first()

        course = Course(
            organization_id=instructor.organization_id,
            instructor_id=instructor.id,
            title="Draft Course",
            slug="draft-course",
        )
        db_session.add(course)
        db_session.commit()

        assert course.status == CourseStatus.DRAFT

    def test_course_instructor_relationship(self, db_session: Session):
        from app.models.user import User
        instructor = db_session.query(User).filter_by(role=UserRole.INSTRUCTOR).first()

        course = Course(
            organization_id=instructor.organization_id,
            instructor_id=instructor.id,
            title="Instructor Course",
            slug="instructor-course",
        )
        db_session.add(course)
        db_session.commit()

        assert course.instructor_id == instructor.id
        assert course.instructor.id == instructor.id
        assert course.instructor.full_name == "Course Instructor"

    def test_course_category_relationship(self, db_session: Session):
        from app.models.user import User
        instructor = db_session.query(User).filter_by(role=UserRole.INSTRUCTOR).first()
        category = db_session.query(Category).first()

        course = Course(
            organization_id=instructor.organization_id,
            instructor_id=instructor.id,
            title="Categorized Course",
            slug="categorized-course",
            category_id=category.id,
        )
        db_session.add(course)
        db_session.commit()

        assert course.category is not None
        assert course.category.name == "Programming"


class TestLessonService:
    def test_create_lesson(self, db_session: Session):
        from app.models.user import User
        instructor = db_session.query(User).filter_by(role=UserRole.INSTRUCTOR).first()
        category = db_session.query(Category).first()

        course = Course(
            organization_id=instructor.organization_id,
            instructor_id=instructor.id,
            title="Course with Lessons",
            slug="course-with-lessons",
            category_id=category.id,
        )
        db_session.add(course)
        db_session.flush()

        lesson1 = Lesson(
            course_id=course.id,
            title="Introduction",
            content="Welcome to the course",
            order_index=0,
            duration_min=15,
        )
        lesson2 = Lesson(
            course_id=course.id,
            title="Getting Started",
            content="Let's begin",
            order_index=1,
            duration_min=30,
            is_free=True,
        )
        db_session.add_all([lesson1, lesson2])
        db_session.commit()

        assert lesson1.id is not None
        assert lesson2.id is not None
        assert lesson1.is_free is False
        assert lesson2.is_free is True

    def test_lesson_ordering(self, db_session: Session):
        from app.models.user import User
        instructor = db_session.query(User).filter_by(role=UserRole.INSTRUCTOR).first()

        course = Course(
            organization_id=instructor.organization_id,
            instructor_id=instructor.id,
            title="Ordered Lessons Course",
            slug="ordered-lessons-course",
        )
        db_session.add(course)
        db_session.flush()

        for i in range(5):
            lesson = Lesson(
                course_id=course.id,
                title=f"Lesson {i + 1}",
                order_index=i,
            )
            db_session.add(lesson)
        db_session.commit()

        lessons = db_session.query(Lesson).filter_by(course_id=course.id).order_by(Lesson.order_index).all()
        
        assert len(lessons) == 5
        for i, lesson in enumerate(lessons):
            assert lesson.order_index == i


class TestCategoryService:
    def test_create_category(self, db_session: Session):
        category = Category(
            organization_id=db_session.query(Organization).first().id,
            name="Web Development",
            slug="web-development",
            description="Web dev courses",
        )
        db_session.add(category)
        db_session.commit()

        assert category.id is not None
        assert category.name == "Web Development"

    def test_category_courses_relationship(self, db_session: Session):
        from app.models.user import User
        instructor = db_session.query(User).filter_by(role=UserRole.INSTRUCTOR).first()
        category = db_session.query(Category).first()

        course = Course(
            organization_id=instructor.organization_id,
            instructor_id=instructor.id,
            title="Web Course",
            slug="web-course",
            category_id=category.id,
        )
        db_session.add(course)
        db_session.commit()

        assert len(category.courses) >= 1
        assert course in category.courses


class TestCourseStatus:
    def test_publish_draft_course(self, db_session: Session):
        from app.models.user import User
        instructor = db_session.query(User).filter_by(role=UserRole.INSTRUCTOR).first()

        course = Course(
            organization_id=instructor.organization_id,
            instructor_id=instructor.id,
            title="To Be Published",
            slug="to-be-published",
            status=CourseStatus.DRAFT,
        )
        db_session.add(course)
        db_session.commit()

        course.status = CourseStatus.PUBLISHED
        db_session.commit()
        db_session.refresh(course)

        assert course.status == CourseStatus.PUBLISHED

    def test_archive_published_course(self, db_session: Session):
        from app.models.user import User
        instructor = db_session.query(User).filter_by(role=UserRole.INSTRUCTOR).first()

        course = Course(
            organization_id=instructor.organization_id,
            instructor_id=instructor.id,
            title="To Be Archived",
            slug="to-be-archived",
            status=CourseStatus.PUBLISHED,
        )
        db_session.add(course)
        db_session.commit()

        course.status = CourseStatus.ARCHIVED
        db_session.commit()
        db_session.refresh(course)

        assert course.status == CourseStatus.ARCHIVED
