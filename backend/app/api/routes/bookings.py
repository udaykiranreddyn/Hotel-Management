import random
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.room import Room
from app.models.booking import Booking, BookingHistory, Coupon
from app.models.payment import Payment, Refund
from app.models.user import User, Guest
from app.models.enums import BookingStatus, PaymentMethod, PaymentStatus, UserRole, RoomStatus
from app.schemas.booking import (
    BookingCreateRequest,
    BookingResponse,
    CouponValidateRequest,
    CouponValidateResponse,
    BookingCancelRequest,
)

router = APIRouter()


def _format_booking_response(b: Booking) -> BookingResponse:
    room_number = b.room.room_number if b.room else "N/A"
    room_type_name = b.room.room_type.name if b.room and b.room.room_type else "Room"
    room_image = b.room.room_type.image_url if b.room and b.room.room_type else None
    guest_name = b.guest.user.full_name if b.guest and b.guest.user else "Guest"
    guest_email = b.guest.user.email if b.guest and b.guest.user else None

    return BookingResponse(
        id=b.id,
        booking_reference=b.booking_reference,
        room_id=b.room_id,
        room_number=room_number,
        room_type_name=room_type_name,
        room_image=room_image,
        check_in_date=b.check_in_date,
        check_out_date=b.check_out_date,
        num_guests=b.num_guests,
        num_nights=b.num_nights,
        price_per_night=b.price_per_night,
        room_charges=b.room_charges,
        taxes=b.taxes,
        discount_amount=b.discount_amount,
        total_amount=b.total_amount,
        booking_status=b.booking_status,
        special_requests=b.special_requests,
        created_at=b.created_at,
        guest_name=guest_name,
        guest_email=guest_email,
    )


@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreateRequest,
    db: Session = Depends(get_db),
):
    """
    Create a new hotel room reservation with strict double-booking prevention,
    automatic guest profile linking, coupon discount application, and financial folio creation.
    """
    if payload.check_in_date >= payload.check_out_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-out date must be strictly after check-in date.",
        )

    # 1. Fetch Room
    room = (
        db.query(Room)
        .options(joinedload(Room.room_type))
        .filter(Room.id == payload.room_id, Room.is_active == True)
        .first()
    )
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room with ID {payload.room_id} does not exist or is inactive.",
        )

    # 2. Strict Overlapping Double-Booking Prevention Check
    conflict = (
        db.query(Booking)
        .filter(
            Booking.room_id == payload.room_id,
            Booking.booking_status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]),
            Booking.check_in_date < payload.check_out_date,
            Booking.check_out_date > payload.check_in_date,
        )
        .first()
    )
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Room {room.room_number} is already reserved from {conflict.check_in_date} to {conflict.check_out_date}. Please choose another room or alternate dates.",
        )

    # 3. Find or Create Guest Account
    email_clean = payload.guest_email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        from app.core.security import get_password_hash
        user = User(
            email=email_clean,
            hashed_password=get_password_hash("Password@123"),  # Safe default password for new guests
            full_name=payload.guest_name.strip(),
            phone=payload.guest_phone.strip() if payload.guest_phone else None,
            role=UserRole.GUEST,
            is_active=True,
        )
        db.add(user)
        db.flush()

        guest = Guest(id=user.id, preferences=payload.room_preference, loyalty_points=25)
        db.add(guest)
        db.flush()
    else:
        guest = user.guest_profile
        if not guest:
            guest = Guest(id=user.id, preferences=payload.room_preference, loyalty_points=25)
            db.add(guest)
            db.flush()

    # 4. Calculate Financials
    num_nights = (payload.check_out_date - payload.check_in_date).days
    num_nights = max(num_nights, 1)
    room_charges = round(num_nights * room.price_per_night, 2)
    taxes = round(room_charges * 0.12, 2)  # 12% standard hospitality GST

    # 5. Coupon discount validation
    discount_amount = 0.0
    if payload.coupon_code:
        coupon = (
            db.query(Coupon)
            .filter(
                Coupon.code == payload.coupon_code.upper().strip(),
                Coupon.is_active == True,
            )
            .first()
        )
        if coupon:
            now_utc = datetime.now(timezone.utc)
            # Make sure dates are timezone-aware or comparable
            valid_from = coupon.valid_from.replace(tzinfo=timezone.utc) if coupon.valid_from.tzinfo is None else coupon.valid_from
            valid_to = coupon.valid_to.replace(tzinfo=timezone.utc) if coupon.valid_to.tzinfo is None else coupon.valid_to
            
            if valid_from <= now_utc <= valid_to and room_charges >= coupon.min_amount:
                if coupon.discount_type == "PERCENTAGE":
                    calc = (room_charges * coupon.discount_value) / 100.0
                    if coupon.max_discount:
                        calc = min(calc, coupon.max_discount)
                    discount_amount = round(calc, 2)
                else:  # FLAT
                    discount_amount = min(coupon.discount_value, room_charges)
                coupon.times_used += 1

    total_amount = max(round(room_charges + taxes - discount_amount, 2), 0.0)

    # 6. Generate Reference & Persist Booking
    ref_suffix = f"{random.randint(10000, 99999)}"
    booking_reference = f"AURA-BK-{ref_suffix}"

    booking = Booking(
        booking_reference=booking_reference,
        guest_id=guest.id,
        room_id=room.id,
        check_in_date=payload.check_in_date,
        check_out_date=payload.check_out_date,
        num_guests=payload.num_guests,
        num_nights=num_nights,
        price_per_night=room.price_per_night,
        room_charges=room_charges,
        extra_charges=0.0,
        taxes=taxes,
        discount_amount=discount_amount,
        total_amount=total_amount,
        booking_status=BookingStatus.CONFIRMED,
        special_requests=payload.special_requests or payload.room_preference,
    )
    db.add(booking)
    db.flush()

    # 7. Record Payment
    payment_method = payload.payment_method or PaymentMethod.CARD
    payment = Payment(
        payment_reference=f"PAY-{ref_suffix}",
        booking_id=booking.id,
        amount=total_amount,
        method=payment_method,
        transaction_id=f"TXN_{payment_method.value}_{random.randint(10000000, 99999999)}",
        status=PaymentStatus.SUCCESS,
        notes=f"Full prepayment for booking {booking_reference}",
    )
    db.add(payment)

    # 8. Record Audit History
    history = BookingHistory(
        booking_id=booking.id,
        previous_status=BookingStatus.PENDING,
        new_status=BookingStatus.CONFIRMED,
        changed_by_user_id=user.id,
        notes=f"Booking confirmed online with {payment_method.value} payment",
    )
    db.add(history)

    # Award 10 loyalty points for booking
    guest.loyalty_points = (guest.loyalty_points or 0) + 10

    db.commit()
    db.refresh(booking)

    return _format_booking_response(booking)


@router.get("/my-bookings", response_model=List[BookingResponse])
def get_my_bookings(
    email: Optional[str] = Query(None, description="Lookup bookings by guest email"),
    db: Session = Depends(get_db),
):
    """
    Retrieve confirmed bookings strictly for a guest by email.
    If no email parameter is provided, returns an empty list to prevent cross-user data leakage.
    """
    if not email or not email.strip():
        return []

    clean_email = email.lower().strip()
    query = (
        db.query(Booking)
        .options(
            joinedload(Booking.room).joinedload(Room.room_type),
            joinedload(Booking.guest).joinedload(Guest.user),
        )
        .join(Booking.guest)
        .join(Guest.user)
        .filter(User.email == clean_email)
        .order_by(Booking.created_at.desc())
    )

    bookings = query.all()
    return [_format_booking_response(b) for b in bookings]


@router.get("/{booking_id_or_ref}", response_model=BookingResponse)
def get_booking(booking_id_or_ref: str, db: Session = Depends(get_db)):
    """Retrieve detailed booking record by ID or reference code."""
    query = (
        db.query(Booking)
        .options(
            joinedload(Booking.room).joinedload(Room.room_type),
            joinedload(Booking.guest).joinedload(Guest.user),
        )
    )

    if booking_id_or_ref.isdigit():
        booking = query.filter(Booking.id == int(booking_id_or_ref)).first()
    else:
        booking = query.filter(Booking.booking_reference == booking_id_or_ref).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking reservation not found.")

    return _format_booking_response(booking)


@router.post("/{booking_id_or_ref}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id_or_ref: str,
    payload: BookingCancelRequest = None,
    db: Session = Depends(get_db),
):
    """
    Cancel a confirmed booking and initiate full refund record.
    """
    query = (
        db.query(Booking)
        .options(
            joinedload(Booking.room).joinedload(Room.room_type),
            joinedload(Booking.guest).joinedload(Guest.user),
            joinedload(Booking.payments),
        )
    )

    if booking_id_or_ref.isdigit():
        booking = query.filter(Booking.id == int(booking_id_or_ref)).first()
    else:
        booking = query.filter(Booking.booking_reference == booking_id_or_ref).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if booking.booking_status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="This booking has already been cancelled.")

    if booking.booking_status in [BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT]:
        raise HTTPException(status_code=400, detail="Cannot cancel a reservation that has already checked in or out.")

    prev_status = booking.booking_status
    booking.booking_status = BookingStatus.CANCELLED

    # Add History
    history = BookingHistory(
        booking_id=booking.id,
        previous_status=prev_status,
        new_status=BookingStatus.CANCELLED,
        notes=payload.reason if payload else "Cancelled by guest",
    )
    db.add(history)

    # Process refund record for any successful payments
    for p in booking.payments:
        if p.status == PaymentStatus.SUCCESS:
            p.status = PaymentStatus.REFUNDED
            refund = Refund(
                payment_id=p.id,
                booking_id=booking.id,
                refund_amount=p.amount,
                reason="Cancellation - 100% full refund policy applied",
                status="COMPLETED",
            )
            db.add(refund)

    db.commit()
    db.refresh(booking)

    return _format_booking_response(booking)


@router.post("/validate-coupon", response_model=CouponValidateResponse)
def validate_coupon(
    payload: CouponValidateRequest,
    db: Session = Depends(get_db),
):
    """
    Validate a promotional coupon code against base room charges and calculate savings.
    """
    coupon = (
        db.query(Coupon)
        .filter(Coupon.code == payload.code.upper().strip(), Coupon.is_active == True)
        .first()
    )
    if not coupon:
        return CouponValidateResponse(
            is_valid=False,
            code=payload.code,
            discount_amount=0.0,
            final_amount=payload.base_amount,
            message=f"Coupon code '{payload.code}' is invalid or expired.",
        )

    now_utc = datetime.now(timezone.utc)
    valid_from = coupon.valid_from.replace(tzinfo=timezone.utc) if coupon.valid_from.tzinfo is None else coupon.valid_from
    valid_to = coupon.valid_to.replace(tzinfo=timezone.utc) if coupon.valid_to.tzinfo is None else coupon.valid_to

    if now_utc < valid_from or now_utc > valid_to:
        return CouponValidateResponse(
            is_valid=False,
            code=coupon.code,
            discount_amount=0.0,
            final_amount=payload.base_amount,
            message="This coupon has expired.",
        )

    if payload.base_amount < coupon.min_amount:
        return CouponValidateResponse(
            is_valid=False,
            code=coupon.code,
            discount_amount=0.0,
            final_amount=payload.base_amount,
            message=f"Minimum booking amount of ₹{int(coupon.min_amount)} required to apply this coupon.",
        )

    if coupon.discount_type == "PERCENTAGE":
        calc = (payload.base_amount * coupon.discount_value) / 100.0
        if coupon.max_discount:
            calc = min(calc, coupon.max_discount)
        discount_amount = round(calc, 2)
    else:
        discount_amount = min(coupon.discount_value, payload.base_amount)

    final_amount = max(round(payload.base_amount - discount_amount, 2), 0.0)

    return CouponValidateResponse(
        is_valid=True,
        code=coupon.code,
        discount_type=coupon.discount_type,
        discount_value=coupon.discount_value,
        discount_amount=discount_amount,
        final_amount=final_amount,
        message=f"Promo code '{coupon.code}' applied successfully! Saved ₹{discount_amount}",
    )
