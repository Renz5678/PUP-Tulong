from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from starlette.requests import Request
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.sessions import SessionMiddleware

from auth.routes import router as auth_router
from auth.google import router as google_router
from auth.protected import protected

import os

# ✅ Load environment variables
load_dotenv()

app = FastAPI()

# ✅ CORS (for local testing, allow all)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔐 Restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Sessions for OAuth
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", "super-secret-key")
)

# ✅ Static frontend files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_index():
    return FileResponse("static/index.html")

# ✅ Include routers (no Facebook anymore)
app.include_router(auth_router, prefix="/auth")
app.include_router(google_router)
app.include_router(protected)

# ✅ Optional: fallback for frontend routing (like React or Vue)
@app.exception_handler(StarletteHTTPException)
async def custom_404_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        return FileResponse("static/index.html")
    return HTMLResponse(content=str(exc.detail), status_code=exc.status_code)
