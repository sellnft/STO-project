from sqlalchemy import Table, Column, Integer, ForeignKey
from app.database import Base

repair_defect_association = Table(
    "repair_defects",
    Base.metadata,
    Column("repair_id", Integer, ForeignKey("repairs.id", ondelete="CASCADE"), primary_key=True),
    Column("defect_id", Integer, ForeignKey("defects.id", ondelete="CASCADE"), primary_key=True)
)

