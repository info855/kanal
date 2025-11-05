from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from typing import List
from bson import ObjectId
from auth import get_current_admin
from datetime import datetime
import os
import shutil
from pathlib import Path

router = APIRouter(prefix="/api/media", tags=["media"])

from database import db

# Upload multiple images
@router.post("/upload", response_model=dict)
async def upload_media(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_admin)
):
    uploaded_files = []
    
    # Create uploads directory
    upload_dir = Path("/app/frontend/public/uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    for file in files:
        # Validate file type
        if not file.content_type.startswith("image/"):
            continue
        
        # Generate unique filename
        file_extension = file.filename.split(".")[-1]
        filename = f"media_{datetime.utcnow().timestamp()}.{file_extension}"
        file_path = upload_dir / filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Save to database
        media_doc = {
            "filename": filename,
            "originalName": file.filename,
            "url": f"/uploads/{filename}",
            "size": file_size,
            "type": file.content_type,
            "uploadedBy": current_user["userId"],
            "createdAt": datetime.utcnow()
        }
        
        result = await db.media.insert_one(media_doc)
        media_doc["_id"] = str(result.inserted_id)
        uploaded_files.append(media_doc)
    
    return {
        "success": True,
        "files": uploaded_files
    }

# Get all media
@router.get("", response_model=dict)
async def get_media(
    page: int = 1,
    limit: int = 50,
    current_user: dict = Depends(get_current_admin)
):
    skip = (page - 1) * limit
    
    media_cursor = db.media.find().sort("createdAt", -1).skip(skip).limit(limit)
    media_files = await media_cursor.to_list(length=limit)
    
    total = await db.media.count_documents({})
    
    for media in media_files:
        media["_id"] = str(media["_id"])
    
    return {
        "media": media_files,
        "total": total,
        "page": page,
        "totalPages": (total + limit - 1) // limit
    }

# Delete media
@router.delete("/{media_id}", response_model=dict)
async def delete_media(
    media_id: str,
    current_user: dict = Depends(get_current_admin)
):
    # Get media document
    media = await db.media.find_one({"_id": ObjectId(media_id)})
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medya bulunamadı"
        )
    
    # Delete file from disk
    file_path = Path(f"/app/frontend/public{media['url']}")
    if file_path.exists():
        file_path.unlink()
    
    # Delete from database
    await db.media.delete_one({"_id": ObjectId(media_id)})
    
    return {"success": True, "message": "Medya silindi"}
