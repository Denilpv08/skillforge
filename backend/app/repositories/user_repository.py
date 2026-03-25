from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.user import User
from app.models.organization import Organization

class UserRepository:
    """
    Responsabilidad única: operaciones de DB sobre usuarios.
    No contiene lógica de negocio — solo queries.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: str) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email_and_org(
        self, email: str, organization_id: str
    ) -> User | None:
        stmt = select(User).where(
            User.email == email,
            User.organization_id == organization_id,
            User.is_active == True,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_org(self, organization_id: str) -> list[User]:
        stmt = select(User).where(User.organization_id == organization_id)
        return list(self.db.execute(stmt).scalars().all())

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: User) -> User:
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user: User) -> None:
        self.db.delete(user)
        self.db.commit()