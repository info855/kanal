from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import socketio
import os
import logging
from pathlib import Path

# Import database
from database import db, client

# Import routes
from routes import auth_routes, order_routes, admin_routes, user_routes, shipping_routes, notification_routes, settings_routes, media_routes, wallet_routes, admin_wallet_routes

# Import socket manager
from socket_manager import sio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI(title="En Ucuza Kargo API", version="1.0.0")

# Mount Socket.IO
socket_app = socketio.ASGIApp(sio, app)

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
app.include_router(settings_routes.router)
app.include_router(media_routes.router)
app.include_router(wallet_routes.router)
app.include_router(admin_wallet_routes.router)

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

# Serve React frontend build files
# In Render, the structure is: /opt/render/project/src/
frontend_build_dir = Path(__file__).parent.parent / "frontend" / "build"

logger.info(f"Looking for frontend build at: {frontend_build_dir}")
logger.info(f"Frontend build exists: {frontend_build_dir.exists()}")

if frontend_build_dir.exists():
    logger.info("Frontend build found! Serving static files...")
    
    # Mount static files (CSS, JS, images)
    static_dir = frontend_build_dir / "static"
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
    
    # Serve other assets
    for asset_dir in ["images", "fonts", "media"]:
        asset_path = frontend_build_dir / asset_dir
        if asset_path.exists():
            app.mount(f"/{asset_dir}", StaticFiles(directory=str(asset_path)), name=asset_dir)
    
    # Serve index.html for all non-API routes (must be last)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # API and Socket.IO routes - skip to FastAPI handlers
        if full_path.startswith("api") or full_path.startswith("socket.io"):
            return None
        
        # Check if file exists in build directory
        file_path = frontend_build_dir / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        
        # For all other routes, serve index.html (React Router)
        index_path = frontend_build_dir / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        else:
            logger.error(f"index.html not found at {index_path}")
            return {"error": "Frontend not built"}
else:
    logger.warning(f"Frontend build directory not found at {frontend_build_dir}")
    logger.warning("Frontend will not be served. Only API endpoints available.")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Export socket_app for uvicorn
application = socket_app