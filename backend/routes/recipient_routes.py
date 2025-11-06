from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List
from datetime import datetime
import uuid
from auth import get_current_user
from database import db

router = APIRouter(prefix="/api/recipients", tags=["recipients"])

@router.get("/search")
async def search_recipients(
    q: str = Query(..., min_length=1),
    current_user: dict = Depends(get_current_user)
):
    """
    Kullanıcının kaydedilmiş alıcılarını arar
    """
    try:
        # Kullanıcının alıcılarını isim ile ara
        recipients = await db.saved_recipients.find({
            "userId": current_user["userId"],
            "name": {"$regex": q, "$options": "i"}
        }).sort("usageCount", -1).limit(10).to_list(length=10)
        
        # Convert _id to string
        for recipient in recipients:
            recipient["_id"] = str(recipient["_id"])
        
        return {"recipients": recipients}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Alıcı arama hatası: {str(e)}"
        )

@router.get("/")
async def get_recipients(
    limit: int = Query(50, le=100),
    current_user: dict = Depends(get_current_user)
):
    """
    Kullanıcının tüm kaydedilmiş alıcılarını getirir
    """
    try:
        recipients = await db.saved_recipients.find({
            "userId": current_user["userId"]
        }).sort("lastUsedAt", -1).limit(limit).to_list(length=limit)
        
        # Convert _id to string
        for recipient in recipients:
            recipient["_id"] = str(recipient["_id"])
        
        return {"recipients": recipients}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Alıcı listesi getirme hatası: {str(e)}"
        )

@router.post("/save")
async def save_recipient(
    recipient_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Yeni alıcı kaydeder veya mevcut alıcıyı günceller
    """
    try:
        # Aynı isim, telefon ve adrese sahip alıcı var mı kontrol et
        existing = await db.saved_recipients.find_one({
            "userId": current_user["userId"],
            "name": recipient_data["name"],
            "phone": recipient_data["phone"]
        })
        
        if existing:
            # Mevcut alıcıyı güncelle
            await db.saved_recipients.update_one(
                {"_id": existing["_id"]},
                {
                    "$set": {
                        "city": recipient_data.get("city", existing["city"]),
                        "district": recipient_data.get("district", existing["district"]),
                        "address": recipient_data.get("address", existing["address"]),
                        "lastUsedAt": datetime.utcnow()
                    },
                    "$inc": {"usageCount": 1}
                }
            )
            return {"message": "Alıcı güncellendi", "recipientId": str(existing["_id"])}
        else:
            # Yeni alıcı kaydet
            recipient_id = str(uuid.uuid4())
            recipient = {
                "_id": recipient_id,
                "userId": current_user["_id"],
                "name": recipient_data["name"],
                "phone": recipient_data["phone"],
                "city": recipient_data.get("city", ""),
                "district": recipient_data.get("district", ""),
                "address": recipient_data.get("address", ""),
                "usageCount": 1,
                "lastUsedAt": datetime.utcnow(),
                "createdAt": datetime.utcnow()
            }
            
            await db.saved_recipients.insert_one(recipient)
            return {"message": "Alıcı kaydedildi", "recipientId": recipient_id}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Alıcı kaydetme hatası: {str(e)}"
        )

@router.delete("/{recipient_id}")
async def delete_recipient(
    recipient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Kaydedilmiş alıcıyı siler
    """
    try:
        result = await db.saved_recipients.delete_one({
            "_id": recipient_id,
            "userId": current_user["_id"]
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alıcı bulunamadı"
            )
        
        return {"message": "Alıcı silindi"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Alıcı silme hatası: {str(e)}"
        )
