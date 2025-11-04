from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from models import BalanceUpdate
from auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])

from server import db

@router.get("/{user_id}", response_model=dict)
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    # Users can only get their own data unless admin
    if current_user["userId"] != user_id and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Yetkiniz yok"
        )
    
    user = await db.users.find_one({"_id": ObjectId(user_id)}, {"password": 0})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    user["_id"] = str(user["_id"])
    
    return {"user": user}

@router.put("/{user_id}/balance", response_model=dict)
async def update_balance(
    user_id: str,
    balance_update: BalanceUpdate,
    current_user: dict = Depends(get_current_user)
):
    # Users can only update their own balance
    if current_user["userId"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Yetkiniz yok"
        )
    
    # Update balance
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$inc": {"balance": balance_update.amount}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    # Get updated user
    user = await db.users.find_one({"_id": ObjectId(user_id)}, {"balance": 1})
    
    return {
        "success": True,
        "balance": user["balance"]
    }
