from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

from database import db

@router.get("", response_model=dict)
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications_cursor = db.notifications.find({"userId": current_user["userId"]}).sort("createdAt", -1).limit(20)
    notifications = await notifications_cursor.to_list(length=20)
    
    for notif in notifications:
        notif["_id"] = str(notif["_id"])
    
    return {"notifications": notifications}

@router.put("/{notification_id}/read", response_model=dict)
async def mark_as_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"_id": ObjectId(notification_id), "userId": current_user["userId"]},
        {"$set": {"read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bildirim bulunamadı"
        )
    
    return {"success": True}
