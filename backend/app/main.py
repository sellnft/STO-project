from fastapi import FastAPI
from app.routers.cars import router as cars_router

app = FastAPI()
app.include_router(cars_router)