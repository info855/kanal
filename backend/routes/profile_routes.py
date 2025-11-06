from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime
from bson import ObjectId
import uuid
from passlib.context import CryptContext
from models import ProfileUpdateRequestCreate, ProfileUpdateReview, PasswordChangeRequest
from auth import get_current_user, get_current_admin
from database import db

router = APIRouter(prefix="/api/profile", tags=["profile"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/change-password")
async def change_password(
    request: PasswordChangeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Kullanıcı şifre değiştirme (admin onay gerektirmez)
    """
    try:
        # Get user
        user = await db.users.find_one({"_id": ObjectId(current_user["userId"])})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Kullanıcı bulunamadı"
            )
        
        # Verify current password
        if not pwd_context.verify(request.currentPassword, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mevcut şifre yanlış"
            )
        
        # Hash new password
        hashed_password = pwd_context.hash(request.newPassword)
        
        # Update password
        await db.users.update_one(
            {"_id": ObjectId(current_user["userId"])},
            {"$set": {"password": hashed_password}}
        )
        
        return {"message": "Şifre başarıyla değiştirildi"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Şifre değiştirme hatası: {str(e)}"
        )

@router.post("/update-request")
async def create_update_request(
    request: ProfileUpdateRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Email veya telefon güncelleme talebi oluştur (admin onayı gerektirir)
    """
    try:
        # Get user
        user = await db.users.find_one({"_id": ObjectId(current_user["userId"])})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Kullanıcı bulunamadı"
            )
        
        # Check for existing pending request
        existing = await db.profile_update_requests.find_one({
            "userId": current_user["userId"],
            "updateType": request.updateType,
            "status": "pending"
        })
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Bu alan için bekleyen bir güncelleme talebiniz zaten var"
            )
        
        # Get current value
        current_value = user.get(request.updateType, "")
        
        # Create update request
        request_id = str(uuid.uuid4())
        update_request = {
            "_id": request_id,
            "userId": current_user["userId"],
            "userName": user["name"],
            "userEmail": user["email"],
            "updateType": request.updateType,
            "currentValue": current_value,
            "newValue": request.newValue,
            "status": "pending",
            "adminNote": None,
            "reviewedBy": None,
            "reviewedAt": None,
            "createdAt": datetime.utcnow()
        }
        
        await db.profile_update_requests.insert_one(update_request)
        
        return {
            "message": "Güncelleme talebiniz oluşturuldu. Admin onayı bekleniyor.",
            "requestId": request_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Talep oluşturma hatası: {str(e)}"
        )

@router.get("/update-requests")
async def get_update_requests(
    current_user: dict = Depends(get_current_user)
):
    """
    Kullanıcının güncelleme taleplerini getir
    """
    try:
        requests = await db.profile_update_requests.find({
            "userId": current_user["userId"]
        }).sort("createdAt", -1).to_list(length=50)
        
        for req in requests:
            req["_id"] = str(req["_id"])
        
        return {"requests": requests}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Talep listesi hatası: {str(e)}"
        )

# Admin endpoints
@router.get("/admin/update-requests")
async def get_all_update_requests(
    status_filter: str = None,
    current_user: dict = Depends(get_current_admin)
):
    """
    Tüm güncelleme taleplerini getir (admin)
    """
    try:
        query = {}
        if status_filter:
            query["status"] = status_filter
        
        requests = await db.profile_update_requests.find(query).sort("createdAt", -1).to_list(length=100)
        
        for req in requests:
            req["_id"] = str(req["_id"])
        
        return {"requests": requests}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Talep listesi hatası: {str(e)}"
        )

@router.post("/admin/approve-request/{request_id}")
async def approve_update_request(
    request_id: str,
    review: ProfileUpdateReview,
    current_user: dict = Depends(get_current_admin)
):
    """
    Güncelleme talebini onayla (admin)
    """
    try:
        # Get request
        update_request = await db.profile_update_requests.find_one({"_id": request_id})
        if not update_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Talep bulunamadı"
            )
        
        if update_request["status"] != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bu talep zaten işleme alınmış"
            )
        
        # Update user profile
        update_field = {update_request["updateType"]: update_request["newValue"]}
        await db.users.update_one(
            {"_id": ObjectId(update_request["userId"])},
            {"$set": update_field}
        )
        
        # Update request status
        await db.profile_update_requests.update_one(
            {"_id": request_id},
            {
                "$set": {
                    "status": "approved",
                    "adminNote": review.adminNote,
                    "reviewedBy": current_user["userId"],
                    "reviewedAt": datetime.utcnow()
                }
            }
        )
        
        return {"message": "Talep onaylandı ve kullanıcı profili güncellendi"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Onaylama hatası: {str(e)}"
        )

@router.post("/admin/reject-request/{request_id}")
async def reject_update_request(
    request_id: str,
    review: ProfileUpdateReview,
    current_user: dict = Depends(get_current_admin)
):
    """
    Güncelleme talebini reddet (admin)
    """
    try:
        # Get request
        update_request = await db.profile_update_requests.find_one({"_id": request_id})
        if not update_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Talep bulunamadı"
            )
        
        if update_request["status"] != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bu talep zaten işleme alınmış"
            )
        
        # Update request status
        await db.profile_update_requests.update_one(
            {"_id": request_id},
            {
                "$set": {
                    "status": "rejected",
                    "adminNote": review.adminNote,
                    "reviewedBy": current_user["userId"],
                    "reviewedAt": datetime.utcnow()
                }
            }
        )
        
        return {"message": "Talep reddedildi"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reddetme hatası: {str(e)}"
        )
