import bcrypt
import jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# ✅ Load the .env file
load_dotenv()

# ✅ Get SECRET_KEY from environment
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_jwt(email: str, nickname: str) -> str:
    payload = {
        "sub": email,
        "nickname": nickname,
        "exp": datetime.utcnow() + timedelta(hours=6)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_jwt(token: str):
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
