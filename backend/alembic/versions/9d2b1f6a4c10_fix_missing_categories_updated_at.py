"""fix_missing_categories_updated_at

Revision ID: 9d2b1f6a4c10
Revises: f384284cd4fb
Create Date: 2026-03-25 12:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9d2b1f6a4c10"
down_revision: Union[str, None] = "f384284cd4fb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("categories")}

    # Repair schema drift: some DBs were marked as migrated without this column.
    if "updated_at" not in columns:
        op.add_column(
            "categories",
            sa.Column(
                "updated_at",
                sa.DateTime(),
                nullable=True,
                server_default=sa.text("CURRENT_TIMESTAMP"),
            ),
        )
        op.execute("UPDATE categories SET updated_at = created_at WHERE updated_at IS NULL")
        op.alter_column(
            "categories",
            "updated_at",
            existing_type=sa.DateTime(),
            nullable=False,
            server_default=None,
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("categories")}

    if "updated_at" in columns:
        op.drop_column("categories", "updated_at")
