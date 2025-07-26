from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
from app.routers import tasks
from starlette.status import HTTP_404_NOT_FOUND
import os

# Routers
from app.api.auth.routes import router as auth_router
from app.api.auth.google import router as google_router
from app.api.auth.protected import protected
from app.dashboard import router as dashboard_router
from fastapi.responses import RedirectResponse

# ✅ Load environment variables from .env
load_dotenv()

app = FastAPI()

# ✅ CORS middleware (allow all for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔒 Consider restricting in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Session middleware for OAuth (cookie-based)
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", "super-secret-key"),
    same_site="lax",           # Required for modern browsers
    max_age=60 * 60 * 24,      # 1 day session
    session_cookie="session",  # Optional: name it
)

app.include_router(auth_router, prefix="/auth")
app.include_router(tasks.router) 
app.include_router(google_router)
app.include_router(protected, prefix="/auth")
app.include_router(dashboard_router, prefix="/dashboard")

# ✅ Mount static files (CSS, JS)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# ✅ Setup Jinja2 template rendering
templates = Jinja2Templates(directory="app/templates")

# ✅ Routes to render HTML pages
@app.get("/", response_class=HTMLResponse)
def root(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/login", response_class=HTMLResponse)
def login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/register", response_class=HTMLResponse)
def register(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request):
    return templates.TemplateResponse("pages/dashboard.html", {"request": request})

@app.get("/tasks", response_class=HTMLResponse)
def show_tasks_page(request: Request):
    return templates.TemplateResponse("pages/tasks.html", {"request": request})

@app.get("/logout")
def logout(request: Request):
    request.session.clear()  # Clear all session data
    response = RedirectResponse(url="/login", status_code=302)
    response.delete_cookie("session")  # Optional: make sure session cookie is gone
    return response
# ✅ Include routers


# ✅ Custom 404 fallback
# @app.exception_handler(StarletteHTTPException)
# async def not_found_handler(request: Request, exc: StarletteHTTPException):
#     print(f"❌ 404 Not Found: {request.url.path}")
#     if exc.status_code == HTTP_404_NOT_FOUND:
#         return templates.TemplateResponse("login.html", {"request": request})
#     return HTMLResponse(content=str(exc.detail), status_code=exc.status_code)
