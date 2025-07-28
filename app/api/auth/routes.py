from urllib import request
from fastapi import APIRouter, HTTPException, Request, Form
from fastapi.responses import JSONResponse, RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import EmailStr
import random
import uuid

from ...models.auth import RegisterRequest, LoginRequest
from .utils import hash_password, verify_password, create_jwt
from .db import users_table
from .email_utils import send_otp_email

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

# Temporary in-memory OTP store (replace with Redis/DynamoDB in prod)
pending_otps = {}


@router.post("/register")
async def register_user(request: Request, data: RegisterRequest):
    existing_user = users_table.get_item(Key={"email": data.email}).get("Item")
    if existing_user:
        return JSONResponse(status_code=400, content={"detail": "Email already registered"})

    otp = str(random.randint(100000, 999999))
    pending_otps[data.email] = {"otp": otp, "user": data}
    await send_otp_email(data.email, otp)

    # ✅ redirect directly to /verify
    url = str(request.url_for("verify_otp_page")) + f"?email={data.email}"
    return RedirectResponse(url=url, status_code=303)

@router.get("/verify", response_class=HTMLResponse, name="verify_otp_page")
async def show_verify_page(request: Request, email: str):
    return templates.TemplateResponse("verify.html", {"request": request, "email": email})

@router.post("/verify-otp")
def verify_otp(email: EmailStr = Form(...), otp: str = Form(...)):
    if email not in pending_otps:
        raise HTTPException(status_code=400, detail="No OTP pending for this email")

    if pending_otps[email]["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    user = pending_otps[email]["user"]
    users_table.put_item(Item={
        "email": user.email,
        "password": hash_password(user.password),
        "nickname": user.nickname
    })

    token = create_jwt(user.email, user.nickname)
    del pending_otps[email]

    response = JSONResponse(content={"message": "User registered and verified"})
    response.set_cookie(key="token", value=token, httponly=False, secure=False, samesite="Lax")
    return response


@router.post("/login")
def login_user(data: LoginRequest):
    user = users_table.get_item(Key={"email": data.email}).get("Item")
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_jwt(user["email"], user["nickname"])
    response = JSONResponse(content={"message": "Login successful"})
    response.set_cookie(key="token", value=token, httponly=False, secure=False, samesite="Lax")
    return response


@router.get("/logout")
def logout_user():
    response = RedirectResponse(url="/")
    response.delete_cookie("token")
    return response
