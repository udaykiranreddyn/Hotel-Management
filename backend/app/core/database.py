import os
import time
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Engine configuration
connect_args = {}
db_url = settings.DATABASE_URL

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    # On Vercel serverless, only /tmp is writable
    if os.environ.get("VERCEL"):
        db_url = "sqlite:////tmp/hotel.db"
    elif ":/" not in db_url[10:] and not db_url.startswith("sqlite:////"):
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
        data_dir = os.path.join(project_root, "data")
        os.makedirs(data_dir, exist_ok=True)
        db_file = os.path.join(data_dir, "hotel.db").replace("\\", "/")
        db_url = f"sqlite:///{db_file}"

engine = create_engine(
    db_url,
    connect_args=connect_args,
    echo=(settings.ENVIRONMENT == "development_debug"),
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that creates and provides an independent database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection():
    """Checks database connectivity, measuring response time and table registry."""
    start_time = time.perf_counter()
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        
        return {
            "status": "connected",
            "dialect": engine.dialect.name,
            "latency_ms": latency_ms,
            "total_tables": len(table_names),
            "table_names": table_names,
        }
    except Exception as e:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "status": "error",
            "dialect": engine.dialect.name,
            "latency_ms": latency_ms,
            "total_tables": 0,
            "table_names": [],
            "error": str(e),
        }
