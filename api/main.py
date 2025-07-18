# ✅ FILE: api/main.py

from fastapi import FastAPI
from auth.routes import router as auth_router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Login API",
    description="FastAPI login system using DynamoDB",
    version="1.0"
)

app.include_router(auth_router, prefix="/auth")
