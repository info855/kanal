from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from models import ShippingCompanyCreate
from auth import get_current_admin
from datetime import datetime

router = APIRouter(prefix="/api/shipping-companies", tags=["shipping-companies"])

from database import db

@router.get("", response_model=dict)
async def get_shipping_companies():
    companies_cursor = db.shipping_companies.find({"isActive": True})
    companies = await companies_cursor.to_list(length=100)
    
    for company in companies:
        company["_id"] = str(company["_id"])
    
    return {"companies": companies}

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
