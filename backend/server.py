from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path

# Import database
from database import db, client

# Import routes
from routes import auth_routes, order_routes, admin_routes, user_routes, shipping_routes, notification_routes

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI(title="En Ucuza Kargo API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Health check endpoint
@api_router.get("/")
async def root():
    return {"message": "En Ucuza Kargo API is running", "version": "1.0.0"}

# Include all routers
app.include_router(auth_routes.router)
app.include_router(order_routes.router)
app.include_router(admin_routes.router)
app.include_router(user_routes.router)
app.include_router(shipping_routes.router)
app.include_router(notification_routes.router)

# Include the main api router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()