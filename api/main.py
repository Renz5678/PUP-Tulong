from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from auth.routes import router as auth_router
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

# ✅ Make sure this points to the correct static folder
app.mount("/static", StaticFiles(directory="static"), name="static")

# ✅ Add a root route to serve index.html
from fastapi.responses import FileResponse

@app.get("/")
def read_index():
    return FileResponse("static/index.html")

# ✅ Add auth routes
app.include_router(auth_router, prefix="/auth")
