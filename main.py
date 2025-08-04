from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
import os

# Load .env variables
load_dotenv()

# FastAPI app
app = FastAPI()

# ------------------ Middleware ------------------

# CORS (allow all origins for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Change this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session middleware for OAuth
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", "super-secret-key"),
    same_site="lax",
    max_age=60 * 60 * 24,  # 1 day
    session_cookie="session",
)

# ------------------ Routers ------------------

# Import routers
from app.api.auth.routes import router as auth_router
from app.api.auth.google import router as google_router
from app.api.auth.protected import protected
from app.dashboard import router as dashboard_router
from app.routers import auth, tasks
from app.routers.notifications import router as notifications_router
  # ✅ Corrected here

# Attach routers
app.include_router(auth_router, prefix="/auth")
app.include_router(google_router)
app.include_router(protected, prefix="/auth")
app.include_router(dashboard_router, prefix="/dashboard")
app.include_router(auth)
app.include_router(tasks)
app.include_router(notifications_router, prefix="/dashboard")  # ✅ Mounted correctly

# ------------------ Static & Templates ------------------

app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

# ------------------ Page Routes ------------------

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

@app.get("/requests", response_class=HTMLResponse)
def show_requests_page(request: Request):
    return templates.TemplateResponse("pages/requests.html", {"request": request})

@app.get("/ratings", response_class=HTMLResponse)
def show_ratings_page(request: Request):
    return templates.TemplateResponse("pages/ratings.html", {"request": request})

@app.get("/logout")
def logout(request: Request):
    request.session.clear()
    response = RedirectResponse(url="/login", status_code=302)
    response.delete_cookie("session")
    return response
