from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import datetime
from bson import ObjectId
from models import DepositRequestApprove, ManualBalanceAdjustment, Transaction
from auth import get_current_admin
from database import db
import uuid

router = APIRouter(prefix="/api/admin/wallet", tags=["admin-wallet"])

# Get all deposit requests
@router.get("/deposit-requests", response_model=dict)
async def get_all_deposit_requests(
    status_filter: str = "pending",  # 'pending', 'approved', 'rejected', 'all'
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_admin)
):
    skip = (page - 1) * limit
    
    query = {} if status_filter == "all" else {"status": status_filter}
    
    requests_cursor = db.deposit_requests.find(query).sort("createdAt", -1).skip(skip).limit(limit)
    requests = await requests_cursor.to_list(length=limit)
    total = await db.deposit_requests.count_documents(query)
    
    for req in requests:
        req["_id"] = str(req["_id"])
    
    return {
        "requests": requests,
        "total": total,
        "page": page,
        "totalPages": (total + limit - 1) // limit
    }

# Approve deposit request
@router.post("/approve-deposit/{request_id}", response_model=dict)
async def approve_deposit_request(
    request_id: str,
    approval: DepositRequestApprove,
    current_user: dict = Depends(get_current_admin)
):
    # Get deposit request
    deposit_request = await db.deposit_requests.find_one({"_id": request_id})
    if not deposit_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ödeme bildirimi bulunamadı"
        )
    
    if deposit_request["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu bildirim zaten işleme alınmış"
        )
    
    # Get user
    from bson import ObjectId
    user = await db.users.find_one({"_id": ObjectId(deposit_request["userId"])})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    old_balance = user.get("balance", 0.0)
    new_balance = old_balance + deposit_request["amount"]
    
    # Update user balance
    await db.users.update_one(
        {"_id": ObjectId(deposit_request["userId"])},
        {"$set": {"balance": new_balance}}
    )
    
    # Create transaction record
    transaction = {
        "_id": str(uuid.uuid4()),
        "userId": deposit_request["userId"],
        "type": "deposit",
        "amount": deposit_request["amount"],
        "balanceBefore": old_balance,
        "balanceAfter": new_balance,
        "description": f"Ödeme bildirimi onaylandı - {deposit_request['description']}",
        "depositRequestId": request_id,
        "createdAt": datetime.utcnow()
    }
    await db.transactions.insert_one(transaction)
    
    # Update deposit request
    await db.deposit_requests.update_one(
        {"_id": request_id},
        {
            "$set": {
                "status": "approved",
                "adminNote": approval.adminNote,
                "approvedBy": current_user["userId"],
                "updatedAt": datetime.utcnow()
            }
        }
    )
    
    # TODO: Send email notification to user
    # send_email(user["email"], "Ödeme Onayı", f"{deposit_request['amount']} TL bakiyenize yüklendi")
    
    return {
        "success": True,
        "message": "Ödeme onaylandı ve bakiye yüklendi",
        "newBalance": new_balance
    }

# Reject deposit request
@router.post("/reject-deposit/{request_id}", response_model=dict)
async def reject_deposit_request(
    request_id: str,
    approval: DepositRequestApprove,
    current_user: dict = Depends(get_current_admin)
):
    # Get deposit request
    deposit_request = await db.deposit_requests.find_one({"_id": request_id})
    if not deposit_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ödeme bildirimi bulunamadı"
        )
    
    if deposit_request["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu bildirim zaten işleme alınmış"
        )
    
    # Update deposit request
    await db.deposit_requests.update_one(
        {"_id": request_id},
        {
            "$set": {
                "status": "rejected",
                "adminNote": approval.adminNote or "Ödeme onaylanmadı",
                "approvedBy": current_user["userId"],
                "updatedAt": datetime.utcnow()
            }
        }
    )
    
    return {
        "success": True,
        "message": "Ödeme bildirimi reddedildi"
    }

# Manual balance adjustment
@router.post("/manual-balance", response_model=dict)
async def manual_balance_adjustment(
    adjustment: ManualBalanceAdjustment,
    current_user: dict = Depends(get_current_admin)
):
    # Get user
    user = await db.users.find_one({"_id": ObjectId(adjustment.userId)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    old_balance = user.get("balance", 0.0)
    new_balance = old_balance + adjustment.amount
    
    if new_balance < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bakiye negatif olamaz"
        )
    
    # Update user balance
    await db.users.update_one(
        {"_id": ObjectId(adjustment.userId)},
        {"$set": {"balance": new_balance}}
    )
    
    # Create transaction record
    transaction = {
        "_id": str(uuid.uuid4()),
        "userId": adjustment.userId,
        "type": "admin_adjustment",
        "amount": adjustment.amount,
        "balanceBefore": old_balance,
        "balanceAfter": new_balance,
        "description": f"Admin düzeltmesi: {adjustment.description}",
        "createdAt": datetime.utcnow()
    }
    await db.transactions.insert_one(transaction)
    
    return {
        "success": True,
        "message": "Bakiye güncellendi",
        "oldBalance": old_balance,
        "newBalance": new_balance
    }

# Get user transactions (admin view)
@router.get("/user-transactions/{user_id}", response_model=dict)
async def get_user_transactions(
    user_id: str,
    page: int = 1,
    limit: int = 50,
    current_user: dict = Depends(get_current_admin)
):
    skip = (page - 1) * limit
    
    transactions_cursor = db.transactions.find(
        {"userId": user_id}
    ).sort("createdAt", -1).skip(skip).limit(limit)
    
    transactions = await transactions_cursor.to_list(length=limit)
    total = await db.transactions.count_documents({"userId": user_id})
    
    for transaction in transactions:
        transaction["_id"] = str(transaction["_id"])
    
    # Get user info
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    return {
        "transactions": transactions,
        "total": total,
        "page": page,
        "totalPages": (total + limit - 1) // limit,
        "user": {
            "id": user_id,
            "name": user.get("name", "") if user else "",
            "email": user.get("email", "") if user else "",
            "balance": user.get("balance", 0.0) if user else 0.0
        }
    }
