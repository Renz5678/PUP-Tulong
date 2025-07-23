from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TaskCreateRequest(BaseModel):
    title: str
    description: str
    requester_id: str  # DynamoDB user ID
    image_url: Optional[str] = None # Added image_url here

class TaskResponse(BaseModel):
    task_id: str
    title: str
    description: str
    status: str
    created_at: datetime
    requester_id: str
    image_url: Optional[str] = None # Added image_url here