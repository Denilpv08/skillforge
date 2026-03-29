"""add_quiz_weight_column

Revision ID: b47f1ec91aa1
Revises: a8123d3b5f9e
Create Date: 2026-03-28 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b47f1ec91aa1"
down_revision: Union[str, None] = "a8123d3b5f9e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "quizzes" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("quizzes")}
    if "weight" not in columns:
        op.add_column(
            "quizzes",
            sa.Column("weight", sa.DECIMAL(5, 2), nullable=True, server_default="1.0"),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "quizzes" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("quizzes")}
    if "weight" in columns:
        op.drop_column("quizzes", "weight")
