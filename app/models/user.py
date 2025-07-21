from pydantic import BaseModel, EmailStr
from typing import Optional

class UserProfile(BaseModel):
    user_id: str
    email: EmailStr
    nickname: Optional[str]
    created_at: Optional[str]  # ISO datetime string
