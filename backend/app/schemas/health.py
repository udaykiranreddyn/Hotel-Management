from typing import List, Optional
from pydantic import BaseModel


class DatabaseHealth(BaseModel):
    status: str
    dialect: str
    latency_ms: float
    total_tables: int = 0
    table_names: List[str] = []
    error: Optional[str] = None


class SystemHealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    environment: str
    timestamp: str
    database: DatabaseHealth
    active_modules: List[str]
    phase: str
