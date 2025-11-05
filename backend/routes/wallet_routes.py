from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime
from models import DepositRequestCreate, DepositRequest, Transaction
from auth import get_current_user
from database import db
import uuid

router = APIRouter(prefix="/api/wallet", tags=["wallet"])

MINIMUM_BALANCE = 100.0  # Minimum balance requirement

# Get user balance
@router.get("/balance", response_model=dict)
async def get_balance(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"_id": current_user["userId"]})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    return {
        "balance": user.get("balance", 0.0),
        "minimumBalance": MINIMUM_BALANCE,
        "canCreateShipment": user.get("balance", 0.0) >= MINIMUM_BALANCE
    }

# Get user transactions
@router.get("/transactions", response_model=dict)
async def get_transactions(
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    skip = (page - 1) * limit
    
    transactions_cursor = db.transactions.find(
        {"userId": current_user["userId"]}
    ).sort("createdAt", -1).skip(skip).limit(limit)
    
    transactions = await transactions_cursor.to_list(length=limit)
    total = await db.transactions.count_documents({"userId": current_user["userId"]})
    
    for transaction in transactions:
        transaction["_id"] = str(transaction["_id"])
    
    return {
        "transactions": transactions,
        "total": total,
        "page": page,
        "totalPages": (total + limit - 1) // limit
    }

# Create deposit request
@router.post("/deposit-request", response_model=dict)
async def create_deposit_request(
    request: DepositRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    # Validate amount
    if request.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz tutar"
        )
    
    # Get user info
    user = await db.users.find_one({"_id": current_user["userId"]})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    # Create deposit request
    deposit_request = {
        "_id": str(uuid.uuid4()),
        "userId": current_user["userId"],
        "userName": user.get("name", ""),
        "userEmail": user.get("email", ""),
        "amount": request.amount,
        "senderName": request.senderName,
        "description": request.description,
        "paymentDate": request.paymentDate or datetime.utcnow(),
        "status": "pending",
        "adminNote": None,
        "approvedBy": None,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    await db.deposit_requests.insert_one(deposit_request)
    
    return {
        "success": True,
        "message": "Ödeme bildirimi gönderildi. Admin onayından sonra bakiyenize yansıyacaktır.",
        "depositRequest": deposit_request
    }

# Get user's deposit requests
@router.get("/deposit-requests", response_model=dict)
async def get_deposit_requests(
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    skip = (page - 1) * limit
    
    requests_cursor = db.deposit_requests.find(
        {"userId": current_user["userId"]}
    ).sort("createdAt", -1).skip(skip).limit(limit)
    
    requests = await requests_cursor.to_list(length=limit)
    total = await db.deposit_requests.count_documents({"userId": current_user["userId"]})
    
    for req in requests:
        req["_id"] = str(req["_id"])
    
    return {
        "requests": requests,
        "total": total,
        "page": page,
        "totalPages": (total + limit - 1) // limit
    }
