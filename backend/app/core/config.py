import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Hotel Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str = "sqlite:///./../data/hotel.db"

    # Firebase Configuration
    FIREBASE_PROJECT_ID: str = "hotel-management-system-afd89"
    FIREBASE_API_KEY: str = "AIzaSyDusMC8ehNSUEK6H85rWYL7DmhPInXzKrk"
    FIREBASE_AUTH_DOMAIN: str = "hotel-management-system-afd89.firebaseapp.com"
    FIREBASE_STORAGE_BUCKET: str = "hotel-management-system-afd89.firebasestorage.app"
    FIREBASE_MESSAGING_SENDER_ID: str = "845827061498"
    FIREBASE_APP_ID: str = "1:845827061498:web:87dafaa8669f0929d3bb43"
    FIREBASE_MEASUREMENT_ID: str = "G-6FHBKWDXC2"
    
    # Security
    SECRET_KEY: str = "temporary-secret-key-change-in-production-hotel-smart-3.8"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Razorpay Payment Gateway Configuration
    RAZORPAY_KEY_ID: str = "rzp_test_TmVZyAPlsNkYkx"
    RAZORPAY_KEY_SECRET: str = "39QikkfSYzhxg3TDBT48W91m"
    RAZORPAY_WEBHOOK_SECRET: str = "your_webhook_secret"
    RAZORPAY_CURRENCY: str = "INR"

    # Hotel Identity & Billing Info
    HOTEL_NAME: str = "Aura Grand Luxury Hotel & Suites"
    HOTEL_ADDRESS: str = "742 Evergreen Promenade, Bandra Kurla Complex, Mumbai, Maharashtra 400051"
    HOTEL_GSTIN: str = "27AAACH7429K1ZX"
    HOTEL_CONTACT_PHONE: str = "+91 22 4988 7000"
    HOTEL_CONTACT_EMAIL: str = "reservations@aurahotels.com"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://*.vercel.app",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        import json
        try:
            return json.loads(v)
        except Exception:
            return ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
