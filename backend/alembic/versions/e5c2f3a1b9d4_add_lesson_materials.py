"""add_lesson_materials

Revision ID: e5c2f3a1b9d4
Revises: 9d2b1f6a4c10
Create Date: 2026-03-29 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5c2f3a1b9d4'
down_revision: Union[str, None] = '9d2b1f6a4c10'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create lesson_materials table
    op.create_table(
        'lesson_materials',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('lesson_id', sa.String(length=36), nullable=False),
        sa.Column('type', sa.Enum('VIDEO', 'DOCUMENT', 'PRESENTATION', 'CODE', 'LINK', 'FILE', name='material_type_enum'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('url', sa.String(length=500), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('order_index', sa.SmallInteger(), nullable=False, server_default='0'),
        sa.Column('file_size_kb', sa.Integer(), nullable=True),
        sa.Column('duration_sec', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_lesson_materials_lesson_id', 'lesson_id'),
        sa.Index('ix_lesson_materials_order_index', 'lesson_id', 'order_index')
    )


def downgrade() -> None:
    op.drop_table('lesson_materials')
