"""
Database connection module
"""
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection with fallback
mongo_url = os.getenv('MONGO_URL', os.getenv('MONGODB_URI', 'mongodb://localhost:27017'))
db_name = os.getenv('DB_NAME', 'kargo_db')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]
