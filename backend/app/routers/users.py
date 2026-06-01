from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Form, status
from passlib.context import CryptContext
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select

from app.services.auth import create_access_token
from app.database import async_session_maker
from app.models.users import User
from app.models.owners import Owner
from app.models.employees import Employee

router = APIRouter(prefix="/register", tags=["Registration"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserResponse(BaseModel):
    id: int
    username: str
    role: str

class LoginResponse(BaseModel):
    status_code: int
    message: str

#class UserLogin(BaseModel):
#    username: str
#    password: str

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)

@router.post("", response_model=UserResponse)
async def register_basic(username: str = Form(...), password: str = Form(...), role: str = Form(...)):
    async with async_session_maker() as session:
        new_user = User(username=username, password_hash=hash_password(password), role=role)
        try:
            session.add(new_user)
            await session.commit()
            await session.refresh(new_user)
        except IntegrityError:
            await session.rollback()
            raise HTTPException(status_code=400, detail="Username already exists")
    
    return UserResponse(id=new_user.id, username=new_user.username, role=new_user.role)

@router.post("/owners")
async def register_owner(user_id: int, full_name: str = Form(...), address: str = Form(...), age: int = Form(...), passport_number: str = Form(...), phone: str = Form(...)):
    async with async_session_maker() as session:
        user_db = await session.scalar(select(User).where(User.id == user_id))

        if user_db is None:
            raise HTTPException(status_code=404, detail="User not found")

        if user_db.role == "owner":
            owner_db = await session.scalar(select(Owner).where(Owner.user_id == user_id))

            if owner_db:
                raise HTTPException(status_code=409, detail="Owner already exists")
            
            new_owner = Owner(full_name=full_name, address=address, age=age, passport_number=passport_number, phone=phone, user_id=user_id)

            try:
                session.add(new_owner)
                await session.commit()
                await session.refresh(new_owner)
            except IntegrityError:
                await session.rollback()
                raise HTTPException(status_code=409, detail="Owner already exists")
        else:
            raise HTTPException(status_code=409, detail="User role isn't owner")
    return {"message": "Success"}

@router.post("/employees")
async def register_mechanic(user_id: int, full_name: str = Form(...), specialization: str = Form(...), rank: int = Form(...)):
    async with async_session_maker() as session:
        user_db = await session.scalar(select(User).where(User.id == user_id))

        if user_db is None:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user_db.role == "mechanic":
            mechanic_db = await session.scalar(select(Employee).where(Employee.user_id == user_id))

            if mechanic_db:
                raise HTTPException(status_code=409, detail="Mechanic already exists")
            
            new_mechanic = Employee(user_id=user_id, full_name=full_name, specialization=specialization, rank=rank)

            try:
                session.add(new_mechanic)
                await session.commit()
                await session.refresh(new_mechanic)
            except IntegrityError:
                await session.rollback()
                return HTTPException(status_code=409, detail="Mechanic already exist")
        else:
            raise HTTPException(status_code=409, detail="User role isn't mechanic")
    return {"message": "Success"}
        


@router.post("/login")
async def login_user(username: str = Form(...), password: str = Form()):
    async with async_session_maker() as session:
        user_db = await session.execute(select(User).where(User.username == username))
        user_db = user_db.scalar_one_or_none()

        if not user_db:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        is_password_correct = verify_password(password, user_db.password_hash)

        if not is_password_correct:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")
        access_token = create_access_token({
            "sub": str(user_db.id),
            "role": user_db.role
        })
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
        