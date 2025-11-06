from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict
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

# Saved Recipient Models (for autocomplete)
class SavedRecipient(BaseModel):
    id: str = Field(alias="_id")
    userId: str
    name: str
    phone: str
    city: str
    district: str
    address: str
    usageCount: int = 0
    lastUsedAt: datetime = Field(default_factory=datetime.utcnow)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

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

class ShippingCompanyUpdate(BaseModel):
    name: Optional[str] = None
    logo: Optional[str] = None
    price: Optional[float] = None
    deliveryTime: Optional[str] = None
    isActive: Optional[bool] = None

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

# Site Settings Models
class ColorScheme(BaseModel):
    primary: str = "#DB2777"  # Pink
    secondary: str = "#10B981"  # Green
    accent: str = "#3B82F6"  # Blue
    background: str = "#FFFFFF"  # White
    text: str = "#1F2937"  # Gray

class ContactInfo(BaseModel):
    phone: str = "0850 308 52 94"
    email: str = "info@enucuzakargo.com"
    address: str = ""
    facebook: str = ""
    twitter: str = ""
    instagram: str = ""
    linkedin: str = ""

class HeroContent(BaseModel):
    title: str = "Tüm Kargo Firmaları tek platformda"
    subtitle: str = "Hala kargo firmaları ile tek tek anlaşma mı yapıyorsunuz? En Ucuza Kargo tüm kargo hizmetlerini tek platformda toplayarak en iyi fiyatları sunuyor!"
    buttonText: str = "Ücretsiz Kayıt Ol"

class Feature(BaseModel):
    icon: str
    imageUrl: Optional[str] = None  # For custom uploaded images
    title: str
    description: str

class HowItWorksStep(BaseModel):
    icon: Optional[str] = None  # For icon selection
    imageUrl: Optional[str] = None  # For custom uploaded images
    title: str
    description: str

class FAQItem(BaseModel):
    question: str
    answer: str

class FooterLink(BaseModel):
    title: str
    url: str

class FooterSection(BaseModel):
    title: str
    links: List[FooterLink]

class BankInfo(BaseModel):
    bankName: str = ""
    accountHolder: str = ""
    iban: str = ""
    accountNumber: str = ""
    branchCode: str = ""
    description: str = ""

class SiteSettings(BaseModel):
    siteName: str = "En Ucuza Kargo"
    logo: str = ""
    tagline: str = "Kargo yönetiminde yeni nesil çözümler"
    description: str = "Tek üyelikle tüm kargo firmalarıyla çalışın, uygun fiyatlarla kargo gönderin"
    colors: ColorScheme = ColorScheme()
    contact: ContactInfo = ContactInfo()
    hero: HeroContent = HeroContent()
    features: List[Feature] = []
    howItWorks: List[HowItWorksStep] = []
    faqs: List[FAQItem] = []
    footerSections: List[FooterSection] = []
    aboutPage: str = ""
    bankInfo: BankInfo = BankInfo()
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class SiteSettingsUpdate(BaseModel):
    siteName: Optional[str] = None
    logo: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    colors: Optional[ColorScheme] = None
    contact: Optional[ContactInfo] = None
    hero: Optional[HeroContent] = None
    features: Optional[List[Feature]] = None
    howItWorks: Optional[List[HowItWorksStep]] = None
    faqs: Optional[List[FAQItem]] = None
    footerSections: Optional[List[FooterSection]] = None
    aboutPage: Optional[str] = None
    bankInfo: Optional[BankInfo] = None

# Pricing Models
class PricingRow(BaseModel):
    desi: str
    prices: Dict[str, float]  # {"companyId": price}

class PricingTable(BaseModel):
    id: str = Field(alias="_id")
    rows: List[PricingRow]
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class PricingTableUpdate(BaseModel):
    rows: List[PricingRow]

# Wallet Models
class Transaction(BaseModel):
    id: str = Field(alias="_id")
    userId: str
    type: str  # 'deposit', 'payment', 'refund', 'admin_adjustment'
    amount: float
    balanceBefore: float
    balanceAfter: float
    description: str
    orderId: Optional[str] = None  # For payment transactions
    depositRequestId: Optional[str] = None  # For deposit transactions
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class DepositRequest(BaseModel):
    id: str = Field(alias="_id")
    userId: str
    userName: str
    userEmail: str
    amount: float
    senderName: str
    description: str  # User's reference code (e.g., KARGO-USER123)
    paymentDate: Optional[datetime] = None
    status: str = "pending"  # 'pending', 'approved', 'rejected'
    adminNote: Optional[str] = None
    approvedBy: Optional[str] = None  # Admin user ID
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class DepositRequestCreate(BaseModel):
    amount: float
    senderName: str
    description: str
    paymentDate: Optional[datetime] = None

class DepositRequestApprove(BaseModel):
    adminNote: Optional[str] = None

class ManualBalanceAdjustment(BaseModel):
    userId: str
    amount: float  # Can be positive or negative
    description: str


# Chat Models
class ChatSession(BaseModel):
    id: str = Field(alias="_id")
    userId: str
    userName: str
    userEmail: str
    agentId: Optional[str] = None
    agentName: Optional[str] = None
    status: str = "waiting"  # 'waiting', 'active', 'closed'
    startedAt: datetime = Field(default_factory=datetime.utcnow)
    endedAt: Optional[datetime] = None
    lastMessageAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class ChatMessage(BaseModel):
    id: str = Field(alias="_id")
    sessionId: str
    sender: str  # 'user', 'agent', 'bot'
    senderName: str
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class ChatMessageCreate(BaseModel):
    sessionId: str
    text: str
