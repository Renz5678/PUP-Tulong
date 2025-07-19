from fastapi import APIRouter, HTTPException
from boto3.dynamodb.conditions import Attr
import uuid

from .models import RegisterRequest, LoginRequest
from .utils import hash_password
from .db import users_table

router = APIRouter()

# ✅ Register Route
@router.post("/register")
def register_user(user: RegisterRequest):
    # Check if email already exists
    response = users_table.scan(
        FilterExpression=Attr("email").eq(user.email)
    )
    if response.get("Items"):
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(user.password)
    user_id = str(uuid.uuid4())

    users_table.put_item(Item={
        "id": user_id,
        "email": user.email,
        "password": hashed_password,
        "nickname": user.nickname
    })

    return {"message": "User registered successfully", "user_id": user_id}

# ✅ Login Route
@router.post("/login")
def login_user(credentials: LoginRequest):
    # Hash the input password
    hashed_input = hash_password(credentials.password)

    # Search by email
    response = users_table.scan(
        FilterExpression=Attr("email").eq(credentials.email)
    )
    items = response.get("Items", [])

    if not items or items[0]["password"] != hashed_input:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "message": "Login successful",
        "user_id": items[0]["id"],
        "nickname": items[0]["nickname"]
    }