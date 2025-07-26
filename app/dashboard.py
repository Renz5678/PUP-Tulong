from fastapi import (
    APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
)
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from typing import List
import uuid
import os
from app.api.auth.protected import get_current_user
from app.api.task import dynamodb_requests
from app.api.task.dynamodb_requests import get_table
from decimal import Decimal

router = APIRouter(tags=["Dashboard"])
templates = Jinja2Templates(directory="app/templates")

UPLOAD_DIR = "app/static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---------------------- ROUTES ----------------------

@router.get("/", response_class=HTMLResponse)
async def dashboard_page(request: Request, user=Depends(get_current_user)):
    print("✅ Logged in as:", user)
    return templates.TemplateResponse("dashboard.html", {"request": request, "user": user})


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
async def create_new_request(
    title: str = Form(...),
    description: str = Form(...),
    tags: str = Form(...),  # comma-separated
    deadline: str = Form(...),
    price: Decimal = Form(...),
    mode: str = Form(...),  # online or onsite
    image: UploadFile = File(...),
    user=Depends(get_current_user)
):
    ext = image.filename.split(".")[-1]
    image_filename = f"{uuid.uuid4()}.{ext}"
    image_path = os.path.join(UPLOAD_DIR, image_filename)

    with open(image_path, "wb") as f:
        f.write(await image.read())

    tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]

    return dynamodb_requests.create_request(
        email=user["sub"],
        nickname=user["nickname"],
        title=title,
        description=description,
        tags=tag_list,
        deadline=deadline,
        image_url=f"/static/uploads/{image_filename}",
        price=price,
        mode=mode
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


@router.put("/request/{request_id}/cancel")
async def cancel_request(request_id: str, user=Depends(get_current_user)):
    task = dynamodb_requests.get_request_by_id(request_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    if task.get("accepted_by", "").strip() != user["sub"]:
        raise HTTPException(status_code=403, detail="You did not claim this task.")

    # ✅ Properly remove the attribute
    get_table().update_item(
        Key={"id": request_id},
        UpdateExpression="REMOVE accepted_by"
    )

    return {"success": True}



@router.get("/claimed_tasks")
async def get_claimed_tasks(user=Depends(get_current_user)):
    all_tasks = dynamodb_requests.get_all_requests()
    claimed = [
        req for req in all_tasks
        if req.get("accepted_by", "").strip() == user["sub"]
    ]
    print(f"✅ Returning {len(claimed)} claimed tasks for {user['sub']}")
    return claimed

@router.get("/unclaimed_tasks")
async def get_unclaimed_tasks(user=Depends(get_current_user)):
    all_tasks = dynamodb_requests.get_all_requests()
    unclaimed = [
        req for req in all_tasks
        if (not req.get("accepted_by") or req["accepted_by"].strip() == "")
        and req.get("email") != user["sub"]
    ]
    print(f"✅ Returning {len(unclaimed)} unclaimed tasks.")
    return unclaimed

@router.get("/my_requests")
async def get_my_requests(user=Depends(get_current_user)):
    all_requests = dynamodb_requests.get_all_requests()
    my_requests = [
        req for req in all_requests if req.get("email") == user["sub"]
    ]
    return my_requests