from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings
from app.core.database import check_db_connection
from app.schemas.health import SystemHealthResponse, DatabaseHealth

router = APIRouter()


@router.get("/", response_model=SystemHealthResponse)
def get_system_health():
    """
    Main system health diagnostic endpoint.
    Verifies API status, SQLAlchemy database connectivity, latency, schema tables, and environment metadata.
    """
    db_info = check_db_connection()
    db_health = DatabaseHealth(
        status=db_info["status"],
        dialect=db_info["dialect"],
        latency_ms=db_info["latency_ms"],
        total_tables=db_info.get("total_tables", 0),
        table_names=db_info.get("table_names", []),
        error=db_info.get("error"),
    )
    
    overall_status = "healthy" if db_health.status == "connected" else "degraded"
    
    return SystemHealthResponse(
        status=overall_status,
        app_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc).isoformat(),
        database=db_health,
        active_modules=[
            "Core API Server (FastAPI)",
            f"Relational Schema ({db_health.total_tables} ORM Tables active)",
            "User & Staff Profiles (Guests, Employees)",
            "Room Inventory & Amenities Engine",
            "Booking & Transactional Folio Management",
            "Operations (Dining, Laundry, Housekeeping, Maintenance)",
            "Feedback & AI Prediction Logs",
        ],
        phase="Phase 3: Real-Time Bookings, Double-Booking Prevention & Portals Active",
    )


@router.get("/ping")
def ping():
    """Simple ping-pong liveness probe."""
    return {"status": "ok", "message": "pong"}


@router.get("/db")
def check_db():
    """Direct database connectivity probe."""
    return check_db_connection()
