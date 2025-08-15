from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserProfile(BaseModel):
    user_id: str
    email: EmailStr
    nickname: Optional[str]
    created_at: Optional[datetime]  # Use datetime type for automatic validation
    average_rating: float = 0.0
    ratings_count: int = 0
    number_of_tasks_completed: int = 0
