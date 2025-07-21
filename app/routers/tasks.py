from fastapi import APIRouter, HTTPException
import boto3
import logging

router = APIRouter()

# Setup logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# DynamoDB setup
dynamodb = boto3.resource("dynamodb", region_name="ap-northeast-1")
table = dynamodb.Table("umsgc_helprequests")

@router.get("/api/tasks")
async def get_tasks():
    try:
        response = table.scan()
        items = response.get("Items", [])

        return [
            {
                "id": item.get("id"),
                "title": item.get("title"),
                "author": item.get("author", "Anonymous"),
                "nickname": item.get("nickname", ""),   # 👈 Added
                "email": item.get("email", ""),         # 👈 Added
                "description": item.get("description", ""),
                "topics": item.get("topics", []),
                "tags": item.get("tags", []),
                "deadline": item.get("deadline"),
            }
            for item in items
        ]
    except Exception as e:
        logger.error(f"Error fetching tasks: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
