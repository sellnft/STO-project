from sqlalchemy.orm import relationship, Mapped, mapped_column, validates
from app.database import Base
from sqlalchemy import Integer, String, ForeignKey
import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.repairs import Repair


# LICENSE_PLATE_ALLOWED_LETTERS = "АВЕКМНОРСТУХ"
# LICENSE_PLATE_FORMAT = rf"^[0-9]{{1}}[{LICENSE_PLATE_ALLOWED_LETTERS}]{{3}}[0-9]{{2}}[0-9]{{2,3}}$"

class Car(Base):
    __tablename__ = "cars"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    brand: Mapped[str] = mapped_column(String, nullable=False)

    @validates("brand")
    def validateBrand(self, key, brand):
        if not brand:
            raise ValueError("марка не может быть пустой!")
        return brand
    
    color: Mapped[str] = mapped_column(String, nullable=False)

    @validates("color")
    def validateColor(self, key, color):
        if not color:
            raise ValueError("Цвет не может быть пустым!")
        return color
    
    year: Mapped[int] = mapped_column(Integer, nullable=False)

    @validates("year")
    def validateYear(self, key, year):
        if year < 1950 or year > 2026:
            raise ValueError("Incorrect year")
        return year
    
    license_plate: Mapped[str] = mapped_column(String, nullable=False, unique=True)

    '''@validates("license_plate")
    def validateLicensePlate(self, key, licensePlate):
        if not licensePlate:
            raise ValueError("Госномер не может быть пустым!")
        if not re.match(LICENSE_PLATE_FORMAT, licensePlate):
            raise ValueError("Неверный формат госномера!")
        letters = licensePlate[1:4]
        for letter in letters:
            if letter not in LICENSE_PLATE_ALLOWED_LETTERS:
                raise ValueError("Используются недопустимые символы!")
        return licensePlate'''
    
    owner_id: Mapped[int] = mapped_column(Integer, ForeignKey("owners.id", ondelete="CASCADE"), nullable=False)

    owner = relationship("Owner", back_populates="cars")
    repairs: Mapped[list["Repair"]] = relationship("Repair", back_populates="car")



