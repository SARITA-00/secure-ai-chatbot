
"""change embedding dimension to 384

Revision ID: 60fbd28d39d2
Revises: 99b79afb54ef
"""

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


revision = "60fbd28d39d2"
down_revision = "99b79afb54ef"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Clear old Gemini vectors before changing dimensions.
    # Document text and metadata remain intact for re-embedding.
    op.execute(
        "UPDATE document_chunks SET embedding = NULL"
    )

    op.alter_column(
        "document_chunks",
        "embedding",
        existing_type=Vector(768),
        type_=Vector(384),
        existing_nullable=True,
        postgresql_using="NULL::vector(384)",
    )


def downgrade() -> None:
    # Old embeddings cannot be restored from the new vectors.
    # Keep the column nullable and restore the old dimension.
    op.alter_column(
        "document_chunks",
        "embedding",
        existing_type=Vector(384),
        type_=Vector(768),
        existing_nullable=True,
        postgresql_using="NULL::vector(768)",
    )
