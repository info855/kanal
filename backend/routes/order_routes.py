from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from bson import ObjectId
from models import OrderCreate, Order, TimelineEvent, Recipient, Location
from auth import get_current_user
from utils import generate_order_id, generate_tracking_code, get_status_text, get_default_location
from datetime import datetime

router = APIRouter(prefix="/api/orders", tags=["orders"])

from database import db

@router.post("", response_model=dict)
async def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    # Get shipping company
    shipping_company = await db.shipping_companies.find_one({"_id": ObjectId(order_data.shippingCompanyId)})
    if not shipping_company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kargo firması bulunamadı"
        )
    
    # Get user
    user = await db.users.find_one({"_id": ObjectId(current_user["userId"])})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı"
        )
    
    # Check balance for prepaid orders
    if order_data.paymentType == "prepaid":
        if user.get("balance", 0) < shipping_company["price"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Yetersiz bakiye"
            )
    
    # Generate order ID and tracking code
    order_id = generate_order_id()
    tracking_code = generate_tracking_code()
    
    # Get location coordinates
    location_coords = get_default_location(order_data.recipientCity)
    
    # Create order document
    order_dict = {
        "orderId": order_id,
        "userId": current_user["userId"],
        "trackingCode": tracking_code,
        "recipient": {
            "name": order_data.recipientName,
            "phone": order_data.recipientPhone,
            "city": order_data.recipientCity,
            "district": order_data.recipientDistrict,
            "address": order_data.recipientAddress
        },
        "shippingCompanyId": order_data.shippingCompanyId,
        "shippingCompany": shipping_company["name"],
        "status": "created",
        "statusText": "Sipariş Oluşturuldu",
        "weight": order_data.weight,
        "desi": order_data.desi,
        "price": shipping_company["price"],
        "paymentType": order_data.paymentType,
        "codAmount": order_data.codAmount,
        "description": order_data.description,
        "currentLocation": {
            "lat": location_coords["lat"],
            "lng": location_coords["lng"],
            "city": order_data.recipientCity,
            "district": order_data.recipientDistrict
        },
        "timeline": [
            {
                "date": datetime.utcnow(),
                "status": "created",
                "description": "Sipariş oluşturuldu"
            }
        ],
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    # Insert order
    result = await db.orders.insert_one(order_dict)
    order_dict["_id"] = str(result.inserted_id)
    
    # Update user balance and shipment count
    if order_data.paymentType == "prepaid":
        await db.users.update_one(
            {"_id": ObjectId(current_user["userId"])},
            {
                "$inc": {"balance": -shipping_company["price"], "totalShipments": 1}
            }
        )
    else:
        await db.users.update_one(
            {"_id": ObjectId(current_user["userId"])},
            {"$inc": {"totalShipments": 1}}
        )
    
    # Create notification
    await db.notifications.insert_one({
        "userId": current_user["userId"],
        "type": "success",
        "title": "Yeni Gönderi Oluşturuldu",
        "message": f"{order_id} numaralı gönderiniz oluşturuldu. Takip kodu: {tracking_code}",
        "read": False,
        "createdAt": datetime.utcnow()
    })
    
    return {
        "success": True,
        "order": order_dict
    }

@router.get("", response_model=dict)
async def get_orders(
    current_user: dict = Depends(get_current_user),
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    skip = (page - 1) * limit
    
    # Build query
    query = {"userId": current_user["userId"]}
    if status:
        query["status"] = status
    
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

@router.get("/{order_id}", response_model=dict)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    # Find by orderId or _id
    order = await db.orders.find_one({
        "$or": [
            {"orderId": order_id},
            {"_id": ObjectId(order_id) if ObjectId.is_valid(order_id) else None}
        ],
        "userId": current_user["userId"]
    })
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sipariş bulunamadı"
        )
    
    order["_id"] = str(order["_id"])
    
    return {"order": order}

@router.get("/tracking/{tracking_code}", response_model=dict)
async def track_order(tracking_code: str):
    order = await db.orders.find_one({"trackingCode": tracking_code})
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gönderi bulunamadı"
        )
    
    order["_id"] = str(order["_id"])
    
    return {"order": order}
