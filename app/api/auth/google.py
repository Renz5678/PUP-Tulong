from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from dotenv import load_dotenv
import os
from .db import users_table
from .utils import create_jwt  # Ensure this is imported at the top

load_dotenv()

router = APIRouter()

oauth = OAuth()
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid email profile",
        "prompt": "select_account"
    }
)

# ✅ Login Route
@router.get("/auth/login/google", name="google_login")
async def login_with_google(request: Request):
    redirect_uri = str(request.url_for("auth_google_callback"))
    print("🔁 Google Redirect URI:", redirect_uri)
    return await oauth.google.authorize_redirect(request, redirect_uri)

# ✅ Callback Route
@router.get("/auth/google/callback", name="auth_google_callback")
async def auth_google_callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = await oauth.google.userinfo(token=token)

        email = user_info.get("email")
        google_name = user_info.get("name")

        # ✅ Check if user already exists
        user_record = users_table.get_item(Key={"email": email}).get("Item")

        if user_record:
            nickname = user_record.get("nickname", google_name)
        else:
            # Auto-register if not in DB
            nickname = google_name
            users_table.put_item(Item={
                "email": email,
                "nickname": nickname,
                "name": google_name,
            })

        # ✅ Create JWT token
        jwt_token = create_jwt(email, nickname)

        # ✅ Set cookie and redirect to dashboard
        response = RedirectResponse(url="/dashboard", status_code=302)
        response.set_cookie(
            key="token",
            value=jwt_token,
            httponly=False,
            secure=False,
            samesite="Lax"
        )
        return response

    except Exception as e:
        print("❌ OAuth callback error:", e)
        return RedirectResponse(url="/?error=oauth_failed")
