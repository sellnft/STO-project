from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy import select, update
from sqlalchemy.orm import joinedload
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from decimal import Decimal

from app.database import async_session_maker
from app.models.repairs import Repair, RepairStatus
from app.models.employees import Employee
from app.models.cars import Car
from app.models.defects import Defect
from app.services.auth import get_current_user

router = APIRouter(prefix="/mechanic", tags=["Mechanic"])

class RepairForMechanicResponse(BaseModel):
    id: int
    status: str
    description: str
    car_brand: str
    car_year: int
    car_license_plate: str
    defects: List[str] = []

    class Config:
        from_attributes = True

class CompleteRepairRequest(BaseModel):
    work_cost: Decimal
    parts_cost: Decimal


@router.get("/available-applications", response_model=List[RepairForMechanicResponse])
async def get_available_applications(current_user=Depends(get_current_user)):
    if current_user["role"] != "mechanic":
        raise HTTPException(status_code=403, detail="Access denied")
    
    async with async_session_maker() as session:
        result = await session.execute(select(Repair).where(Repair.status == RepairStatus.PENDING).options(joinedload(Repair.car), joinedload(Repair.defects)))
        
        repairs = result.unique().scalars().all()

        response = []
        for repair in repairs:
            response.append(RepairForMechanicResponse(
                id=repair.id,
                status=repair.status,
                description=repair.description,
                car_brand=repair.car.brand,
                car_year=repair.car.year,
                car_license_plate=repair.car.license_plate,
                defects=[d.name for d in repair.defects],
            ))

    return response

@router.get("/my-applications")
async def get_my_applications(current_user=Depends(get_current_user)):
    user_id = current_user["user_id"]
    async with async_session_maker() as session:
        result = await session.execute(select(Employee).where(Employee.user_id == user_id))
        employee = result.scalar_one_or_none()

        if not employee:
            return []
        
        res = await session.execute(select(Repair).where(Repair.employee_id == employee.id).options(joinedload(Repair.car), joinedload(Repair.defects)))

        repairs = res.unique().scalars().all()

        response = []

        for repair in repairs:
            response.append(RepairForMechanicResponse(
                id=repair.id,
                status=repair.status,
                description=repair.description,
                car_brand=repair.car.brand,
                car_year=repair.car.year,
                car_license_plate=repair.car.license_plate,
                defects=[defect.name for defect in repair.defects]
            ))

    return response

@router.post("/take-application/{repair_id}")
async def take_application(repair_id: int, current_user=Depends(get_current_user)):
    user_id = current_user["user_id"]
    
    async with async_session_maker() as session:
        result = await session.execute(select(Employee).where(Employee.user_id == user_id))
        employee = result.scalar_one_or_none()

        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        

        res = await session.execute(select(Repair).where(Repair.id == repair_id))

        repair = res.scalar_one_or_none()

        if not repair:
            raise HTTPException(status_code=404, detail="Not found")
        
        if repair.status != RepairStatus.PENDING:
            raise HTTPException(status_code=400, detail="Already taken or completed")
        
        repair.employee_id = employee.id
        repair.status = RepairStatus.IN_PROGRESS
        repair.start_date = datetime.now()

        await session.commit()

        return {
            "message": "Application taken successfully",
            "repair_id": repair.id
        }
    

@router.post("/end-application/{repair_id}")
async def end_application(repair_id: int, data: CompleteRepairRequest, current_user=Depends(get_current_user)):
    user_id = current_user["user_id"]

    async with async_session_maker() as session:
        res = await session.execute(select(Employee).where(Employee.user_id == user_id))
        employee = res.scalar_one_or_none()

        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        res = await session.execute(select(Repair).where(Repair.id == repair_id))

        repair = res.scalar_one_or_none()

        if not repair:
            raise HTTPException(status_code=404, detail="Repair not found")
        
        repair.end_date = datetime.now()
        repair.status = RepairStatus.COMPLETED
        repair.parts_cost = data.parts_cost
        repair.work_cost = data.work_cost
    
        await session.commit()
    
    return {
        "message": "Successfuly ended application",
        "repair_id": repair.id
    }