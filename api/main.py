from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from auth.routes import router as auth_router
from auth.protected import protected  # ✅ Import the protected router
from starlette.requests import Request
from starlette.exceptions import HTTPException as StarletteHTTPException
import os

# ✅ Load environment variables
load_dotenv()

app = FastAPI()

# ✅ CORS middleware (allow frontend to access API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Change to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Mount static folder (your frontend files)
app.mount("/static", StaticFiles(directory="static"), name="static")

# ✅ Serve index.html at root
@app.get("/")
def read_index():
    return FileResponse("static/index.html")

# ✅ Include public auth routes
app.include_router(auth_router, prefix="/auth")

# ✅ Include protected routes
app.include_router(protected)

# ✅ Optional: fallback for 404 (useful if SPA like React is handling routing)
@app.exception_handler(StarletteHTTPException)
async def custom_404_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        return FileResponse("static/index.html")
    return HTMLResponse(content=str(exc.detail), status_code=exc.status_code)
