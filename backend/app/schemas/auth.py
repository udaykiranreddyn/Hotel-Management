from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, model_validator
from app.models.enums import UserRole


class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150, description="Full Name of the user")
    email: EmailStr = Field(..., description="Unique email address")
    phone: Optional[str] = Field(None, max_length=30, description="Contact phone number")
    password: str = Field(..., min_length=6, description="Password with minimum 6 characters")
    confirm_password: str = Field(..., description="Must match password")
    role: Optional[str] = Field("GUEST", description="Role option: GUEST, WORKER, or ADMIN")
    preferences: Optional[str] = Field(None, description="Guest preferences")

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserProfileResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    preferences: Optional[str] = None
    loyalty_points: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_seconds: int
    user: UserProfileResponse


class DemoAccountInfo(BaseModel):
    role: str
    email: str
    password: str
    description: str
