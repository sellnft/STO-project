from sqlalchemy.orm import relationship, Mapped, mapped_column, validates
from app.database import Base
from sqlalchemy import Integer, String, ForeignKey
import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.cars import Car
    from app.models.repairs import Repair

FULL_NAME_ALLOWED_FORMAT = r"^[А-Я][а-я]+\s[А-Я][а-я]+\s[А-Я][а-я]+$"
PASSPORT_ALLOWED_FORMAT = r"^\d{4}\s?\d{6}$"
PHONE_ALLOWED_FORMAT = r"^(\+7|7|8)?\d{10}$"


class Owner(Base):
    __tablename__ = "owners"

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
    
    passport_number: Mapped[str] = mapped_column(String, nullable=False, unique=True)

    @validates("passport_number")
    def validatePassportNumber(self, key, passportNumber):
        if passportNumber is None:
            raise ValueError("Номер паспорта не может быть пустым!")
        if not re.match(PASSPORT_ALLOWED_FORMAT, passportNumber):
            raise ValueError("Неверный формат паспорта!")
        return passportNumber
    
    address: Mapped[str] = mapped_column(String, nullable=False)

    @validates("address")
    def validateAddress(self, key, address):
        if address is None or address == "":
            raise ValueError("Некорректный адрес")
        return address
            
    age: Mapped[int] = mapped_column(Integer, nullable=False)

    @validates("age")
    def validateAge(self, key, age):
        if age is None or (age < 18 or age >= 100):
            raise ValueError("Возраст некорректен")
        return age
    
    phone: Mapped[str] = mapped_column(String, nullable=False)

    @validates("phone")
    def validatePhone(self, key, phone):
        if phone is None or phone == "":
            raise ValueError("Телефон не может быть пустым")
        if not re.match(PHONE_ALLOWED_FORMAT, phone):
            raise ValueError("Неверный формат телефона")
        return phone
    
    cars: Mapped[list["Car"]] = relationship("Car", back_populates="owner", cascade="all, delete-orphan")
    user = relationship("User", back_populates="owner_profile")
    repairs: Mapped[list["Repair"]] = relationship(
        "Repair", 
        back_populates="owner", 
        cascade="all, delete-orphan"
    )