import uuid
from datetime import datetime
import boto3
from boto3.dynamodb.conditions import Key
import logging

# Setup logging for visibility
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lazy init for DynamoDB table
def get_table():
    try:
        dynamodb = boto3.resource("dynamodb", region_name="ap-northeast-1")  # ← adjust your region
        table = dynamodb.Table("umsgc_helprequests")
        return table
    except Exception as e:
        logger.error(f"❌ Error connecting to DynamoDB: {e}")
        raise

def create_request(email: str, nickname: str, title: str, description: str, tags: list, deadline: str, image_url: str):
    request_id = str(uuid.uuid4())
    item = {
        "id": request_id,
        "email": email,
        "nickname": nickname,
        "title": title,
        "description": description,
        "tags": tags,
        "deadline": deadline,
        "image_url": image_url,  # ✅ Added this line
        "created_at": datetime.utcnow().isoformat(),
    }
    try:
        get_table().put_item(Item=item)
        return item
    except Exception as e:
        logger.error(f"❌ Failed to create request: {e}")
        raise

def get_all_requests():
    try:
        response = get_table().scan()
        return response.get("Items", [])
    except Exception as e:
        logger.error(f"❌ Failed to get all requests: {e}")
        raise

def get_request_by_id(request_id: str):
    try:
        response = get_table().get_item(Key={"id": request_id})
        return response.get("Item")
    except Exception as e:
        logger.error(f"❌ Failed to get request by ID: {e}")
        raise

def delete_user_request(email: str, request_id: str):
    try:
        item = get_request_by_id(request_id)
        if item and item.get("email") == email:
            get_table().delete_item(Key={"id": request_id})
            return {"success": True}
        return {"error": "Unauthorized or not found"}
    except Exception as e:
        logger.error(f"❌ Failed to delete request: {e}")
        return {"error": str(e)}

def accept_request(request_id: str, user_email: str):
    try:
        item = get_request_by_id(request_id)
        if not item:
            return {"error": "Request not found"}

        if "accepted_by" in item:
            return {"error": "Request already accepted by another user"}

        get_table().update_item(
            Key={"id": request_id},
            UpdateExpression="SET accepted_by = :email",
            ExpressionAttributeValues={":email": user_email}
        )
        return {"success": True, "accepted_by": user_email}
    except Exception as e:
        logger.error(f"❌ Failed to accept request: {e}")
        return {"error": str(e)}