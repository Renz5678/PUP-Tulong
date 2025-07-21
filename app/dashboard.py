from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from app.api.auth.protected import get_current_user
from app.api.task import dynamodb_requests

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


# Pydantic schema for creating a help request
class RequestIn(BaseModel):
    title: str
    description: str
    tags: List[str]
    deadline: str  # Format: YYYY-MM-DD


# ---------------------- ROUTES ----------------------

@router.get("/requests")
async def get_all_requests():
    return dynamodb_requests.get_all_requests()


@router.get("/request/{request_id}")
async def get_single_request(request_id: str):
    request = dynamodb_requests.get_request_by_id(request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    return request


@router.post("/request")
async def create_new_request(req: RequestIn, user=Depends(get_current_user)):
    return dynamodb_requests.create_request(
        email=user["sub"],
        nickname=user["nickname"],
        title=req.title,
        description=req.description,
        tags=req.tags,
        deadline=req.deadline,
    )


@router.delete("/request/{request_id}")
async def delete_request(request_id: str, user=Depends(get_current_user)):
    result = dynamodb_requests.delete_user_request(user["sub"], request_id)
    if "error" in result:
        raise HTTPException(status_code=403, detail=result["error"])
    return result


@router.get("/profile")
async def get_user_profile(user=Depends(get_current_user)):
    return {"email": user["sub"], "nickname": user["nickname"]}

@router.put("/request/{request_id}/accept")
async def accept_request(request_id: str, user=Depends(get_current_user)):
    result = dynamodb_requests.accept_request(request_id, user["sub"])
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi import Request

templates = Jinja2Templates(directory="app/templates")

@router.get("/", response_class=HTMLResponse)
async def dashboard_page(request: Request, user=Depends(get_current_user)):
    return templates.TemplateResponse("dashboard.html", {"request": request, "user": user})
