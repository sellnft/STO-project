from sqlalchemy.orm import relationship, Mapped, mapped_column, validates
from app.database import Base
from sqlalchemy import Integer, String, ForeignKey
import re
from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from app.models.repairs import Repair


FULL_NAME_ALLOWED_FORMAT = r"^[А-Я][а-я]+\s[А-Я][а-я]+\s[А-Я][а-я]+$"

class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, autoincrement=True, primary_key=True)

    full_name: Mapped[str] = mapped_column(String, nullable=False)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    @validates("full_name")
    def validateFullName(self, key, fullName):
        if not fullName or not fullName.strip():
            raise ValueError("ФИО не может быть пустым!")
        if not re.match(FULL_NAME_ALLOWED_FORMAT, fullName):
            raise ValueError("ФИО некорректно!")
        return fullName.strip().title()
    
    specialization: Mapped[str] = mapped_column(String, nullable=False)

    @validates("specialization")
    def validateSpecialization(self, key, specialization):
        if specialization is None or specialization == "":
            raise ValueError("Некорректная специализация")
        return specialization
    
    rank: Mapped[int] = mapped_column(Integer, nullable=False)

    repairs: Mapped[list["Repair"]] = relationship("Repair", back_populates="employee")
    user = relationship("User", back_populates="employee_profile")