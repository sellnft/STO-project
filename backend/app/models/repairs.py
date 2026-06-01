from sqlalchemy.orm import relationship, Mapped, mapped_column, validates
from sqlalchemy import Integer, ForeignKey, Date, Numeric, String, Text, Enum, Index, text
from app.database import Base
from app.models.repair_defects import repair_defect_association    
from typing import TYPE_CHECKING, Optional
from datetime import date
from decimal import Decimal
import enum

if TYPE_CHECKING:
    from app.models.defects import Defect
    from app.models.employees import Employee
    from app.models.owners import Owner
    from app.models.cars import Car


class RepairStatus(str, enum.Enum):
    PENDING = "pending"         
    IN_PROGRESS = "in_progress"  
    COMPLETED = "completed"      
    CANCELLED = "cancelled"     


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
    owner_id: Mapped[int] = mapped_column(Integer, ForeignKey("owners.id", ondelete="CASCADE"), nullable=False)
    
    description: Mapped[str] = mapped_column(Text, nullable=False)
    
    employee_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    work_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    parts_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    
    status: Mapped[RepairStatus] = mapped_column(Enum(RepairStatus), default=RepairStatus.PENDING, nullable=False)
    
    car = relationship("Car", back_populates="repairs")
    owner = relationship("Owner", back_populates="repairs")
    employee = relationship("Employee", back_populates="repairs")
    
    defects: Mapped[list["Defect"]] = relationship(
        "Defect",
        secondary=repair_defect_association,
        back_populates="repairs",
        lazy="selectin"
    )
    
    @validates("work_cost", "parts_cost")
    def validate_costs(self, key, value):
        if value is not None and value < 0:
            raise ValueError(f"{key} не может быть отрицательной!")
        return value
