from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from models import ShippingCompanyCreate, ShippingCompanyUpdate
from auth import get_current_admin
from datetime import datetime

router = APIRouter(prefix="/api/shipping-companies", tags=["shipping-companies"])

from database import db

@router.get("", response_model=dict)
async def get_shipping_companies(include_inactive: bool = False):
    query = {} if include_inactive else {"isActive": True}
    companies_cursor = db.shipping_companies.find(query)
    companies = await companies_cursor.to_list(length=100)
    
    for company in companies:
        company["_id"] = str(company["_id"])
    
    return {"companies": companies}

@router.get("/{company_id}", response_model=dict)
async def get_shipping_company(company_id: str):
    company = await db.shipping_companies.find_one({"_id": ObjectId(company_id)})
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kargo firması bulunamadı"
        )
    
    company["_id"] = str(company["_id"])
    return {"company": company}

@router.post("", response_model=dict)
async def create_shipping_company(
    company_data: ShippingCompanyCreate,
    current_user: dict = Depends(get_current_admin)
):
    company_dict = company_data.model_dump()
    company_dict["isActive"] = True
    company_dict["createdAt"] = datetime.utcnow()
    
    result = await db.shipping_companies.insert_one(company_dict)
    company_dict["_id"] = str(result.inserted_id)
    
    return {
        "success": True,
        "company": company_dict
    }

@router.put("/{company_id}", response_model=dict)
async def update_shipping_company(
    company_id: str,
    company_data: ShippingCompanyUpdate,
    current_user: dict = Depends(get_current_admin)
):
    update_dict = company_data.model_dump(exclude_unset=True)
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Güncellenecek alan belirtilmedi"
        )
    
    result = await db.shipping_companies.update_one(
        {"_id": ObjectId(company_id)},
        {"$set": update_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kargo firması bulunamadı"
        )
    
    company = await db.shipping_companies.find_one({"_id": ObjectId(company_id)})
    company["_id"] = str(company["_id"])
    
    return {
        "success": True,
        "company": company
    }

@router.delete("/{company_id}", response_model=dict)
async def delete_shipping_company(
    company_id: str,
    current_user: dict = Depends(get_current_admin)
):
    result = await db.shipping_companies.delete_one({"_id": ObjectId(company_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kargo firması bulunamadı"
        )
    
    return {"success": True, "message": "Kargo firması silindi"}
