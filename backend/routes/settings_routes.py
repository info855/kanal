from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from bson import ObjectId
from models import SiteSettings, SiteSettingsUpdate
from auth import get_current_admin
from datetime import datetime
import os
import shutil
from pathlib import Path

router = APIRouter(prefix="/api/settings", tags=["settings"])

from database import db

# Get site settings (public)
@router.get("", response_model=dict)
async def get_settings():
    try:
        settings = await db.site_settings.find_one({})
        
        if not settings:
            # Return default settings
            default_settings = SiteSettings()
            return {"settings": default_settings.model_dump()}
        
        settings["_id"] = str(settings["_id"])
        
        # Convert datetime objects to strings if present
        if "updatedAt" in settings and isinstance(settings["updatedAt"], datetime):
            settings["updatedAt"] = settings["updatedAt"].isoformat()
        
        return {"settings": settings}
    except Exception as e:
        print(f"Error in get_settings: {str(e)}")
        # Return default settings on error
        default_settings = SiteSettings()
        return {"settings": default_settings.model_dump()}

# Update site settings (admin only)
@router.put("", response_model=dict)
async def update_settings(
    settings_update: SiteSettingsUpdate,
    current_user: dict = Depends(get_current_admin)
):
    try:
        # Get existing settings
        existing = await db.site_settings.find_one({})
        
        # Prepare update data
        update_data = settings_update.model_dump(exclude_unset=True)
        update_data["updatedAt"] = datetime.utcnow().isoformat()
        
        if existing:
            # Update existing
            await db.site_settings.update_one(
                {"_id": existing["_id"]},
                {"$set": update_data}
            )
        else:
            # Create new
            default_settings = SiteSettings()
            settings_dict = default_settings.model_dump()
            settings_dict.update(update_data)
            settings_dict["updatedAt"] = datetime.utcnow().isoformat()
            await db.site_settings.insert_one(settings_dict)
        
        # Return updated settings
        updated = await db.site_settings.find_one({})
        updated["_id"] = str(updated["_id"])
        
        # Convert datetime to string if present
        if "updatedAt" in updated and isinstance(updated["updatedAt"], datetime):
            updated["updatedAt"] = updated["updatedAt"].isoformat()
        
        return {"success": True, "settings": updated}
    except Exception as e:
        print(f"Error in update_settings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ayarlar güncellenirken hata oluştu: {str(e)}"
        )

# Upload logo (admin only)
@router.post("/logo", response_model=dict)
async def upload_logo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_admin)
):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sadece resim dosyaları yüklenebilir"
        )
    
    # Create uploads directory if not exists
    upload_dir = Path("/app/frontend/public/uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    filename = f"logo_{datetime.utcnow().timestamp()}.{file_extension}"
    file_path = upload_dir / filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Return public URL
    logo_url = f"/uploads/{filename}"
    
    return {"success": True, "logoUrl": logo_url}
