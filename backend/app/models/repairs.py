from sqlalchemy.orm import relationship, Mapped, mapped_column, validates
from sqlalchemy import Integer, ForeignKey, Date, Numeric, Index, text
from app.database import Base
from app.models.repair_defects import repair_defect_association    
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.defects import Defect


from decimal import Decimal
from datetime import date



class Repair(Base):
    __tablename__ = "repairs"

    __table_args__ = (
    Index(
        "uq_repairs_active_per_car",
        "car_id",
        unique=True,
        postgresql_where=text("end_date IS NULL"),
    ),
)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    car_id: Mapped[int] = mapped_column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)

    start_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    end_date: Mapped[date] = mapped_column(Date, nullable=True)

    work_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    parts_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    
    @validates("work_cost", "parts_cost")
    def validate_costs(self, key, value):
        if value < 0:
            raise ValueError(f"{key} не может быть отрицательной!")
        return value

    car = relationship("Car", back_populates="repairs")
    employee = relationship("Employee", back_populates="repairs")

    defects: Mapped[list["Defect"]] = relationship(
        "Defect",
        secondary=repair_defect_association,
        back_populates="repairs",
        cascade="all, delete"
    )