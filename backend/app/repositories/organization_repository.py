from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.organization import Organization

class OrganizationRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, org_id: str) -> Organization | None:
        return self.db.get(Organization, org_id)

    def get_by_slug(self, slug: str) -> Organization | None:
        stmt = select(Organization).where(
            Organization.slug == slug,
            Organization.is_active == True,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def create(self, org: Organization) -> Organization:
        self.db.add(org)
        self.db.commit()
        self.db.refresh(org)
        return org