"""
Analytics Dashboard FastAPI Application
"""
import asyncio
import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Import analytics modules
from src.analytics.analytics_collector import analytics_collector
from src.analytics.metrics_aggregator import metrics_aggregator
from src.analytics.time_series_storage import time_series_storage
from src.api.analytics_routes import analytics_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan"""
    # Startup
    logger.info("Starting analytics dashboard application...")
    
    try:
        # Start background tasks for analytics collection
        await analytics_collector.start_background_tasks()
        await time_series_storage.start_background_tasks()
        logger.info("Analytics background tasks started")
        
        yield
        
    finally:
        # Shutdown
        logger.info("Shutting down analytics dashboard application...")
        await analytics_collector.stop_background_tasks()
        await time_series_storage.stop_background_tasks()
        logger.info("Analytics background tasks stopped")

# Create FastAPI application
app = FastAPI(
    title="RAG Analytics Dashboard API",
    description="Real-time analytics and monitoring for RAG search system",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include analytics routes
app.include_router(analytics_router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "RAG Analytics Dashboard API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "real_time_metrics": "/api/analytics/real-time",
            "performance_metrics": "/api/analytics/performance",
            "system_health": "/api/analytics/system-health",
            "search_analytics": "/api/analytics/search-analytics",
            "dashboard_data": "/api/analytics/dashboard",
            "time_series": "/api/analytics/time-series/{metric_name}",
            "health_check": "/api/analytics/health"
        }
    }

@app.get("/health")
async def health_check():
    """Application health check"""
    try:
        # Check analytics collector
        metrics = await analytics_collector.get_real_time_metrics()
        
        return {
            "status": "healthy",
            "timestamp": metrics.get("timestamp"),
            "components": {
                "analytics_collector": "operational",
                "metrics_aggregator": "operational", 
                "time_series_storage": "operational"
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    # Configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8001))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    logger.info(f"Starting analytics dashboard on {host}:{port}")
    
    uvicorn.run(
        "analytics_app:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )
