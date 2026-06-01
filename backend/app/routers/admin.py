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
from app.models.owners import Owner
from app.models.cars import Car
from app.models.defects import Defect
from app.services.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])

class RepairAdminResponse(BaseModel):
    id: int
    status: str
    description: str
    car_brand: str
    car_year: int
    car_color: str
    car_license_plate: str
    owner_name: str
    employee_name: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    parts_cost: Optional[Decimal] = None
    work_cost: Optional[Decimal] = None

    class Config:
        from_attributes = True

class CarInfo(BaseModel):
    id: int
    brand: str
    year: int
    color: str
    license_plate: str

class OwnerAdminResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    phone: str
    address: str
    passport_number: str
    cars: List[CarInfo] = []
    
    class Config:
        from_attributes = True

class CancelRepairRequest(BaseModel):
    reason: Optional[str] = None

class EmployeeAdminResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    specialization: str
    rank: int
    
    class Config:
        from_attributes = True

@router.get("/repairs", response_model=List[RepairAdminResponse])
async def get_all_repairs(current_user=Depends(get_current_user)):

    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    async with async_session_maker() as session:
        res = await session.execute(select(Repair).options(joinedload(Repair.car), joinedload(Repair.owner), joinedload(Repair.employee)))

        repairs = res.unique().scalars().all()
        
        response = []
        for repair in repairs:
            response.append(RepairAdminResponse(
                id=repair.id,
                status=repair.status,
                description=repair.description,
                car_brand=repair.car.brand,
                car_year=repair.car.year,
                car_color=repair.car.color,
                car_license_plate=repair.car.license_plate,
                owner_name=repair.owner.full_name,
                employee_name=repair.employee.full_name,
                start_date=repair.start_date,
                end_date=repair.end_date,
                parts_cost=repair.parts_cost,
                work_cost=repair.work_cost
            ))
    
    return response

@router.post("/repairs/{repair_id}/cancel")
async def cancel_repair(repair_id: int, data: Optional[CancelRepairRequest] = None, current_user=Depends(get_current_user)):

    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    async with async_session_maker() as session:
        res = await session.execute(select(Repair).where(Repair.id == repair_id))
        repair = res.scalar_one_or_none()

        if not repair:
            raise HTTPException(status_code=404, detail="Repair not found")
        
        if repair.status == RepairStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="Cannot cancel completed repair")
        
        if repair.status == RepairStatus.CANCELLED:
            raise HTTPException(status_code=400, detail="Repair already cancelled")
        
        repair.status = RepairStatus.CANCELLED

        await session.commit()

    return {
        "message": "Succesfully canceled",
        "repair_id": repair.id
    }


@router.get("/employees", response_model=List[EmployeeAdminResponse])
async def get_all_employees(current_user=Depends(get_current_user)):

    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    async with async_session_maker() as session:
        res = await session.execute(select(Employee).options(joinedload(Employee.user)))

        employees = res.unique().scalars().all()
        
        response = []
        for employee in employees:
            response.append(EmployeeAdminResponse(
                id=employee.id,
                user_id=employee.user_id,
                full_name=employee.full_name,
                specialization=employee.specialization,
                rank=employee.rank
            ))

    return response


@router.get("/owners", response_model=List[OwnerAdminResponse])
async def get_all_owners(current_user=Depends(get_current_user)):

    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    async with async_session_maker() as session:
        res = await session.execute(select(Owner).options(joinedload(Owner.cars), joinedload(Owner.user)))

        owners = res.unique().scalars().all()

        response = []
        for owner in owners:
            cars = []
            for car in owner.cars:
                cars.append(CarInfo(
                    id=car.id,
                    brand=car.brand,
                    year=car.year,
                    color=car.color,
                    license_plate=car.license_plate
                ))

            response.append(OwnerAdminResponse(
                id=owner.id,
                user_id=owner.user_id,
                full_name=owner.full_name,
                phone=owner.phone,
                address=owner.address,
                passport_number=owner.passport_number,
                cars=cars
            ))
    return response


@router.delete("/employees/{employee_id}")
async def fire_employee(
    employee_id: int,
    current_user=Depends(get_current_user)
):
    """Увольнение механика (удаление из системы)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    async with async_session_maker() as session:
        # Находим механика
        result = await session.execute(
            select(Employee).where(Employee.id == employee_id)
        )
        employee = result.scalar_one_or_none()
        
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        # Проверяем, есть ли у механика активные заявки
        result = await session.execute(
            select(Repair).where(
                Repair.employee_id == employee_id,
                Repair.status == RepairStatus.IN_PROGRESS
            )
        )
        active_repairs = result.scalars().all()
        
        if active_repairs:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot fire employee: has {len(active_repairs)} active repairs"
            )
        
        # Удаляем механика
        await session.delete(employee)
        await session.commit()
        
        return {
            "message": "Employee fired successfully",
            "employee_id": employee_id,
            "employee_name": employee.full_name
        }