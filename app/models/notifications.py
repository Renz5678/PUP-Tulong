from pydantic import BaseModel
from datetime import datetime

class Notification(BaseModel):
    notification_id: str
    user_id: str
    message: str
    timestamp: str
    seen: bool = False
