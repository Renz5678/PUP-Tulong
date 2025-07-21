# FILE: api/auth/protected.py

from fastapi import APIRouter, Request, HTTPException, Depends
from .utils import decode_jwt

protected = APIRouter()

# ✅ This function can now be reused with Depends()
def get_current_user(request: Request):
    token = request.cookies.get("token")
    if not token:
        raise HTTPException(status_code=401, detail="No token found")

    try:
        payload = decode_jwt(token)
        return {
            "sub": payload["sub"],
            "nickname": payload.get("nickname", "")
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


# ✅ Still exposed as an endpoint
@protected.get("/auth/me")
def get_current_user_from_cookie(user=Depends(get_current_user)):
    return user


@protected.get("/dashboard")
def dashboard(user=Depends(get_current_user)):
    return {"message": f"Welcome to your dashboard, {user.get('nickname', 'User')}!"}
