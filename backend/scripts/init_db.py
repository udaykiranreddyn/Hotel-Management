import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import inspect
from app.core.database import Base, engine
# Import all models to register with Base.metadata
import app.models  # noqa: F401


def init_database():
    print("=" * 60)
    print("Initializing Database Schema for Smart Hotel Management System")
    print("=" * 60)

    # 1. Ensure target directory exists
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
    os.makedirs(data_dir, exist_ok=True)
    db_file = os.path.join(data_dir, "hotel.db")
    print(f"[PATH] Database file location: {db_file}")

    # 2. Create all tables defined in models
    print("[INIT] Creating tables via SQLAlchemy Base.metadata.create_all...")
    Base.metadata.create_all(bind=engine)

    # 3. Inspect generated schema
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    
    print("\n[SUCCESS] Successfully registered and created the following tables:")
    for idx, table in enumerate(sorted(table_names), start=1):
        columns = inspector.get_columns(table)
        fks = inspector.get_foreign_keys(table)
        print(f"  {idx:2d}. {table:<26} ({len(columns):2d} columns, {len(fks):2d} foreign keys)")

    print(f"\n[SUMMARY] Total Tables Created: {len(table_names)}")
    print("=" * 60)
    return len(table_names)


if __name__ == "__main__":
    init_database()
