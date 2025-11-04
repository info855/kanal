"""
Seed data script to initialize the database with shipping companies and admin user
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from auth import get_password_hash
from datetime import datetime
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def seed_database():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🌱 Starting database seeding...")
    
    # Check if shipping companies already exist
    existing_companies = await db.shipping_companies.count_documents({})
    if existing_companies == 0:
        print("📦 Adding shipping companies...")
        shipping_companies = [
            {
                "name": "PTT Kargo",
                "logo": "https://cdn.enucuzakargo.com/kargo-firmalari/ptt-kargo.png",
                "price": 79.96,
                "deliveryTime": "2-3 gün",
                "isActive": True,
                "createdAt": datetime.utcnow()
            },
            {
                "name": "Aras Kargo",
                "logo": "https://cdn.enucuzakargo.com/kargo-firmalari/aras-kargo.png",
                "price": 85.50,
                "deliveryTime": "1-2 gün",
                "isActive": True,
                "createdAt": datetime.utcnow()
            },
            {
                "name": "Yurtiçi Kargo",
                "logo": "https://cdn.enucuzakargo.com/kargo-firmalari/yurtici-kargo.png",
                "price": 82.30,
                "deliveryTime": "2-3 gün",
                "isActive": True,
                "createdAt": datetime.utcnow()
            },
            {
                "name": "MNG Kargo",
                "logo": "https://cdn.enucuzakargo.com/kargo-firmalari/mng-kargo.png",
                "price": 78.90,
                "deliveryTime": "2-4 gün",
                "isActive": True,
                "createdAt": datetime.utcnow()
            },
            {
                "name": "Sürat Kargo",
                "logo": "https://cdn.enucuzakargo.com/kargo-firmalari/surat-kargo.png",
                "price": 89.00,
                "deliveryTime": "1-2 gün",
                "isActive": True,
                "createdAt": datetime.utcnow()
            },
            {
                "name": "HepsiJet",
                "logo": "https://cdn.enucuzakargo.com/kargo-firmalari/hepsijet.png",
                "price": 91.20,
                "deliveryTime": "1-2 gün",
                "isActive": True,
                "createdAt": datetime.utcnow()
            }
        ]
        await db.shipping_companies.insert_many(shipping_companies)
        print(f"✅ Added {len(shipping_companies)} shipping companies")
    else:
        print(f"ℹ️  Shipping companies already exist ({existing_companies} found)")
    
    # Check if admin user exists
    admin_exists = await db.users.find_one({"email": "admin@enucuzakargo.com"})
    if not admin_exists:
        print("👤 Creating admin user...")
        admin_user = {
            "name": "Admin User",
            "email": "admin@enucuzakargo.com",
            "password": get_password_hash("admin123"),
            "phone": "+90 534 333 44 55",
            "company": "En Ucuza Kargo",
            "taxId": "0000000000",
            "role": "admin",
            "balance": 0.0,
            "totalShipments": 0,
            "createdAt": datetime.utcnow()
        }
        await db.users.insert_one(admin_user)
        print("✅ Admin user created")
        print("   Email: admin@enucuzakargo.com")
        print("   Password: admin123")
    else:
        print("ℹ️  Admin user already exists")
    
    # Create indexes
    print("📑 Creating indexes...")
    await db.users.create_index("email", unique=True)
    await db.orders.create_index("orderId", unique=True)
    await db.orders.create_index("trackingCode", unique=True)
    await db.orders.create_index("userId")
    await db.notifications.create_index("userId")
    print("✅ Indexes created")
    
    print("🎉 Database seeding completed!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
