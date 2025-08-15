import uuid
from datetime import datetime
import boto3
from boto3.dynamodb.conditions import Key
import logging
from typing import Optional
from statistics import mean

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------- Table Accessors ----------
def get_requests_table():
    dynamodb = boto3.resource("dynamodb", region_name="ap-northeast-1")
    return dynamodb.Table("umsgc_helprequests")

def get_users_table():
    dynamodb = boto3.resource("dynamodb", region_name="ap-northeast-1")
    return dynamodb.Table("umsgc_login")  # store login data & profiles

def get_ratings_table():
    dynamodb = boto3.resource("dynamodb", region_name="ap-northeast-1")
    return dynamodb.Table("umsgc_ratings")  # store ratings

def get_user_stats(email, tasks_completed):
    ratings_table = get_ratings_table()
    
    ratings_data = ratings_table.query(
        KeyConditionExpression=Key("email").eq(email)
    )
    ratings = ratings_data.get("Items", [])

    avg_rating = mean([float(r["rating"]) for r in ratings]) if ratings else 0.0
    total_ratings = len(ratings)

    return {
        "tasks_completed": tasks_completed,
        "average_rating": round(avg_rating, 2),
        "total_ratings": total_ratings
    }

# ---------- Help Requests ----------
def create_request(email: str, nickname: str, title: str, description: str,
                   tags: list, deadline: str, image_url: Optional[str],
                   price: float, mode: str, location: Optional[str] = None):
    request_id = str(uuid.uuid4())
    item = {
        "id": request_id,
        "email": email,
        "nickname": nickname,
        "title": title,
        "description": description,
        "tags": tags,
        "deadline": deadline,
        "price": price,
        "mode": mode,
        "created_at": datetime.utcnow().isoformat(),
        "completion_status": "pending"
    }
    if image_url:
        item["image_url"] = image_url
    if mode == "onsite" and location:
        item["location"] = location

    get_requests_table().put_item(Item=item)
    return item

def get_all_requests():
    return get_requests_table().scan().get("Items", [])

def get_request_by_id(request_id: str):
    return get_requests_table().get_item(Key={"id": request_id}).get("Item")

def delete_user_request(email: str, request_id: str):
    item = get_request_by_id(request_id)
    if item and item.get("email") == email:
        get_requests_table().delete_item(Key={"id": request_id})
        return {"success": True}
    return {"error": "Unauthorized or not found"}

def accept_request(request_id: str, user_email: str):
    item = get_request_by_id(request_id)
    if not item:
        return {"error": "Request not found"}

    accepted_by_value = item.get("accepted_by", "").strip() if isinstance(item.get("accepted_by"), str) else item.get("accepted_by")
    if accepted_by_value not in (None, "", []):
        return {"error": "Request already accepted by another user"}

    get_requests_table().update_item(
        Key={"id": request_id},
        UpdateExpression="SET accepted_by = :email",
        ExpressionAttributeValues={":email": user_email}
    )
    return {"success": True, "accepted_by": user_email}

def get_claimed_tasks(user_email: str):
    return get_requests_table().scan(
        FilterExpression="accepted_by = :email",
        ExpressionAttributeValues={":email": user_email}
    ).get("Items", [])

def get_user_requests(email: str):
    return [
        item for item in get_requests_table().scan().get("Items", [])
        if item.get("email") == email
    ]

# ---------- User Login & Profiles ----------
def create_or_update_user(email: str, nickname: str, profile_image: Optional[str] = None):
    """Create new user or update existing profile."""
    item = {
        "email": email,
        "nickname": nickname,
        "updated_at": datetime.utcnow().isoformat()
    }
    if profile_image:
        item["profile_image"] = profile_image
    get_users_table().put_item(Item=item)
    return item

def get_user_by_email(email: str):
    return get_users_table().get_item(Key={"email": email}).get("Item")

# ---------- Ratings ----------
def add_rating(task_id: str, rater_email: str, ratee_email: str, rating_value: int, comment: Optional[str] = None):
    """Add a rating from one user to another for a specific task."""
    if not (1 <= rating_value <= 5):
        return {"error": "Rating must be between 1 and 5"}

    rating_id = str(uuid.uuid4())
    item = {
        "id": rating_id,
        "task_id": task_id,
        "rater_email": rater_email,
        "ratee_email": ratee_email,
        "rating_value": rating_value,
        "comment": comment or "",
        "created_at": datetime.utcnow().isoformat()
    }
    get_ratings_table().put_item(Item=item)
    return {"success": True, "rating": item}

def get_ratings_for_user(user_email: str):
    """Get all ratings received by a specific user."""
    ratings = get_ratings_table().scan(
        FilterExpression="ratee_email = :email",
        ExpressionAttributeValues={":email": user_email}
    ).get("Items", [])
    return ratings

def get_average_rating(user_email: str):
    """Calculate average rating for a user."""
    ratings = get_ratings_for_user(user_email)
    if not ratings:
        return None
    avg = sum(r["rating_value"] for r in ratings) / len(ratings)
    return round(avg, 2)
