"""fix_missing_audit_columns

Revision ID: c31a8b7d4e21
Revises: 9d2b1f6a4c10
Create Date: 2026-03-25 13:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c31a8b7d4e21"
down_revision: Union[str, None] = "9d2b1f6a4c10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLES_WITH_AUDIT_COLUMNS = [
    "organizations",
    "users",
    "categories",
    "courses",
    "lessons",
    "enrollments",
    "lesson_progress",
    "learning_paths",
    "learning_path_courses",
    "quizzes",
    "questions",
    "answer_options",
    "quiz_attempts",
]


def _add_missing_column(table_name: str, column_name: str) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if table_name not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns(table_name)}
    if column_name in columns:
        return

    op.add_column(
        table_name,
        sa.Column(
            column_name,
            sa.DateTime(),
            nullable=True,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.execute(
        sa.text(
            f"UPDATE {table_name} "
            f"SET {column_name} = CURRENT_TIMESTAMP "
            f"WHERE {column_name} IS NULL"
        )
    )
    op.alter_column(
        table_name,
        column_name,
        existing_type=sa.DateTime(),
        nullable=False,
        server_default=None,
    )


def upgrade() -> None:
    for table_name in TABLES_WITH_AUDIT_COLUMNS:
        _add_missing_column(table_name, "created_at")
        _add_missing_column(table_name, "updated_at")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    for table_name in TABLES_WITH_AUDIT_COLUMNS:
        if table_name not in inspector.get_table_names():
            continue

        columns = {column["name"] for column in inspector.get_columns(table_name)}
        if "updated_at" in columns:
            op.drop_column(table_name, "updated_at")
        if "created_at" in columns:
            op.drop_column(table_name, "created_at")
