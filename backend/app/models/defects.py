from sqlalchemy.orm import relationship, Mapped, mapped_column, validates
from app.database import Base
from sqlalchemy import Integer, String, Numeric, Text
from app.models.repair_defects import repair_defect_association

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.repairs import Repair


class Defect(Base):
    __tablename__ = "defects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    name: Mapped[str] = mapped_column(String, nullable=False, unique=True)

    @validates("name")
    def validate_name(self, key, name):
        if not name or not name.strip():
            raise ValueError("Название неисправности не может быть пустым!")
        return name.strip().capitalize()
    
    work_cost: Mapped[int] = mapped_column(Integer, nullable=False)

    @validates("work_cost")
    def validateWorkCost(self, key, cost):
        if cost is None or cost <= 0:
            raise ValueError("Некорректная цена")
        return cost
    
    repairs: Mapped[list["Repair"]] = relationship("Repair", secondary=repair_defect_association, back_populates="defects")