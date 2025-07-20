# routes/register.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import random
from .email_utils import send_otp_email

router = APIRouter()

# temporary storage; in production use Redis or DB with TTL
pending_otps = {}

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    nickname: str

@router.post("/register")
async def register_step_one(user: RegisterRequest):
    otp = str(random.randint(100000, 999999))
    pending_otps[user.email] = {"otp": otp, "user": user}
    await send_otp_email(user.email, otp)
    return {"message": "OTP sent to email"}
