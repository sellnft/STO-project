from sqlalchemy.orm import relationship, Mapped, mapped_column, validates
from app.database import Base
from sqlalchemy import Integer, String
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.owners import Owner
    from app.models.employees import Employee

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, autoincrement=True, primary_key=True)
    username: Mapped[str] = mapped_column(String, nullable=False, unique=True)

    @validates("username")
    def validateUsername(self, key, username):
        if username is None or username == "":
            raise ValueError("Username can't be empty")
        return username
    
    password_hash: Mapped[str] = mapped_column(String, nullable=False)

    @validates("password_hash")
    def validatePasswordHash(self, key, passwordHash):
        if passwordHash is None or passwordHash == "":
            raise ValueError("Password hash can't be empty!")
        return passwordHash
    
    role: Mapped[str] = mapped_column(String, nullable=False)

    @validates("role")
    def validateRole(self, key, role):
        if role is None or role not in {"admin", "owner", "mechanic"}:
            raise ValueError("Incorrect role!")
        return role
    
    owner_profile: Mapped["Owner | None"] = relationship("Owner", back_populates="user", uselist=False)
    employee_profile: Mapped["Employee | None"] = relationship("Employee", back_populates="user", uselist=False)