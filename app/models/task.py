from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TaskCreateRequest(BaseModel):
    title: str
    description: str
    requester_id: str  # DynamoDB user ID

class TaskResponse(BaseModel):
    task_id: str
    title: str
    description: str
    status: str
    created_at: datetime
    requester_id: str
