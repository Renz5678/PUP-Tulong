# FILE: api/auth/protected.py

from fastapi import APIRouter, Request, HTTPException
from .utils import decode_jwt

protected = APIRouter()

@protected.get("/auth/me")
def get_current_user_from_cookie(request: Request):
    token = request.cookies.get("token")
    if not token:
        raise HTTPException(status_code=401, detail="No token found")

    try:
        payload = decode_jwt(token)
        return {
            "email": payload["sub"],
            "nickname": payload.get("nickname", "")
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@protected.get("/dashboard")
def dashboard(request: Request):
    token = request.cookies.get("token")
    if not token:
        raise HTTPException(status_code=401, detail="No token found")

    try:
        payload = decode_jwt(token)
        return {"message": f"Welcome to your dashboard, {payload.get('nickname', 'User')}!"}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
