# FILE: api/auth/protected.py

from fastapi import APIRouter, Request, HTTPException, Depends
from .utils import decode_jwt

protected = APIRouter()

# ✅ This function can now be reused with Depends()
async def get_current_user(request: Request):
    token = request.cookies.get("token")
    print("🍪 Raw token:", token)

    if not token:
        print("❌ No token found in cookies")
        raise HTTPException(status_code=401, detail="No token found")

    try:
        payload = decode_jwt(token)
        print("✅ Decoded token payload:", payload)
        return {
            "sub": payload["sub"],
            "nickname": payload.get("nickname", "")
        }
    except Exception as e:
        print("❌ Failed to decode token:", e)
        raise HTTPException(status_code=401, detail="Invalid token")



# ✅ Still exposed as an endpoint
@protected.get("/auth/me")
def get_current_user_from_cookie(user=Depends(get_current_user)):
    return user


@protected.get("/dashboard")
def dashboard(user=Depends(get_current_user)):
    return {"message": f"Welcome to your dashboard, {user.get('nickname', 'User')}!"}
