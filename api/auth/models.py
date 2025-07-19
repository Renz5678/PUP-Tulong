from pydantic import BaseModel, EmailStr

# Registration model
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    nickname: str

# Login model
class LoginRequest(BaseModel):
    email: EmailStr
    password: str