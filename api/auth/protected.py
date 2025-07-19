# FILE: api/auth/protected.py

from fastapi import APIRouter, Depends, Header, HTTPException
from .utils import decode_jwt

protected = APIRouter()

# ✅ JWT Auth dependency
def get_current_user(authorization: str = Header(...)):
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError("Invalid auth scheme")
        payload = decode_jwt(token)
        return {
            "email": payload["sub"],
            "nickname": payload["nickname"]
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")

# ✅ Protected route
@protected.get("/dashboard")
def dashboard(current_user: dict = Depends(get_current_user)):
    return {"message": f"Welcome to your dashboard, {current_user['nickname']}!"}

