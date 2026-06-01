from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Form, Depends, status

from app.database import async_session_maker
from app.models.repairs import Repair
from app.services.auth import get_current_user
from app.models.owners import Owner
from app.models.cars import Car
from app.models.defects import Defect
from app.models.repair_defects import repair_defect_association

from sqlalchemy.orm import joinedload

from enum import Enum
from typing import Optional, List
from datetime import date
from decimal import Decimal


from sqlalchemy import select

class RepairCreate(BaseModel):
    brand: str = Field(...)
    color: str = Field(...)
    year: int = Field(...)
    license_plate: str = Field(...)
    description: str = Field(...)
    defect_ids: Optional[List[int]] = Field(default=[])
    

class RepairStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class RepairResponse(BaseModel):
    id: int
    status: RepairStatus
    description: str

    car_brand: str
    car_license_plate: str

    employee_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    work_cost: Optional[Decimal] = None
    parts_cost: Optional[Decimal] = None

    class Config:
        from_attributes = True



router = APIRouter(prefix="/owner", tags=["Owner"])

@router.get("/defects")
async def get_defects():
    async with async_session_maker() as session:
        result = await session.execute(select(Defect).order_by(Defect.name))
        defects = result.scalars().all()
        return defects

@router.get("/applications")
async def get_owner_applications(current_user=Depends(get_current_user)):
    user_id = current_user["user_id"]

    async with async_session_maker() as session:
        result = await session.execute(select(Owner).where(Owner.user_id == user_id))
        owner = result.scalar_one_or_none()

        if not owner:
            raise HTTPException(status_code=404, detail="Owner not found")
        
        result = await session.execute(select(Repair).where(Repair.owner_id == owner.id).options(joinedload(Repair.car), joinedload(Repair.employee)))
        
        applications = result.unique().scalars().all()

        response = []
        for repair in applications:
            response.append(RepairResponse(
                id=repair.id,
                status=repair.status,
                description=repair.description,
                car_brand=repair.car.brand,
                car_license_plate=repair.car.license_plate,
                employee_name=repair.employee.full_name if repair.employee else None,
                start_date=repair.start_date,
                end_date=repair.end_date,
                work_cost=repair.work_cost,
                parts_cost=repair.parts_cost
            ))

        return response
        

@router.post("/new_application", status_code=status.HTTP_201_CREATED)
async def create_application(application_data: RepairCreate, current_user: dict = Depends(get_current_user)):
    
    user_id = current_user["user_id"]

    async with async_session_maker() as session:
        result = await session.execute(select(Owner).where(Owner.user_id == user_id))
        owner = result.scalar_one_or_none()

        if not owner:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner not found")
            
        
        result = await session.execute(select(Car).where(Car.license_plate == application_data.license_plate, Car.owner_id == owner.id))
        car = result.scalar_one_or_none()

        if not car:
            car = Car(
                brand=application_data.brand,
                color=application_data.color,
                year=application_data.year,
                license_plate=application_data.license_plate,
                owner_id=owner.id
            )
            session.add(car)
            await session.flush()

        repair = Repair(
            car_id=car.id,
            owner_id=owner.id,
            description=application_data.description,
            status=RepairStatus.PENDING,
        )

        session.add(repair)
        await session.flush()

        if application_data.defect_ids:
            for defect_id in application_data.defect_ids:
                result = await session.execute(select(Defect).where(Defect.id == defect_id))
                defect = result.scalar_one_or_none()

                if not defect:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Defect {defect_id} not found")
                

                await session.execute(repair_defect_association.insert().values(repair_id=repair.id, defect_id=defect_id))

        await session.commit()

        return {
            "message": "Application created",
            "repair_id": repair.id,
            "car_id": car.id,
            "repair_status": repair.status
        }
    