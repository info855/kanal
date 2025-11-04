from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import UserCreate, UserLogin, User, Token
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from datetime import timedelta
import os

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Database dependency
from server import db

@router.post("/register", response_model=dict)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email zaten kayıtlı"
        )
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user document
    user_dict = user_data.model_dump()
    user_dict["password"] = hashed_password
    user_dict["role"] = "user"
    user_dict["balance"] = 0.0
    user_dict["totalShipments"] = 0
    
    # Insert user
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)
    
    # Create token
    access_token = create_access_token(
        data={"sub": user_data.email, "userId": str(result.inserted_id), "role": "user"}
    )
    
    # Remove password from response
    user_dict.pop("password")
    
    return {
        "success": True,
        "user": user_dict,
        "token": access_token
    }

@router.post("/login", response_model=dict)
async def login(credentials: UserLogin):
    # Find user
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz email veya şifre"
        )
    
    # Verify password
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz email veya şifre"
        )
    
    # Create token
    access_token = create_access_token(
        data={"sub": user["email"], "userId": str(user["_id"]), "role": user.get("role", "user")}
    )
    
    # Remove password from response
    user.pop("password")
    user["_id"] = str(user["_id"])
    
    return {
        "success": True,
        "user": user,
        "token": access_token
    }

@router.get("/me", response_model=dict)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"email": current_user["email"]})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    user.pop("password")
    user["_id"] = str(user["_id"])
    
    return {"user": user}
