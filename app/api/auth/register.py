# app/api/auth/register.py
from fastapi import APIRouter
import random
from ...models.auth import RegisterRequest
from .email_utils import send_otp_email

router = APIRouter()

# Temporary storage (use Redis/DB in production)
pending_otps = {}

@router.post("/register")
async def register_step_one(user: RegisterRequest):
    otp = str(random.randint(100000, 999999))
    pending_otps[user.email] = {"otp": otp, "user": user}
    await send_otp_email(user.email, otp)
    return {"message": "OTP sent to email"}
