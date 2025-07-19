from fastapi import APIRouter, HTTPException
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

    # ✅ Use data directly (it's what we just stored)
    token = create_jwt(data.email, data.nickname)
    return {"message": "User registered", "token": token}


@router.post("/login")
def login_user(data: LoginRequest):
    user = users_table.get_item(Key={"email": data.email}).get("Item")
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # ✅ Use nickname from the retrieved user
    token = create_jwt(user["email"], user["nickname"])
    return {"message": "Login successful", "token": token}
