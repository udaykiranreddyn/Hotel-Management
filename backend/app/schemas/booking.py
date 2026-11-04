from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field, EmailStr
from app.models.enums import BookingStatus, PaymentMethod


class BookingCreateRequest(BaseModel):
    room_id: int
    check_in_date: date
    check_out_date: date
    num_guests: int = Field(default=2, ge=1, le=10)
    guest_name: str = Field(..., min_length=2, max_length=150)
    guest_email: EmailStr
    guest_phone: Optional[str] = Field(None, max_length=30)
    room_preference: Optional[str] = None
    special_requests: Optional[str] = None
    coupon_code: Optional[str] = None
    payment_method: PaymentMethod = PaymentMethod.CARD


class BookingResponse(BaseModel):
    id: int
    booking_reference: str
    room_id: int
    room_number: str
    room_type_name: str
    room_image: Optional[str] = None
    check_in_date: date
    check_out_date: date
    num_guests: int
    num_nights: int
    price_per_night: float
    room_charges: float
    taxes: float
    discount_amount: float
    total_amount: float
    booking_status: BookingStatus
    special_requests: Optional[str] = None
    created_at: datetime
    guest_name: Optional[str] = None
    guest_email: Optional[str] = None

    class Config:
        from_attributes = True


class CouponValidateRequest(BaseModel):
    code: str
    base_amount: float


class CouponValidateResponse(BaseModel):
    is_valid: bool
    code: str
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    discount_amount: float = 0.0
    final_amount: float
    message: str


class BookingCancelRequest(BaseModel):
    reason: Optional[str] = "Guest requested cancellation"
