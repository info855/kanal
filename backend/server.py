from fastapi import FastAPI, APIRouter
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import socketio
import os
import logging
from pathlib import Path

# Import database
from database import db, client

# Import routes
from routes import (
    auth_routes, 
    order_routes, 
    admin_routes, 
    user_routes, 
    shipping_routes, 
    notification_routes, 
    settings_routes, 
    media_routes, 
    wallet_routes, 
    admin_wallet_routes,
    recipient_routes
)

# Import socket manager
from socket_manager import sio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create the main app
app = FastAPI(title="En Ucuza Kargo API", version="1.0.0")

# Root endpoint (for testing)
@app.get("/api/")
async def api_root():
    return {
        "message": "En Ucuza Kargo API",
        "version": "1.0.0",
        "status": "running"
    }

# Mount Socket.IO
socket_app = socketio.ASGIApp(sio, app)

# CORS Middleware
cors_origins = os.getenv('CORS_ORIGINS', '*')
if cors_origins != '*':
    cors_origins = cors_origins.split(',')

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if isinstance(cors_origins, list) else [cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers with /api prefix
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
app.include_router(recipient_routes.router)

# Serve React frontend build files
frontend_build_dir = Path(__file__).parent.parent / "frontend" / "build"

logger.info(f"Looking for frontend build at: {frontend_build_dir}")
logger.info(f"Frontend build exists: {frontend_build_dir.exists()}")

if frontend_build_dir.exists():
    logger.info("✅ Frontend build found! Serving static files...")
    
    # Mount static files (CSS, JS, images)
    static_dir = frontend_build_dir / "static"
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
        logger.info("✅ Mounted /static directory")
    
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
            logger.error(f"❌ index.html not found at {index_path}")
            return {"error": "Frontend build incomplete"}
else:
    logger.warning(f"⚠️ Frontend build directory not found at {frontend_build_dir}")
    logger.warning("Frontend will not be served. Only API endpoints available.")
    
    # Fallback: Serve a simple HTML page
    @app.get("/", response_class=HTMLResponse)
    async def root_fallback():
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>En Ucuza Kargo</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .container {
                    text-align: center;
                    padding: 40px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                }
                h1 { font-size: 2.5em; margin-bottom: 20px; }
                p { font-size: 1.2em; margin: 10px 0; }
                .status { color: #4ade80; }
                .error { color: #fbbf24; }
                a { color: white; text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 En Ucuza Kargo</h1>
                <p class="status">✅ Backend API Çalışıyor</p>
                <p class="error">⚠️ Frontend build bulunamadı</p>
                <p>API Endpoint: <a href="/api/">/api/</a></p>
                <hr style="margin: 30px 0; opacity: 0.3;">
                <p style="font-size: 0.9em; opacity: 0.8;">
                    Frontend build edilmedi veya yanlış konumda.<br>
                    Lütfen build loglarını kontrol edin.
                </p>
            </div>
        </body>
        </html>
        """

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Export socket_app for uvicorn
application = socket_app
