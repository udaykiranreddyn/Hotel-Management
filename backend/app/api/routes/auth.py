from typing import List
import threading
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User, Guest
from app.models.enums import UserRole
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserProfileResponse,
    TokenResponse,
    DemoAccountInfo,
)
from app.api.deps import get_current_user
from app.services.firestore_service import firestore_service


router = APIRouter()


def _format_user_profile(user: User) -> UserProfileResponse:
    """Helper to convert User and associated Guest data into UserProfileResponse."""
    preferences = None
    loyalty_points = 0
    if user.guest_profile:
        preferences = user.guest_profile.preferences
        loyalty_points = user.guest_profile.loyalty_points

    return UserProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        is_active=user.is_active,
        preferences=preferences,
        loyalty_points=loyalty_points,
        created_at=user.created_at,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_guest(request: UserRegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new guest account.
    Stores bcrypt hashed password, creates User & Guest profiles, and returns persistent JWT token.
    """
    email_clean = request.email.lower().strip()
    
    # Check local database only (SQLite is the authoritative source of truth)
    existing_user = db.query(User).filter(User.email == email_clean).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An account with email '{email_clean}' already exists. Please login instead.",
        )

    # Determine target UserRole
    req_role = (request.role or "GUEST").upper()
    if req_role == "WORKER":
        target_role = UserRole.RECEPTIONIST
    elif req_role == "ADMIN":
        target_role = UserRole.ADMIN
    else:
        target_role = UserRole.GUEST

    # Create User
    new_user = User(
        email=request.email.lower().strip(),
        hashed_password=get_password_hash(request.password),
        full_name=request.full_name.strip(),
        phone=request.phone.strip() if request.phone else None,
        role=target_role,
        is_active=True,
    )
    db.add(new_user)
    db.flush()  # Flush to generate new_user.id

    # Create associated Guest profile with 50 welcome loyalty points if guest
    new_guest = Guest(
        id=new_user.id,
        preferences=request.preferences,
        loyalty_points=50,  # Welcome bonus points
    )
    db.add(new_guest)
    db.commit()
    db.refresh(new_user)

    # Sync to Firestore in a background thread — non-blocking, never delays the response
    user_payload = {
        "id": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "phone": new_user.phone,
        "role": new_user.role.value if hasattr(new_user.role, "value") else str(new_user.role),
        "is_active": new_user.is_active,
        "preferences": request.preferences,
        "loyalty_points": 50,
        "created_at": str(new_user.created_at)
    }
    def _sync_to_firestore():
        try:
            firestore_service.store_document("users", str(user_payload["id"]), user_payload)
        except Exception as e:
            print(f"[Firestore] Background sync note: {e}")
    threading.Thread(target=_sync_to_firestore, daemon=True).start()

    # Generate JWT
    expires_in_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    access_token = create_access_token(
        subject=new_user.id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        extra_claims={"email": new_user.email, "role": new_user.role.value},
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in_seconds=expires_in_seconds,
        user=_format_user_profile(new_user),
    )


@router.post("/login", response_model=TokenResponse)
def login(request: UserLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user with email and password.
    Returns persistent JWT token and user profile upon valid credentials.
    """
    user = db.query(User).filter(User.email == request.email.lower().strip()).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact hotel administration.",
        )

    # Generate JWT
    expires_in_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    access_token = create_access_token(
        subject=user.id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        extra_claims={"email": user.email, "role": user.role.value},
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in_seconds=expires_in_seconds,
        user=_format_user_profile(user),
    )


@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Retrieve authenticated user profile.
    Used by frontend on application open to validate and restore persistent sessions.
    """
    return _format_user_profile(current_user)


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """
    Logout endpoint. Client removes token from storage.
    """
    return {
        "status": "success",
        "message": f"User {current_user.email} logged out successfully.",
    }


@router.get("/demo-accounts", response_model=List[DemoAccountInfo])
def get_demo_accounts():
    """
    Public endpoint providing demo accounts for Guest, Worker, and Admin roles.
    """
    return [
        DemoAccountInfo(
            role="GUEST",
            email="guest@aurahotels.com",
            password="Password@123",
            description="Guest user for room booking, suite selections, and hotel reviews.",
        ),
        DemoAccountInfo(
            role="WORKER",
            email="receptionist@aurahotels.com",
            password="Password@123",
            description="Hotel staff worker for front desk operations, housekeeping, and maintenance.",
        ),
        DemoAccountInfo(
            role="ADMIN",
            email="admin@aurahotels.com",
            password="Password@123",
            description="General Hotel Manager with complete administrative oversight and AI reports.",
        ),
    ]
