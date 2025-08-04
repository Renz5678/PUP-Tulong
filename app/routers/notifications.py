from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from datetime import datetime
import uuid

from ..api.auth.dependencies import get_current_user
from ..api.auth.db import notifications_table  # DynamoDB table for notifications
from boto3.dynamodb.conditions import Key

router = APIRouter()

# ✅ Utility function to create a new notification
def create_notification(email: str, message: str, link: str = "#"):
    notif_id = str(uuid.uuid4())
    notifications_table.put_item(Item={
        "notification_id": notif_id,  # must match your partition key if using GSI
        "email": email,               # main partition key
        "message": message,
        "link": link,
        "timestamp": datetime.utcnow().isoformat(),
        "seen": False
    })

# ✅ Route to fetch notifications for a user
@router.get("/notifications")
def get_notifications(user=Depends(get_current_user)):
    response = notifications_table.query(
        KeyConditionExpression=Key("email").eq(user["email"])
    )
    return response.get("Items", [])

# ⚠️ FIX: This uses wrong key! You should use the correct partition key and sort key (if any)
@router.post("/notifications/read/{notif_id}")
def mark_as_read(notif_id: str, user=Depends(get_current_user)):
    notifications_table.update_item(
        Key={"email": user["email"], "notification_id": notif_id},  # ✅ Must use correct keys
        UpdateExpression="SET seen = :s",
        ExpressionAttributeValues={":s": True}
    )
    return JSONResponse(content={"message": "Marked as read"})

# ✅ Mark all notifications as seen (used by the red dot logic)
@router.put("/notifications/mark_seen")
def mark_seen(user=Depends(get_current_user)):
    response = notifications_table.query(
        KeyConditionExpression=Key("email").eq(user["email"])
    )
    items = response.get("Items", [])
    with notifications_table.batch_writer() as batch:
        for item in items:
            item["seen"] = True
            batch.put_item(Item=item)
    return {"message": "All notifications marked as seen"}
