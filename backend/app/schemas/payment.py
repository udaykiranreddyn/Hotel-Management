from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field


class CreateOrderRequest(BaseModel):
    room_id: Optional[int] = None
    check_in_date: Optional[date] = None
    check_out_date: Optional[date] = None
    num_guests: int = Field(default=1, ge=1, le=10)
    guest_name: Optional[str] = None
    guest_email: Optional[str] = None
    guest_phone: Optional[str] = None
    special_requests: Optional[str] = None
    coupon_code: Optional[str] = None
    booking_id: Optional[int] = None  # If retrying payment for an existing pending booking


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: float
    amount_paise: int
    currency: str
    key_id: str
    booking_id: int
    booking_reference: str
    hotel_name: str
    room_name: str
    room_type: str
    check_in_date: date
    check_out_date: date
    num_nights: int
    num_guests: int
    price_per_night: float
    room_charges: float
    taxes: float
    discount_amount: float
    guest_name: str
    guest_email: str
    guest_phone: Optional[str] = None


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentVerificationResponse(BaseModel):
    success: bool
    message: str
    booking_id: int
    booking_reference: str
    payment_id: int
    razorpay_payment_id: str
    razorpay_order_id: str
    amount: float
    currency: str
    payment_status: str
    booking_status: str
    payment_method: Optional[str] = None
    paid_at: datetime


class RefundItemResponse(BaseModel):
    id: int
    razorpay_refund_id: Optional[str] = None
    refund_amount: float
    currency: str
    reason: str
    status: str
    processed_at: datetime


class PaymentDetailResponse(BaseModel):
    id: int
    payment_reference: str
    booking_id: int
    booking_reference: str
    user_id: Optional[int] = None
    guest_name: str
    guest_email: str
    guest_phone: Optional[str] = None
    room_number: str
    room_type: str
    check_in_date: date
    check_out_date: date
    num_nights: int
    num_guests: int
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    amount: float
    currency: str
    method: Optional[str] = None
    status: str
    booking_status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    notes: Optional[str] = None
    refunds: List[RefundItemResponse] = []


class RefundRequest(BaseModel):
    amount: Optional[float] = None
    reason: str = "Customer requested refund / Booking cancellation"


class RefundResponse(BaseModel):
    success: bool
    message: str
    refund_id: Optional[int] = None
    razorpay_refund_id: Optional[str] = None
    amount: float
    currency: str = "INR"
    status: str
    payment_id: int
    booking_reference: str


class PaymentReceiptResponse(BaseModel):
    hotel_name: str
    hotel_address: str
    hotel_gstin: str
    hotel_contact_phone: str
    hotel_contact_email: str
    receipt_number: str
    booking_reference: str
    payment_id: int
    razorpay_payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    guest_name: str
    guest_email: str
    guest_phone: Optional[str] = None
    room_number: str
    room_type: str
    check_in_date: date
    check_out_date: date
    total_nights: int
    num_guests: int
    price_per_night: float
    room_charges: float
    taxes: float
    discount_amount: float
    total_amount: float
    currency: str
    payment_method: str
    payment_status: str
    payment_date: datetime


class PaymentStatsResponse(BaseModel):
    total_revenue: float
    total_successful_payments: int
    pending_payments: int
    failed_payments: int
    refunded_payments: int
    total_refunded_amount: float
    recent_transactions: List[PaymentDetailResponse] = []
