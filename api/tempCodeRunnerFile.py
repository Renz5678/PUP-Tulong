from fastapi import FastAPI
from auth.routes import router as auth_router
from dotenv import load_dotenv

# ✅ Load environment variables from .env file
load_dotenv()

# ✅ Create the FastAPI app
app = FastAPI(
    title="Login API",
    description="FastAPI login system using DynamoDB",
    version="1.0"
)

# ✅ Mount the /auth routes (e.g., /auth/login)
app.include_router(auth_router, prefix="/auth")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)