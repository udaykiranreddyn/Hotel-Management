from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


# =========================================================================
# 1. GUEST REVIEWS SCHEMAS
# =========================================================================

class ReviewCreateRequest(BaseModel):
    booking_reference: str = Field(..., description="Booking reference code (e.g., AURA-BK-XXXXX)")
    guest_email: str = Field(..., description="Email matching the reservation")
    rating: float = Field(..., ge=1.0, le=5.0, description="Overall stay rating (1.0 to 5.0)")
    comment: str = Field(..., min_length=5, max_length=2000, description="Detailed review text")
    cleanliness_rating: Optional[int] = Field(5, ge=1, le=5)
    staff_rating: Optional[int] = Field(5, ge=1, le=5)
    comfort_rating: Optional[int] = Field(5, ge=1, le=5)


class ReviewResponse(BaseModel):
    id: int
    booking_reference: str
    guest_name: str
    room_number: str
    room_type_name: str
    rating: float
    comment: str
    sentiment: str
    aspect_ratings: Optional[dict] = None
    created_at: str


class ReviewSummaryResponse(BaseModel):
    total_reviews: int
    average_rating: float
    rating_distribution: dict  # e.g., {"5": 12, "4": 5, "3": 1, "2": 0, "1": 0}
    sentiment_breakdown: dict  # e.g., {"POSITIVE": 15, "NEUTRAL": 2, "NEGATIVE": 1}
    reviews: List[ReviewResponse]


# =========================================================================
# 2. GUEST COMPLAINTS SCHEMAS
# =========================================================================

class ComplaintCreateRequest(BaseModel):
    guest_email: str = Field(..., description="Guest account email")
    booking_reference: Optional[str] = Field(None, description="Optional booking reference")
    room_number: Optional[str] = Field(None, description="Optional room number if room-related")
    category: str = Field("ROOM", description="ROOM, SERVICE, BILLING, CLEANLINESS, NOISE, OTHER")
    description: str = Field(..., min_length=5, max_length=2000, description="Detailed issue description")


class ComplaintResolveRequest(BaseModel):
    status: str = Field("RESOLVED", description="IN_PROGRESS, RESOLVED, CLOSED")
    resolution: str = Field(..., min_length=3, description="Resolution notes taken by hotel staff")


class ComplaintResponse(BaseModel):
    id: int
    complaint_reference: str
    guest_name: str
    guest_email: str
    room_number: Optional[str]
    category: str
    priority: str
    department: str
    description: str
    status: str
    resolution: Optional[str]
    created_at: str
    resolved_at: Optional[str]


# =========================================================================
# 3. NOTIFICATIONS & SCHEDULER SCHEMAS
# =========================================================================

class NotificationCreateRequest(BaseModel):
    recipient_email: str = Field(..., description="Target guest email")
    title: str = Field(..., min_length=2, max_length=150)
    message: str = Field(..., min_length=5)
    booking_reference: Optional[str] = None
    channel: Optional[str] = "IN_SYSTEM"  # IN_SYSTEM, EMAIL, SMS
    scheduled_seconds_from_now: Optional[int] = 0


class NotificationResponse(BaseModel):
    id: int
    recipient_name: str
    recipient_email: str
    title: str
    message: str
    channel: str
    status: str
    scheduled_at: str
    sent_at: Optional[str]
    read_at: Optional[str]
    created_at: str


class NotificationSchedulerResult(BaseModel):
    processed_count: int
    delivered_count: int
    timestamp: str
    message: str
