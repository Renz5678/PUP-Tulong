from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse

from .models import RegisterRequest, LoginRequest
from .utils import hash_password, verify_password, create_jwt
from .db import users_table

router = APIRouter()


@router.post("/register")
def register_user(data: RegisterRequest):
    existing_user = users_table.get_item(Key={"email": data.email}).get("Item")
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    users_table.put_item(Item={
        "email": data.email,
        "password": hash_password(data.password),
        "nickname": data.nickname
    })

    token = create_jwt(data.email, data.nickname)

    response = JSONResponse(content={"message": "User registered"})
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
