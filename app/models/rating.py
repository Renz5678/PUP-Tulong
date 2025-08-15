from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class Rating(BaseModel):
    rating_id: str
    user_id: str               # The user who is being rated
    from_user_id: str          # The user who gave the rating
    score: int                 # e.g., 1–5
    comment: Optional[str]
    created_at: datetime = datetime.utcnow()