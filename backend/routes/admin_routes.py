from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from bson import ObjectId
from models import StatusUpdate
from auth import get_current_admin
from utils import get_status_text
from datetime import datetime

router = APIRouter(prefix="/api/admin", tags=["admin"])

from server import db

@router.get("/stats", response_model=dict)
async def get_stats(current_user: dict = Depends(get_current_admin)):
    # Get total shipments
    total_shipments = await db.orders.count_documents({})
    
    # Get active shipments
    active_shipments = await db.orders.count_documents({
        "status": {"$in": ["created", "picked", "in_transit", "out_for_delivery"]}
    })
    
    # Get delivered shipments
    delivered_shipments = await db.orders.count_documents({"status": "delivered"})
    
    # Calculate total revenue
    pipeline = [
        {"$match": {"paymentType": "prepaid"}},
        {"$group": {"_id": None, "total": {"$sum": "$price"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Get user count
    total_users = await db.users.count_documents({"role": "user"})
    
    return {
        "totalShipments": total_shipments,
        "activeShipments": active_shipments,
        "deliveredShipments": delivered_shipments,
        "totalRevenue": total_revenue,
        "totalUsers": total_users,
        "monthlyGrowth": 15.3,
        "averageDeliveryTime": 2.4,
        "customerSatisfaction": 4.7
    }

@router.get("/orders", response_model=dict)
async def get_all_orders(
    current_user: dict = Depends(get_current_admin),
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    skip = (page - 1) * limit
    
    # Build query
    query = {}
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"orderId": {"$regex": search, "$options": "i"}},
            {"trackingCode": {"$regex": search, "$options": "i"}},
            {"recipient.name": {"$regex": search, "$options": "i"}}
        ]
    
    # Get orders
    orders_cursor = db.orders.find(query).sort("createdAt", -1).skip(skip).limit(limit)
    orders = await orders_cursor.to_list(length=limit)
    
    # Get total count
    total = await db.orders.count_documents(query)
    
    # Convert ObjectId to string
    for order in orders:
        order["_id"] = str(order["_id"])
    
    return {
        "orders": orders,
        "total": total,
        "page": page,
        "totalPages": (total + limit - 1) // limit
    }

@router.get("/users", response_model=dict)
async def get_all_users(
    current_user: dict = Depends(get_current_admin),
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    skip = (page - 1) * limit
    
    # Build query
    query = {"role": "user"}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"company": {"$regex": search, "$options": "i"}}
        ]
    
    # Get users
    users_cursor = db.users.find(query, {"password": 0}).sort("createdAt", -1).skip(skip).limit(limit)
    users = await users_cursor.to_list(length=limit)
    
    # Get total count
    total = await db.users.count_documents(query)
    
    # Convert ObjectId to string
    for user in users:
        user["_id"] = str(user["_id"])
    
    return {
        "users": users,
        "total": total,
        "page": page,
        "totalPages": (total + limit - 1) // limit
    }

@router.put("/orders/{order_id}/status", response_model=dict)
async def update_order_status(
    order_id: str,
    status_update: StatusUpdate,
    current_user: dict = Depends(get_current_admin)
):
    # Find order
    order = await db.orders.find_one({"orderId": order_id})
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sipariş bulunamadı"
        )
    
    # Update status
    status_text = get_status_text(status_update.status)
    update_data = {
        "status": status_update.status,
        "statusText": status_text,
        "updatedAt": datetime.utcnow()
    }
    
    # Update location if provided
    if status_update.location:
        update_data["currentLocation"] = status_update.location.model_dump()
    
    # Add to timeline
    timeline_event = {
        "date": datetime.utcnow(),
        "status": status_update.status,
        "description": status_text
    }
    
    # Update order
    await db.orders.update_one(
        {"orderId": order_id},
        {
            "$set": update_data,
            "$push": {"timeline": timeline_event}
        }
    )
    
    # If delivered, update deliveredAt
    if status_update.status == "delivered":
        await db.orders.update_one(
            {"orderId": order_id},
            {"$set": {"deliveredAt": datetime.utcnow()}}
        )
    
    # Create notification
    await db.notifications.insert_one({
        "userId": order["userId"],
        "type": "info" if status_update.status != "delivered" else "success",
        "title": status_text,
        "message": f"{order_id} numaralı gönderiniz: {status_text}",
        "read": False,
        "createdAt": datetime.utcnow()
    })
    
    return {"success": True, "message": "Durum güncellendi"}
