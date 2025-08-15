from fastapi import (
    APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
)

from app.api.task.dynamodb_requests import (
    get_claimed_tasks, 
    get_average_rating, 
    get_ratings_for_user,
    get_user_stats
)

# Remove Flask imports - we're using FastAPI only
# from flask import Blueprint, jsonify
# from flask_jwt_extended import jwt_required, get_jwt_identity
from boto3.dynamodb.conditions import Key, Attr
from statistics import mean
import boto3
import logging
from datetime import datetime
import json
import jwt
from fastapi.responses import HTMLResponse
from fastapi.responses import JSONResponse
from fastapi.templating import Jinja2Templates
from typing import List, Optional
import uuid
import os
from decimal import Decimal

from app.api.auth.protected import get_current_user
from app.api.task import dynamodb_requests
from app.api.task.dynamodb_requests import get_requests_table
from app.api.task.dynamodb_requests import get_users_table
from app.api.task.dynamodb_requests import get_ratings_table
from app.routers.notifications import create_notification

router = APIRouter(tags=["Dashboard"])
templates = Jinja2Templates(directory="app/templates")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

UPLOAD_DIR = "app/static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

dynamodb = boto3.resource("dynamodb", region_name="ap-northeast-1")
users_table = dynamodb.Table("users_table")

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
    request_item = dynamodb_requests.get_request_by_id(request_id)
    if not request_item:
        raise HTTPException(status_code=404, detail="Request not found")
    return request_item

@router.post("/request")
async def create_new_request(
    title: str = Form(...),
    description: str = Form(...),
    tags: str = Form(...),
    deadline: str = Form(...),
    price: Decimal = Form(...),
    mode: str = Form(...),
    location: str = Form(None),
    image: Optional[UploadFile] = File(None),
    user=Depends(get_current_user)
):
    image_url = None

    if image:
        ext = image.filename.split(".")[-1]
        image_filename = f"{uuid.uuid4()}.{ext}"
        image_path = os.path.join(UPLOAD_DIR, image_filename)
        with open(image_path, "wb") as f:
            f.write(await image.read())
        image_url = f"/static/uploads/{image_filename}"

    tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]

    return dynamodb_requests.create_request(
        email=user["sub"],
        nickname=user["nickname"],
        title=title,
        description=description,
        tags=tag_list,
        deadline=deadline,
        image_url=image_url,
        price=price,
        mode=mode,
        location=location
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

# NEW: FastAPI version of profile stats
# Fixed version of the profile stats endpoint
# Fixed version of the profile stats endpoint  
@router.get("/profile/stats")
async def get_user_stats(user=Depends(get_current_user)):
    try:
        user_email = user.get("sub")
        if not user_email:
            raise HTTPException(status_code=400, detail="User email not found")

        # ✅ Use get_users_table() since debug shows it points to umsgc_login correctly
        users_table = get_users_table()
        
        print(f"🔍 DEBUG: Querying {users_table.table_name} table for user: {user_email}")
        
        # ✅ Fetch user record
        response = users_table.get_item(Key={"email": user_email})
        print(f"🔍 DEBUG: DynamoDB response: {response}")

        user_data = response.get("Item", {})
        print(f"🔍 DEBUG: User data: {user_data}")

        # ✅ Get tasks_completed and handle type conversion
        tasks_completed = user_data.get("tasks_completed", 0)
        print(f"🔍 DEBUG: Raw tasks_completed: {tasks_completed} (type: {type(tasks_completed)})")

        # ✅ Handle Decimal type from DynamoDB
        if hasattr(tasks_completed, 'to_integral_value'):
            tasks_completed = int(tasks_completed)
        elif not isinstance(tasks_completed, int):
            try:
                tasks_completed = int(tasks_completed) if tasks_completed else 0
            except (ValueError, TypeError):
                tasks_completed = 0
                
        print(f"🔍 DEBUG: Final tasks_completed: {tasks_completed}")

        # ✅ Get rating stats
        average_rating = get_average_rating(user_email)
        ratings = get_ratings_for_user(user_email)
        total_ratings = len(ratings)

        if average_rating is None:
            average_rating = 0.0

        result = {
            "tasks_completed": int(tasks_completed),  # Ensure it's always an integer
            "average_rating": float(average_rating),
            "total_ratings": int(total_ratings)
        }
        
        print(f"✅ DEBUG: Returning stats: {result}")
        return result

    except Exception as e:
        logger.error(f"❌ Error getting user stats: {str(e)}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to get user stats")
    
@router.put("/request/{request_id}/accept")
async def accept_request(request_id: str, user=Depends(get_current_user)):
    result = dynamodb_requests.accept_request(request_id, user["sub"])
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    task = dynamodb_requests.get_request_by_id(request_id)
    if task and "email" in task:
        create_notification(
            email=task["email"],
            message=f"Your task '{task['title']}' was claimed by {user['nickname'] or user['sub']}",
            link="/dashboard"
        )

    return result

@router.put("/request/{request_id}/cancel")
async def cancel_request(request_id: str, user=Depends(get_current_user)):
    task = dynamodb_requests.get_request_by_id(request_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    if task.get("accepted_by", "").strip() != user["sub"]:
        raise HTTPException(status_code=403, detail="You did not claim this task.")

    get_requests_table().update_item(
        Key={"id": request_id},
        UpdateExpression="REMOVE accepted_by"
    )
    return {"success": True}

@router.get("/claimed_tasks")
async def get_claimed_tasks_endpoint(user=Depends(get_current_user)):
    all_tasks = dynamodb_requests.get_all_requests()
    claimed = [
        req for req in all_tasks
        if req.get("accepted_by", "").strip() == user["sub"]
        and req.get("completion_status") not in ["accepted", "completed"]
    ]
    print(f"✅ Returning {len(claimed)} active claimed tasks for {user['sub']}")
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

@router.put("/request/{request_id}/mark_completed")
async def mark_task_completed(request_id: str, user=Depends(get_current_user)):
    task = dynamodb_requests.get_request_by_id(request_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    if task.get("accepted_by") != user["sub"]:
        raise HTTPException(status_code=403, detail="You are not the claimer of this task.")

    get_requests_table().update_item(
        Key={"id": request_id},
        UpdateExpression="SET completion_status = :status",
        ExpressionAttributeValues={":status": "waiting_confirmation"}
    )

    if task and "email" in task:
        create_notification(
            email=task["email"],
            message=f"Task '{task['title']}' has been marked as completed by {user['nickname'] or user['sub']}. Please review and confirm.",
            link=f"/dashboard/request/{request_id}"
        )

    return {
        "success": True,
        "message": "Task marked as completed. Waiting for sender to confirm.",
        "completer_name": user.get("nickname", user["sub"])
    }

@router.put("/request/{request_id}/confirm_completion")
async def confirm_completion(request_id: str, decision: str = Form(...), user=Depends(get_current_user)):
    task = get_requests_table().get_item(Key={"id": request_id}).get("Item")
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    if task.get("email") != user["sub"]:
        raise HTTPException(status_code=403, detail="You are not the original requester of this task.")
    if task.get("completion_status") != "waiting_confirmation":
        raise HTTPException(status_code=400, detail="Task is not awaiting confirmation.")
    if decision not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid decision value. Use 'accepted' or 'rejected'.")

    # ✅ Update task status
    get_requests_table().update_item(
        Key={"id": request_id},
        UpdateExpression="SET completion_status = :status",
        ExpressionAttributeValues={":status": decision}
    )

    # ✅ Prepare success response for frontend now
    response = {"success": True, "message": f"Completion {decision}."}

    # ✅ If accepted, increment tasks_completed for helper
    if decision == "accepted" and task.get("accepted_by"):
        claimer_email = task["accepted_by"]
        
        # Debug: Check user before update
        logger.info(f"About to increment tasks_completed for: {claimer_email}")
        
        try:
            # Check current value before update
            current_user = get_users_table().get_item(Key={"email": claimer_email}).get("Item")
            current_count = current_user.get("tasks_completed", 0) if current_user else 0
            logger.info(f"Current tasks_completed for {claimer_email}: {current_count}")
            
            # Perform the update
            update_response = get_users_table().update_item(
                Key={"email": claimer_email},
                UpdateExpression="SET tasks_completed = if_not_exists(tasks_completed, :zero) + :inc",
                ExpressionAttributeValues={":inc": 1, ":zero": 0},
                ReturnValues="ALL_NEW"  # This returns the updated item
            )
            
            # Log the update response
            logger.info(f"Update response: {update_response}")
            
            new_count = update_response.get("Attributes", {}).get("tasks_completed", 0)
            logger.info(f"✅ Successfully incremented tasks_completed for {claimer_email}: {current_count} → {new_count}")
            
        except Exception as e:
            logger.error(f"❌ Failed to update tasks_completed for {claimer_email}: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")

    # ✅ Notifications
    if task.get("accepted_by"):
        if decision == "accepted":
            create_notification(
                email=task["accepted_by"],
                message=f"Great news! Your completion of '{task['title']}' has been confirmed by {user.get('nickname') or user['sub']}.",
                link="/dashboard"
            )
        else:
            create_notification(
                email=task["accepted_by"],
                message=f"The completion of '{task['title']}' was not accepted. Please contact the requester for clarification.",
                link=f"/dashboard/request/{request_id}"
            )

    return response

@router.get("/my_requests")
async def get_my_requests(user=Depends(get_current_user)):
    return dynamodb_requests.get_user_requests(user["sub"])

@router.get("/completed_tasks")
async def get_completed_tasks(user=Depends(get_current_user)):
    all_tasks = dynamodb_requests.get_all_requests()
    completed = [
        req for req in all_tasks
        if req.get("accepted_by", "").strip() == user["sub"]
        and req.get("completion_status") in ["accepted", "completed"]
    ]
    return completed

@router.get("/completed_requests")
async def get_completed_requests(user=Depends(get_current_user)):
    all_requests = dynamodb_requests.get_user_requests(user["sub"])
    completed = [
        req for req in all_requests
        if req.get("completion_status") in ["accepted", "completed"]
    ]
    return completed

@router.post("/rate_helper")
async def rate_helper(request: Request):
    try:
        # Debug: Check the raw request body first
        body = await request.body()
        logging.info(f"Raw request body: {body}")
        logging.info(f"Request content type: {request.headers.get('content-type')}")
        
        # Check if body is empty
        if not body:
            logging.error("Request body is empty")
            return JSONResponse({"error": "Empty request body"}, status_code=400)
        
        # Try to parse JSON with better error handling
        try:
            if isinstance(body, bytes):
                body_str = body.decode('utf-8')
                logging.info(f"Body as string: {body_str}")
                data = json.loads(body_str)
            else:
                data = await request.json()
        except json.JSONDecodeError as e:
            logging.error(f"JSON decode error: {e}")
            logging.error(f"Body content: {body}")
            return JSONResponse({
                "error": "Invalid JSON in request body",
                "detail": str(e)
            }, status_code=400)
        except Exception as e:
            logging.error(f"Request parsing error: {e}")
            return JSONResponse({
                "error": "Failed to parse request",
                "detail": str(e)
            }, status_code=400)
        
        logging.info(f"Parsed data: {data}")
        
        # Extract fields
        task_id = data.get("task_id")
        helper_id = data.get("helper_id")
        rating = data.get("rating")
        feedback = data.get("feedback", "")

        logging.info(f"Extracted - task_id: {task_id}, helper_id: {helper_id}, rating: {rating}")

        if not (task_id and rating):
            return JSONResponse({
                "error": "Missing required fields: task_id and rating",
                "received": data
            }, status_code=400)

        user_email = None
        
        # Method 1: Try JWT token (optional)
        token = request.cookies.get("token")
        if token:
            try:
                # Add your actual JWT secret here
                possible_secrets = [
                    "your-secret-key",
                    "secret-key", 
                    "jwt-secret"
                ]
                
                for secret in possible_secrets:
                    try:
                        payload = jwt.decode(token, secret, algorithms=["HS256"])
                        user_email = payload.get("sub")
                        logging.info(f"JWT decoded successfully, user: {user_email}")
                        break
                    except:
                        continue
            except Exception as e:
                logging.info(f"JWT decode failed: {e}")
        
        # Method 2: Get from request body
        if not user_email:
            user_email = data.get("user_email")
            logging.info(f"Using user_email from request: {user_email}")
        
        if not user_email:
            return JSONResponse({
                "error": "User not authenticated"
            }, status_code=401)

        # Validate email format
        if not isinstance(user_email, str) or '@' not in user_email:
            return JSONResponse({"error": "Invalid email format"}, status_code=400)

        # Validate rating is a number
        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                return JSONResponse({"error": "Rating must be between 1 and 5"}, status_code=400)
        except (ValueError, TypeError):
            return JSONResponse({"error": "Rating must be a valid number"}, status_code=400)

        # Save the rating
        rating_item = {
            "task_id": str(task_id),
            "email": user_email,
            "rating": rating,
            "comment": str(feedback),
            "created_at": datetime.now().isoformat()
        }
        
        if helper_id:
            rating_item["helper_id"] = str(helper_id)
        
        logging.info(f"Saving rating item: {rating_item}")
        
        get_ratings_table().put_item(Item=rating_item)
        
        logging.info("Rating saved successfully!")
        return {
            "success": True, 
            "message": "Rating submitted successfully!",
            "rating_data": rating_item
        }
        
    except Exception as e:
        logging.error(f"Unexpected error in rate_helper: {e}")
        import traceback
        logging.error(f"Full traceback: {traceback.format_exc()}")
        return JSONResponse({
            "error": "Internal server error",
            "detail": str(e)
        }, status_code=500)
    
@router.get("/ratings")
async def get_user_ratings(user=Depends(get_current_user)):
    """Get all ratings for the current user as a helper"""
    try:
        user_email = user.get("sub")
        if not user_email:
            raise HTTPException(status_code=400, detail="User email not found")

        ratings_table = get_ratings_table()
        
        print(f"🔍 DEBUG: Fetching ratings where user is helper: {user_email}")
        
        # ✅ Only ratings where user is the helper
        response = ratings_table.scan(
            FilterExpression="helper_id = :user_email",
            ExpressionAttributeValues={":user_email": user_email}
        )
        
        ratings = response.get("Items", [])
        print(f"✅ Found {len(ratings)} ratings for helper {user_email}")
        
        # Sort newest first
        ratings.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        # Convert Decimal ratings to int
        for rating in ratings:
            if hasattr(rating.get("rating"), 'to_integral_value'):
                rating["rating"] = int(rating["rating"])
        
        return {
            "ratings": ratings,
            "total_count": len(ratings)
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching ratings: {str(e)}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to fetch ratings")


@router.get("/ratings/filter")
async def get_filtered_ratings(
    stars: Optional[int] = None,
    sort_by: Optional[str] = None,
    user=Depends(get_current_user)
):
    """Get filtered and sorted ratings where user is helper"""
    try:
        user_email = user.get("sub")
        if not user_email:
            raise HTTPException(status_code=400, detail="User email not found")

        ratings_table = get_ratings_table()
        
        # ✅ Only ratings where user is the helper
        response = ratings_table.scan(
            FilterExpression="helper_id = :user_email",
            ExpressionAttributeValues={":user_email": user_email}
        )
        
        ratings = response.get("Items", [])
        
        # Filter by stars
        if stars:
            ratings = [r for r in ratings if int(r.get("rating", 0)) == stars]
        
        # Sorting logic
        if sort_by == "newest":
            ratings.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        elif sort_by == "oldest":
            ratings.sort(key=lambda x: x.get("created_at", ""))
        elif sort_by == "az":
            ratings.sort(key=lambda x: x.get("comment", "").lower())
        elif sort_by == "za":
            ratings.sort(key=lambda x: x.get("comment", "").lower(), reverse=True)
        else:
            ratings.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        # Convert Decimal to int
        for rating in ratings:
            if hasattr(rating.get("rating"), 'to_integral_value'):
                rating["rating"] = int(rating["rating"])
        
        return {
            "ratings": ratings,
            "total_count": len(ratings),
            "filter": {"stars": stars, "sort_by": sort_by}
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching filtered ratings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch filtered ratings")
    
# Replace your existing profile stats endpoint with this fixed version:

# REPLACE your broken /dashboard/profile/stats endpoint with this:

