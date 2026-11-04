import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine, check_db_connection
from app.api.routes import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure data directory exists
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
    os.makedirs(data_dir, exist_ok=True)
    
    # Initialize base tables
    Base.metadata.create_all(bind=engine)
    try:
        from scripts.migrate_razorpay import run_migration
        run_migration()
    except Exception as e:
        print(f"[INIT] Safe migration check notice: {e}")
    # Seed demo data on Vercel (ephemeral DB starts empty each cold start)
    if os.environ.get("VERCEL"):
        try:
            from scripts.seed_hotel_data import seed_all
            seed_all()
        except Exception as e:
            print(f"[INIT] Seed notice: {e}")
        try:
            from scripts.seed_demo_users import seed_demo_users
            seed_demo_users()
        except Exception as e:
            print(f"[INIT] Demo users seed notice: {e}")
    db_check = check_db_connection()
    print(f"[INIT] Database status: {db_check['status']} (Latency: {db_check['latency_ms']}ms)")
    yield
    print("[SHUTDOWN] Application shutting down gracefully")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade Smart Hotel Management System Backend API with AI/ML decision support.",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# Configure CORS
_cors_origins = settings.CORS_ORIGINS
_allow_all = any(o == "*" for o in _cors_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins if not _allow_all else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app" if not _allow_all else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "version": settings.VERSION,
        "docs": "/api/docs",
        "health": f"{settings.API_V1_STR}/health",
        "status": "operational",
    }
