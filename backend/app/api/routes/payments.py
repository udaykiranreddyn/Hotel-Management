from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Request, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user, get_optional_current_user, require_roles
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.payment import (
    CreateOrderRequest,
    CreateOrderResponse,
    VerifyPaymentRequest,
    PaymentVerificationResponse,
    PaymentDetailResponse,
    RefundRequest,
    RefundResponse,
    PaymentReceiptResponse,
    PaymentStatsResponse,
)
from app.services.payment_service import PaymentService

from app.core.config import settings

router = APIRouter()


@router.get(
    "/config",
    summary="Get Public Razorpay Configuration",
    description="Returns public Razorpay Key ID, currency, and hotel identity.",
)
def get_payment_config():
    return {
        "key_id": settings.RAZORPAY_KEY_ID,
        "currency": settings.RAZORPAY_CURRENCY,
        "hotel_name": settings.HOTEL_NAME,
        "hotel_email": settings.HOTEL_CONTACT_EMAIL,
        "hotel_phone": settings.HOTEL_CONTACT_PHONE,
    }


@router.post(
    "/create-order",
    response_model=CreateOrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Razorpay Payment Order",
    description="Calculates exact booking folio on backend, verifies room availability, and generates a live Razorpay Order.",
)
def create_payment_order(
    payload: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    return PaymentService.create_booking_payment_order(db=db, payload=payload, current_user=current_user)


@router.post(
    "/verify",
    response_model=PaymentVerificationResponse,
    summary="Verify Razorpay Payment Signature",
    description="Verifies the HMAC-SHA256 signature from Razorpay Checkout, confirms the payment and activates the room booking.",
)
def verify_payment(
    payload: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    return PaymentService.verify_payment_and_confirm(db=db, payload=payload, current_user=current_user)


@router.get(
    "/my-payments",
    response_model=List[PaymentDetailResponse],
    summary="Get Guest Payment History",
    description="Returns all transaction records strictly belonging to the currently authenticated guest.",
)
def get_my_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PaymentService.get_my_payments(db=db, user=current_user)


@router.get(
    "/admin/overview",
    response_model=PaymentStatsResponse,
    summary="Payment Analytics & Transaction Search",
    description="Provides real-time financial stats (captured revenue, refunds, status counts) and transaction search. Admin/Receptionist only.",
)
def get_admin_overview(
    search: Optional[str] = Query(None, description="Search by booking reference, payment ID, or guest name/email"),
    status_filter: Optional[str] = Query(None, description="Filter by payment status (e.g. SUCCESS, PENDING, FAILED, REFUNDED)"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.RECEPTIONIST)),
):
    return PaymentService.get_admin_overview(
        db=db,
        search=search,
        status_filter=status_filter,
        limit=limit,
    )


@router.get(
    "/{payment_id}/status",
    summary="Check Payment Status",
    description="Returns current status of the payment. Guests can only check their own payments.",
)
def get_payment_status(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment_detail = PaymentService.get_payment_details(db=db, payment_id=payment_id, user=current_user)
    return {
        "payment_id": payment_detail.id,
        "payment_reference": payment_detail.payment_reference,
        "status": payment_detail.status,
        "booking_status": payment_detail.booking_status,
        "amount": payment_detail.amount,
        "currency": payment_detail.currency,
        "razorpay_payment_id": payment_detail.razorpay_payment_id,
        "updated_at": payment_detail.updated_at or payment_detail.created_at,
    }


@router.get(
    "/{payment_id}/receipt",
    response_model=PaymentReceiptResponse,
    summary="Download Payment Receipt",
    description="Generates detailed tax receipt for verified hotel room reservation payments.",
)
def get_payment_receipt(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    return PaymentService.get_payment_receipt(db=db, payment_id=payment_id, user=current_user)


@router.get(
    "/{payment_id}",
    response_model=PaymentDetailResponse,
    summary="Get Payment Details",
    description="Retrieve complete payment record with refund history. IDOR-protected.",
)
def get_payment_details(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PaymentService.get_payment_details(db=db, payment_id=payment_id, user=current_user)


@router.post(
    "/{payment_id}/refund",
    response_model=RefundResponse,
    summary="Process Payment Refund",
    description="Calls Razorpay Refund API to process full or partial refund for a verified payment. Authorized Admin/Receptionist only.",
)
def refund_payment(
    payment_id: int,
    payload: RefundRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.RECEPTIONIST)),
):
    return PaymentService.process_refund(
        db=db,
        payment_id=payment_id,
        payload=payload,
        staff_user=current_user,
    )


@router.post(
    "/webhook",
    summary="Razorpay Webhook Handler",
    description="Authoritative asynchronous webhook endpoint for payment.captured, payment.failed, order.paid, and refund events.",
)
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
    db: Session = Depends(get_db),
):
    raw_body = await request.body()
    return PaymentService.process_webhook(
        db=db,
        raw_body=raw_body,
        signature=x_razorpay_signature,
    )
