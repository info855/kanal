from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

# User Models
class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    company: str
    taxId: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str = Field(alias="_id")
    role: str = "user"
    balance: float = 0.0
    totalShipments: int = 0
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class UserInDB(User):
    password: str

# Recipient Models
class Recipient(BaseModel):
    name: str
    phone: str
    city: str
    district: str
    address: str

# Location Models
class Location(BaseModel):
    lat: float
    lng: float
    city: str
    district: str

# Timeline Models
class TimelineEvent(BaseModel):
    date: datetime = Field(default_factory=datetime.utcnow)
    status: str
    description: str

# Order Models
class OrderCreate(BaseModel):
    recipientName: str
    recipientPhone: str
    recipientCity: str
    recipientDistrict: str
    recipientAddress: str
    weight: float
    desi: int
    shippingCompanyId: str
    paymentType: str = "prepaid"
    codAmount: Optional[float] = None
    description: Optional[str] = ""

class Order(BaseModel):
    id: str = Field(alias="_id")
    orderId: str
    userId: str
    trackingCode: str
    recipient: Recipient
    shippingCompanyId: str
    shippingCompany: str
    status: str = "created"
    statusText: str = "Sipariş Oluşturuldu"
    weight: float
    desi: int
    price: float
    paymentType: str
    codAmount: Optional[float] = None
    description: Optional[str] = ""
    currentLocation: Optional[Location] = None
    timeline: List[TimelineEvent] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    deliveredAt: Optional[datetime] = None
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}

# Shipping Company Models
class ShippingCompanyCreate(BaseModel):
    name: str
    logo: str
    price: float
    deliveryTime: str

class ShippingCompany(BaseModel):
    id: str = Field(alias="_id")
    name: str
    logo: str
    price: float
    deliveryTime: str
    isActive: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# Notification Models
class NotificationCreate(BaseModel):
    userId: str
    type: str
    title: str
    message: str

class Notification(BaseModel):
    id: str = Field(alias="_id")
    userId: str
    type: str
    title: str
    message: str
    read: bool = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# Stats Model
class Stats(BaseModel):
    totalShipments: int
    activeShipments: int
    deliveredShipments: int
    totalRevenue: float
    monthlyGrowth: float
    averageDeliveryTime: float
    customerSatisfaction: float

# Token Models
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None

# Update Balance
class BalanceUpdate(BaseModel):
    amount: float

# Update Status
class StatusUpdate(BaseModel):
    status: str
    location: Optional[Location] = None
