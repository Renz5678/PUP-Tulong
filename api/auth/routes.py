from fastapi import APIRouter, HTTPException, Request, Form
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import EmailStr
import random
import uuid

from .models import RegisterRequest, LoginRequest
from .utils import hash_password, verify_password, create_jwt
from .db import users_table
from .email_utils import send_otp_email  # You must create this file

router = APIRouter()

# Temporary in-memory OTP store (replace with Redis or DynamoDB TTL in production)
pending_otps = {}


@router.post("/register")
async def register_user(data: RegisterRequest):
    existing_user = users_table.get_item(Key={"email": data.email}).get("Item")
    if existing_user:
        return JSONResponse(status_code=400, content={"detail": "Email already registered"})

    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))

    # Store OTP and user info temporarily
    pending_otps[data.email] = {"otp": otp, "user": data}

    # Send OTP to email
    await send_otp_email(data.email, otp)

    return {"message": "OTP sent to email"}


@router.post("/verify-otp")
def verify_otp(email: EmailStr = Form(...), otp: str = Form(...)):
    if email not in pending_otps:
        raise HTTPException(status_code=400, detail="No OTP pending for this email")

    if pending_otps[email]["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    user = pending_otps[email]["user"]

    # Create user in database
    users_table.put_item(Item={
        "email": user.email,
        "password": hash_password(user.password),
        "nickname": user.nickname
    })

    # Create JWT token
    token = create_jwt(user.email, user.nickname)

    # Clear pending OTP
    del pending_otps[email]

    # Return cookie with token
    response = JSONResponse(content={"message": "User registered and verified"})
    response.set_cookie(
        key="token",
        value=token,
        httponly=False,
        secure=False,
        samesite="Lax"
    )
    return response


@router.post("/login")
def login_user(data: LoginRequest):
    user = users_table.get_item(Key={"email": data.email}).get("Item")
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_jwt(user["email"], user["nickname"])

    response = JSONResponse(content={"message": "Login successful"})
    response.set_cookie(
        key="token",
        value=token,
        httponly=False,
        secure=False,
        samesite="Lax"
    )
    return response


@router.get("/logout")
def logout_user():
    response = RedirectResponse(url="/")
    response.delete_cookie("token")
    return response
