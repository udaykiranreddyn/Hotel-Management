import random
import json
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta, date
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.models.room import Room
from app.models.booking import Booking, BookingHistory, Coupon
from app.models.payment import Payment, Refund, PaymentHistory
from app.models.webhook_event import WebhookEvent
from app.models.user import User, Guest
from app.models.enums import BookingStatus, PaymentMethod, PaymentStatus, UserRole
from app.services.razorpay_service import razorpay_service
from app.schemas.payment import (
    CreateOrderRequest,
    CreateOrderResponse,
    VerifyPaymentRequest,
    PaymentVerificationResponse,
    PaymentDetailResponse,
    RefundItemResponse,
    RefundRequest,
    RefundResponse,
    PaymentReceiptResponse,
    PaymentStatsResponse,
)

logger = logging.getLogger("payment_service")


class PaymentService:

    @staticmethod
    def _map_payment_method(method_str: Optional[str]) -> PaymentMethod:
        if not method_str:
            return PaymentMethod.CARD
        m = method_str.upper().strip()
        if "UPI" in m:
            return PaymentMethod.UPI
        elif "NETBANKING" in m or "BANK" in m or "NB" in m:
            return PaymentMethod.NETBANKING
        elif "WALLET" in m:
            return PaymentMethod.WALLET
        elif "CASH" in m:
            return PaymentMethod.CASH
        return PaymentMethod.CARD

    @staticmethod
    def create_booking_payment_order(
        db: Session,
        payload: CreateOrderRequest,
        current_user: Optional[User] = None,
    ) -> CreateOrderResponse:
        """
        Calculates exact booking charges strictly on the backend, checks room availability,
        creates/reuses a pending reservation, and generates a live Razorpay Order.
        Never trusts amounts or discounts sent from the client.
        """
        booking: Optional[Booking] = None
        room: Optional[Room] = None

        # ── Case A: Retrying payment for an existing booking ──
        if payload.booking_id:
            booking = (
                db.query(Booking)
                .options(
                    joinedload(Booking.room).joinedload(Room.room_type),
                    joinedload(Booking.guest).joinedload(Guest.user),
                    joinedload(Booking.payments),
                )
                .filter(Booking.id == payload.booking_id)
                .first()
            )
            if not booking:
                raise HTTPException(status_code=404, detail="Booking reservation not found.")

            # Prevent duplicate payments if already confirmed
            if booking.booking_status == BookingStatus.CONFIRMED and booking.payment_status == PaymentStatus.SUCCESS:
                raise HTTPException(status_code=400, detail="This booking has already been paid and confirmed.")

            room = booking.room
            total_amount = booking.total_amount

        # ── Case B: Initiating booking from room and date selection ──
        else:
            if not payload.room_id or not payload.check_in_date or not payload.check_out_date:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Room ID, check-in date, and check-out date are required to create a booking payment order.",
                )

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

            # 2. Strict Overlapping Double-Booking Prevention Check (only confirmed/active bookings)
            conflict = (
                db.query(Booking)
                .filter(
                    Booking.room_id == payload.room_id,
                    Booking.booking_status.in_([BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]),
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

            # 3. Identify or create Guest Account
            guest_user = current_user
            guest_email = (
                (guest_user.email if guest_user else payload.guest_email)
                or "guest@aurahotels.com"
            ).lower().strip()
            guest_name = (
                (guest_user.full_name if guest_user else payload.guest_name)
                or "Guest Traveler"
            ).strip()
            guest_phone = (
                (guest_user.phone if guest_user and guest_user.phone else payload.guest_phone)
                or "+91 98765 11111"
            ).strip()

            if not guest_user:
                guest_user = db.query(User).filter(User.email == guest_email).first()

            if not guest_user:
                from app.core.security import get_password_hash
                guest_user = User(
                    email=guest_email,
                    hashed_password=get_password_hash("Password@123"),
                    full_name=guest_name,
                    phone=guest_phone,
                    role=UserRole.GUEST,
                    is_active=True,
                )
                db.add(guest_user)
                db.flush()

                guest = Guest(id=guest_user.id, preferences=payload.special_requests, loyalty_points=25)
                db.add(guest)
                db.flush()
            else:
                guest = guest_user.guest_profile
                if not guest:
                    guest = Guest(id=guest_user.id, preferences=payload.special_requests, loyalty_points=25)
                    db.add(guest)
                    db.flush()

            # 4. Strict Backend Financial Calculation
            num_nights = (payload.check_out_date - payload.check_in_date).days
            num_nights = max(num_nights, 1)
            room_charges = round(num_nights * room.price_per_night, 2)
            taxes = round(room_charges * 0.12, 2)  # Standard 12% GST

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

            total_amount = max(round(room_charges + taxes - discount_amount, 2), 0.0)

            # 6. Check for recently created PENDING_PAYMENT booking to prevent duplicates on retry
            cutoff = datetime.utcnow() - timedelta(minutes=45)
            existing_pending = (
                db.query(Booking)
                .filter(
                    Booking.guest_id == guest.id,
                    Booking.room_id == room.id,
                    Booking.check_in_date == payload.check_in_date,
                    Booking.check_out_date == payload.check_out_date,
                    Booking.booking_status == BookingStatus.PENDING_PAYMENT,
                    Booking.created_at >= cutoff,
                )
                .first()
            )

            if existing_pending:
                booking = existing_pending
                booking.num_guests = payload.num_guests
                booking.room_charges = room_charges
                booking.taxes = taxes
                booking.discount_amount = discount_amount
                booking.total_amount = total_amount
                booking.special_requests = payload.special_requests or booking.special_requests
            else:
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
                    booking_status=BookingStatus.PENDING_PAYMENT,
                    payment_status=PaymentStatus.PENDING,
                    special_requests=payload.special_requests,
                )
                db.add(booking)
                db.flush()

        # ── Step 7: Create Razorpay Order via Official API ──
        user_id = booking.guest.user.id if booking.guest and booking.guest.user else (current_user.id if current_user else None)
        notes = {
            "booking_reference": booking.booking_reference,
            "room_id": str(booking.room_id),
            "room_number": room.room_number if room else "N/A",
            "guest_name": booking.guest.user.full_name if booking.guest and booking.guest.user else "Guest",
            "guest_email": booking.guest.user.email if booking.guest and booking.guest.user else "guest@aurahotels.com",
        }

        try:
            rzp_order = razorpay_service.create_order(
                amount=total_amount,
                receipt=booking.booking_reference,
                notes=notes,
                currency=settings.RAZORPAY_CURRENCY,
            )
        except Exception as e:
            logger.error(f"Failed to create Razorpay order: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Razorpay Payment Gateway Error: Unable to create payment order. Details: {str(e)}",
            )

        order_id = rzp_order["id"]

        # ── Step 8: Persist or Update Payment Record ──
        # Check if an existing pending payment for this booking exists
        payment = (
            db.query(Payment)
            .filter(
                Payment.booking_id == booking.id,
                Payment.status == PaymentStatus.PENDING,
            )
            .first()
        )

        ref_id = f"PAY-{random.randint(100000, 999999)}"
        if payment:
            payment.razorpay_order_id = order_id
            payment.amount = total_amount
            payment.currency = settings.RAZORPAY_CURRENCY
            payment.transaction_id = payment.transaction_id or order_id
            payment.transaction_reference = order_id
            payment.user_id = user_id
        else:
            payment = Payment(
                payment_reference=ref_id,
                booking_id=booking.id,
                user_id=user_id,
                razorpay_order_id=order_id,
                amount=total_amount,
                currency=settings.RAZORPAY_CURRENCY,
                method=PaymentMethod.CARD,
                status=PaymentStatus.PENDING,
                transaction_id=order_id,
                transaction_reference=order_id,
                notes=f"Razorpay order initialized for booking {booking.booking_reference}",
            )
            db.add(payment)

        db.commit()
        db.refresh(booking)

        room_name = f"{room.room_type.name} (Room {room.room_number})" if room and room.room_type else "Luxury Suite"
        guest_name_val = booking.guest.user.full_name if booking.guest and booking.guest.user else "Guest Traveler"
        guest_email_val = booking.guest.user.email if booking.guest and booking.guest.user else "guest@aurahotels.com"
        guest_phone_val = booking.guest.user.phone if booking.guest and booking.guest.user else "+91 98765 11111"

        return CreateOrderResponse(
            order_id=order_id,
            amount=total_amount,
            amount_paise=int(round(total_amount * 100)),
            currency=settings.RAZORPAY_CURRENCY,
            key_id=settings.RAZORPAY_KEY_ID,
            booking_id=booking.id,
            booking_reference=booking.booking_reference,
            hotel_name=settings.HOTEL_NAME,
            room_name=room_name,
            room_type=room.room_type.name if room and room.room_type else "Deluxe",
            check_in_date=booking.check_in_date,
            check_out_date=booking.check_out_date,
            num_nights=booking.num_nights,
            num_guests=booking.num_guests,
            price_per_night=booking.price_per_night,
            room_charges=booking.room_charges,
            taxes=booking.taxes,
            discount_amount=booking.discount_amount,
            guest_name=guest_name_val,
            guest_email=guest_email_val,
            guest_phone=guest_phone_val,
        )

    @staticmethod
    def verify_payment_and_confirm(
        db: Session,
        payload: VerifyPaymentRequest,
        current_user: Optional[User] = None,
    ) -> PaymentVerificationResponse:
        """
        Verifies Razorpay payment signature, verifies payment entity amount/currency,
        prevents duplicate processing, marks Payment as SUCCESS, and updates Booking to CONFIRMED.
        """
        # 1. Verify Signature
        is_valid = razorpay_service.verify_payment_signature(
            razorpay_order_id=payload.razorpay_order_id,
            razorpay_payment_id=payload.razorpay_payment_id,
            razorpay_signature=payload.razorpay_signature,
        )

        if not is_valid:
            logger.warning(f"Invalid payment signature for order {payload.razorpay_order_id}")
            # Mark payment as FAILED if found
            payment = (
                db.query(Payment)
                .filter(Payment.razorpay_order_id == payload.razorpay_order_id)
                .first()
            )
            if payment:
                payment.status = PaymentStatus.FAILED
                payment.error_code = "BAD_SIGNATURE"
                payment.error_description = "HMAC-SHA256 signature verification failed on backend"
                db.commit()

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment signature verification failed. Untrusted payment details received.",
            )

        # 2. Locate Payment Record
        payment = (
            db.query(Payment)
            .options(joinedload(Payment.booking).joinedload(Booking.guest).joinedload(Guest.user))
            .filter(Payment.razorpay_order_id == payload.razorpay_order_id)
            .first()
        )
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No payment record found matching Razorpay Order ID {payload.razorpay_order_id}",
            )

        booking = payment.booking
        if not booking:
            raise HTTPException(status_code=404, detail="Associated booking not found.")

        # 3. Idempotency Check: Already processed?
        if payment.status == PaymentStatus.SUCCESS and booking.booking_status == BookingStatus.CONFIRMED:
            return PaymentVerificationResponse(
                success=True,
                message="Payment already verified and confirmed.",
                booking_id=booking.id,
                booking_reference=booking.booking_reference,
                payment_id=payment.id,
                razorpay_payment_id=payment.razorpay_payment_id or payload.razorpay_payment_id,
                razorpay_order_id=payload.razorpay_order_id,
                amount=payment.amount,
                currency=payment.currency,
                payment_status=payment.status.value,
                booking_status=booking.booking_status.value,
                payment_method=payment.payment_method or "CARD",
                paid_at=payment.updated_at or payment.created_at,
            )

        # 4. Fetch live payment from Razorpay API to cross-verify amount & method
        method_str = "CARD"
        try:
            rzp_payment = razorpay_service.fetch_payment(payload.razorpay_payment_id)
            rzp_amount_paise = rzp_payment.get("amount", 0)
            expected_paise = int(round(payment.amount * 100))

            if rzp_amount_paise != expected_paise:
                payment.status = PaymentStatus.FAILED
                payment.error_code = "AMOUNT_MISMATCH"
                payment.error_description = f"Amount mismatch: received {rzp_amount_paise} paise, expected {expected_paise} paise"
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Security alert: Amount paid ({rzp_amount_paise / 100}) does not match required booking amount ({payment.amount}).",
                )

            method_str = rzp_payment.get("method", "card")
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Could not fetch payment from Razorpay: {e}. Proceeding with verified signature.")

        # 5. Update Payment Record
        prev_payment_status = payment.status
        payment.razorpay_payment_id = payload.razorpay_payment_id
        payment.razorpay_signature = payload.razorpay_signature
        payment.transaction_id = payload.razorpay_payment_id
        payment.transaction_reference = payload.razorpay_payment_id
        payment.payment_method = method_str.upper()
        payment.method = PaymentService._map_payment_method(method_str)
        payment.status = PaymentStatus.SUCCESS
        payment.error_code = None
        payment.error_description = None

        # 6. Update Booking Record
        prev_booking_status = booking.booking_status
        booking.booking_status = BookingStatus.CONFIRMED
        booking.payment_status = PaymentStatus.SUCCESS

        # 7. Audit History
        history = BookingHistory(
            booking_id=booking.id,
            previous_status=prev_booking_status,
            new_status=BookingStatus.CONFIRMED,
            changed_by_user_id=payment.user_id,
            notes=f"Online booking verified & confirmed via Razorpay ({method_str.upper()}) [Payment ID: {payload.razorpay_payment_id}]",
        )
        db.add(history)

        pay_history = PaymentHistory(
            payment_id=payment.id,
            previous_status=prev_payment_status,
            new_status=PaymentStatus.SUCCESS,
            notes=f"Signature verified. Razorpay payment ID {payload.razorpay_payment_id} captured.",
        )
        db.add(pay_history)

        # 8. Award loyalty points to guest
        if booking.guest:
            booking.guest.loyalty_points = (booking.guest.loyalty_points or 0) + 10

        db.commit()
        db.refresh(payment)
        db.refresh(booking)

        return PaymentVerificationResponse(
            success=True,
            message="Payment successfully verified and room reservation confirmed!",
            booking_id=booking.id,
            booking_reference=booking.booking_reference,
            payment_id=payment.id,
            razorpay_payment_id=payload.razorpay_payment_id,
            razorpay_order_id=payload.razorpay_order_id,
            amount=payment.amount,
            currency=payment.currency,
            payment_status=PaymentStatus.SUCCESS.value,
            booking_status=BookingStatus.CONFIRMED.value,
            payment_method=payment.payment_method,
            paid_at=datetime.utcnow(),
        )

    @staticmethod
    def process_refund(
        db: Session,
        payment_id: int,
        payload: RefundRequest,
        staff_user: User,
    ) -> RefundResponse:
        """
        Initiates a verified refund through the Razorpay Refund API and cancels/updates records.
        Restricted to ADMIN and RECEPTIONIST roles.
        """
        # 1. Locate payment
        payment = (
            db.query(Payment)
            .options(joinedload(Payment.booking))
            .filter(Payment.id == payment_id)
            .first()
        )
        if not payment:
            raise HTTPException(status_code=404, detail=f"Payment #{payment_id} not found.")

        booking = payment.booking
        if not booking:
            raise HTTPException(status_code=404, detail="Associated booking not found.")

        # 2. Eligibility checks
        if payment.status != PaymentStatus.SUCCESS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot refund a payment with status '{payment.status.value}'. Only SUCCESS payments are eligible.",
            )

        # Check existing refunds
        existing_refund_sum = sum(r.refund_amount for r in payment.refunds if r.status == "PROCESSED")
        if existing_refund_sum >= payment.amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This payment has already been fully refunded.",
            )

        refund_amount = payload.amount if (payload.amount and payload.amount > 0) else payment.amount
        if (existing_refund_sum + refund_amount) > (payment.amount + 0.01):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Refund amount (₹{refund_amount}) exceeds remaining refundable balance (₹{payment.amount - existing_refund_sum}).",
            )

        # 3. Call Razorpay Refund API
        rzp_refund_id = None
        if payment.razorpay_payment_id and not payment.razorpay_payment_id.startswith("pay_testMock"):
            try:
                rzp_refund = razorpay_service.refund_payment(
                    razorpay_payment_id=payment.razorpay_payment_id,
                    amount=refund_amount,
                    notes={"booking_reference": booking.booking_reference, "reason": payload.reason},
                )
                rzp_refund_id = rzp_refund.get("id")
            except Exception as e:
                err_msg = str(e)
                if "does not exist" in err_msg.lower() and settings.ENVIRONMENT == "development":
                    logger.warning(f"Simulating refund for non-existent test payment {payment.razorpay_payment_id} in development")
                    rzp_refund_id = f"rfnd_sim_{random.randint(100000, 999999)}"
                else:
                    logger.error(f"Razorpay refund error: {e}")
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"Razorpay Gateway Refund Error: {str(e)}",
                    )
        else:
            rzp_refund_id = f"rfnd_mock_{random.randint(100000, 999999)}"

        # 4. Record Refund in DB
        refund = Refund(
            payment_id=payment.id,
            booking_id=booking.id,
            razorpay_refund_id=rzp_refund_id,
            refund_amount=refund_amount,
            currency=payment.currency,
            reason=payload.reason,
            status="PROCESSED",
            processed_at=datetime.utcnow(),
        )
        db.add(refund)

        # Update payment status
        prev_payment_status = payment.status
        if (existing_refund_sum + refund_amount) >= payment.amount:
            payment.status = PaymentStatus.REFUNDED
            booking.booking_status = BookingStatus.CANCELLED
            booking.payment_status = PaymentStatus.REFUNDED
        else:
            payment.status = PaymentStatus.PARTIALLY_REFUNDED
            booking.payment_status = PaymentStatus.PARTIALLY_REFUNDED

        # Add Audit History
        b_hist = BookingHistory(
            booking_id=booking.id,
            previous_status=booking.booking_status,
            new_status=BookingStatus.CANCELLED,
            changed_by_user_id=staff_user.id,
            notes=f"Refund processed: ₹{refund_amount} by {staff_user.full_name} ({staff_user.role.value}). Reason: {payload.reason}",
        )
        db.add(b_hist)

        p_hist = PaymentHistory(
            payment_id=payment.id,
            previous_status=prev_payment_status,
            new_status=payment.status,
            notes=f"Refund initiated: ₹{refund_amount} [Razorpay Refund ID: {rzp_refund_id}]. Processed by {staff_user.full_name}.",
        )
        db.add(p_hist)

        db.commit()
        db.refresh(refund)

        return RefundResponse(
            success=True,
            message=f"Refund of ₹{refund_amount} processed successfully via Razorpay.",
            refund_id=refund.id,
            razorpay_refund_id=rzp_refund_id,
            amount=refund_amount,
            currency=payment.currency,
            status="PROCESSED",
            payment_id=payment.id,
            booking_reference=booking.booking_reference,
        )

    @staticmethod
    def process_webhook(
        db: Session,
        raw_body: bytes,
        signature: Optional[str],
    ) -> Dict[str, Any]:
        """
        Receives, verifies, and idempotently handles Razorpay Webhook events.
        Acts as the authoritative server-side reconciliation mechanism.
        """
        # 1. Signature Verification
        if not signature:
            raise HTTPException(status_code=400, detail="Missing X-Razorpay-Signature header.")

        is_valid = razorpay_service.verify_webhook_signature(
            raw_body=raw_body,
            signature=signature,
        )
        if not is_valid:
            logger.warning("Razorpay Webhook signature verification failed.")
            raise HTTPException(status_code=400, detail="Invalid webhook signature.")

        # 2. Parse Payload
        try:
            data = json.loads(raw_body.decode("utf-8"))
        except Exception:
            raise HTTPException(status_code=400, detail="Malformed JSON in webhook body.")

        event_id = data.get("event_id") or data.get("id") or f"evt_{random.randint(100000, 999999)}"
        event_type = data.get("event")

        # 3. Webhook Idempotency Check
        existing_event = (
            db.query(WebhookEvent)
            .filter(WebhookEvent.event_id == event_id)
            .first()
        )
        if existing_event:
            logger.info(f"Webhook event {event_id} already processed. Returning cached success.")
            return {"status": "success", "message": "Event already processed (idempotent)", "event_id": event_id}

        # 4. Handle Specific Event Types
        entity = data.get("payload", {}).get("payment", {}).get("entity", {}) or data.get("payload", {}).get("order", {}).get("entity", {})
        entity_id = entity.get("id")

        if event_type in ["payment.captured", "order.paid"]:
            order_id = entity.get("order_id") or entity.get("id")
            payment_id = entity.get("id")
            method = entity.get("method", "card")

            payment = (
                db.query(Payment)
                .options(joinedload(Payment.booking))
                .filter(Payment.razorpay_order_id == order_id)
                .first()
            )
            if payment and payment.status != PaymentStatus.SUCCESS:
                payment.razorpay_payment_id = payment_id
                payment.transaction_id = payment_id
                payment.transaction_reference = payment_id
                payment.payment_method = method.upper()
                payment.status = PaymentStatus.SUCCESS
                if payment.booking:
                    payment.booking.booking_status = BookingStatus.CONFIRMED
                    payment.booking.payment_status = PaymentStatus.SUCCESS
                logger.info(f"Webhook reconciled order {order_id} to SUCCESS.")

        elif event_type == "payment.failed":
            order_id = entity.get("order_id")
            payment = (
                db.query(Payment)
                .filter(Payment.razorpay_order_id == order_id)
                .first()
            )
            if payment and payment.status == PaymentStatus.PENDING:
                payment.status = PaymentStatus.FAILED
                payment.error_code = entity.get("error_code")
                payment.error_description = entity.get("error_description")
                logger.info(f"Webhook recorded payment failure for order {order_id}.")

        elif event_type in ["refund.created", "refund.processed"]:
            refund_entity = data.get("payload", {}).get("refund", {}).get("entity", {})
            rzp_refund_id = refund_entity.get("id")
            rzp_payment_id = refund_entity.get("payment_id")
            if rzp_payment_id:
                payment = (
                    db.query(Payment)
                    .options(joinedload(Payment.booking))
                    .filter(Payment.razorpay_payment_id == rzp_payment_id)
                    .first()
                )
                if payment:
                    payment.status = PaymentStatus.REFUNDED
                    if payment.booking:
                        payment.booking.booking_status = BookingStatus.CANCELLED
                        payment.booking.payment_status = PaymentStatus.REFUNDED

        # 5. Persist Webhook Event
        event_record = WebhookEvent(
            event_id=event_id,
            event_type=event_type,
            entity_id=entity_id,
            payload=raw_body.decode("utf-8")[:2000],  # store head of payload
            status="PROCESSED",
            processed_at=datetime.utcnow(),
        )
        db.add(event_record)
        db.commit()

        return {"status": "success", "event_id": event_id, "event_type": event_type}

    @staticmethod
    def get_payment_details(
        db: Session,
        payment_id: int,
        user: User,
    ) -> PaymentDetailResponse:
        """
        Returns full payment detail, validating authorization (owner or admin/staff).
        Prevents IDOR vulnerabilities.
        """
        payment = (
            db.query(Payment)
            .options(
                joinedload(Payment.booking).joinedload(Booking.room).joinedload(Room.room_type),
                joinedload(Payment.booking).joinedload(Booking.guest).joinedload(Guest.user),
                joinedload(Payment.refunds),
            )
            .filter(Payment.id == payment_id)
            .first()
        )
        if not payment:
            raise HTTPException(status_code=404, detail="Payment record not found.")

        booking = payment.booking
        # IDOR check: Guests can only view their own payments
        is_staff = user.role in [UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.HOUSEKEEPING, UserRole.MAINTENANCE]
        if not is_staff and payment.user_id != user.id:
            # Also allow if the booking's guest profile belongs to this user
            guest_matches = booking and booking.guest and (
                booking.guest.id == user.id or
                (booking.guest.user and booking.guest.user.id == user.id)
            )
            if not guest_matches:
                raise HTTPException(status_code=403, detail="Access denied. You can only view your own payment records.")

        room = booking.room if booking else None
        room_number = room.room_number if room else "N/A"
        room_type = room.room_type.name if room and room.room_type else "Room"
        guest = booking.guest if booking else None
        guest_user = guest.user if guest else None

        refunds_mapped = [
            RefundItemResponse(
                id=r.id,
                razorpay_refund_id=r.razorpay_refund_id,
                refund_amount=r.refund_amount,
                currency=r.currency,
                reason=r.reason,
                status=r.status,
                processed_at=r.processed_at,
            )
            for r in payment.refunds
        ]

        return PaymentDetailResponse(
            id=payment.id,
            payment_reference=payment.payment_reference,
            booking_id=booking.id if booking else 0,
            booking_reference=booking.booking_reference if booking else "N/A",
            user_id=payment.user_id,
            guest_name=guest_user.full_name if guest_user else "Guest",
            guest_email=guest_user.email if guest_user else "N/A",
            guest_phone=guest_user.phone if guest_user else None,
            room_number=room_number,
            room_type=room_type,
            check_in_date=booking.check_in_date if booking else date.today(),
            check_out_date=booking.check_out_date if booking else date.today(),
            num_nights=booking.num_nights if booking else 1,
            num_guests=booking.num_guests if booking else 1,
            razorpay_order_id=payment.razorpay_order_id,
            razorpay_payment_id=payment.razorpay_payment_id,
            amount=payment.amount,
            currency=payment.currency,
            method=payment.payment_method or (payment.method.value if payment.method else "CARD"),
            status=payment.status.value,
            booking_status=booking.booking_status.value if booking else "UNKNOWN",
            created_at=payment.created_at,
            updated_at=payment.updated_at,
            notes=payment.notes,
            refunds=refunds_mapped,
        )

    @staticmethod
    def get_my_payments(
        db: Session,
        user: User,
    ) -> List[PaymentDetailResponse]:
        """
        Retrieves all payments for the logged-in guest strictly to avoid cross-guest leakage.
        Matches by user_id OR by the guest profile linked to the user's email.
        """
        # Also find payments linked via guest profile (for bookings made as guest checkout)
        guest_profile = db.query(Guest).filter(Guest.id == user.id).first()
        guest_booking_ids = []
        if guest_profile:
            guest_booking_ids = [
                b.id for b in db.query(Booking.id).filter(Booking.guest_id == guest_profile.id).all()
            ]

        from sqlalchemy import or_
        payments = (
            db.query(Payment)
            .options(
                joinedload(Payment.booking).joinedload(Booking.room).joinedload(Room.room_type),
                joinedload(Payment.booking).joinedload(Booking.guest).joinedload(Guest.user),
                joinedload(Payment.refunds),
            )
            .filter(
                or_(
                    Payment.user_id == user.id,
                    Payment.booking_id.in_(guest_booking_ids) if guest_booking_ids else False,
                )
            )
            .order_by(Payment.created_at.desc())
            .all()
        )

        results = []
        for p in payments:
            b = p.booking
            room = b.room if b else None
            guest = b.guest if b else None
            guest_user = guest.user if guest else None

            results.append(
                PaymentDetailResponse(
                    id=p.id,
                    payment_reference=p.payment_reference,
                    booking_id=b.id if b else 0,
                    booking_reference=b.booking_reference if b else "N/A",
                    user_id=p.user_id,
                    guest_name=guest_user.full_name if guest_user else user.full_name,
                    guest_email=guest_user.email if guest_user else user.email,
                    guest_phone=guest_user.phone if guest_user else user.phone,
                    room_number=room.room_number if room else "N/A",
                    room_type=room.room_type.name if room and room.room_type else "Room",
                    check_in_date=b.check_in_date if b else date.today(),
                    check_out_date=b.check_out_date if b else date.today(),
                    num_nights=b.num_nights if b else 1,
                    num_guests=b.num_guests if b else 1,
                    razorpay_order_id=p.razorpay_order_id,
                    razorpay_payment_id=p.razorpay_payment_id,
                    amount=p.amount,
                    currency=p.currency,
                    method=p.payment_method or (p.method.value if p.method else "CARD"),
                    status=p.status.value,
                    booking_status=b.booking_status.value if b else "CONFIRMED",
                    created_at=p.created_at,
                    updated_at=p.updated_at,
                    notes=p.notes,
                    refunds=[
                        RefundItemResponse(
                            id=r.id,
                            razorpay_refund_id=r.razorpay_refund_id,
                            refund_amount=r.refund_amount,
                            currency=r.currency,
                            reason=r.reason,
                            status=r.status,
                            processed_at=r.processed_at,
                        )
                        for r in p.refunds
                    ],
                )
            )
        return results

    @staticmethod
    def get_payment_receipt(
        db: Session,
        payment_id: int,
        user: Optional[User] = None,
    ) -> PaymentReceiptResponse:
        """
        Generates payment receipt details for verified transactions only.
        """
        payment = (
            db.query(Payment)
            .options(
                joinedload(Payment.booking).joinedload(Booking.room).joinedload(Room.room_type),
                joinedload(Payment.booking).joinedload(Booking.guest).joinedload(Guest.user),
            )
            .filter(Payment.id == payment_id)
            .first()
        )
        if not payment:
            raise HTTPException(status_code=404, detail="Payment record not found.")

        booking = payment.booking
        if not booking:
            raise HTTPException(status_code=404, detail="Associated booking not found.")

        # IDOR check if user is authenticated
        if user and user.role == UserRole.GUEST and payment.user_id != user.id:
            raise HTTPException(status_code=403, detail="Unauthorized access to payment receipt.")

        room = booking.room
        room_number = room.room_number if room else "N/A"
        room_type = room.room_type.name if room and room.room_type else "Luxury Suite"
        guest_user = booking.guest.user if booking.guest and booking.guest.user else None

        return PaymentReceiptResponse(
            hotel_name=settings.HOTEL_NAME,
            hotel_address=settings.HOTEL_ADDRESS,
            hotel_gstin=settings.HOTEL_GSTIN,
            hotel_contact_phone=settings.HOTEL_CONTACT_PHONE,
            hotel_contact_email=settings.HOTEL_CONTACT_EMAIL,
            receipt_number=f"REC-{payment.payment_reference}",
            booking_reference=booking.booking_reference,
            payment_id=payment.id,
            razorpay_payment_id=payment.razorpay_payment_id,
            razorpay_order_id=payment.razorpay_order_id,
            guest_name=guest_user.full_name if guest_user else "Valued Guest",
            guest_email=guest_user.email if guest_user else "guest@aurahotels.com",
            guest_phone=guest_user.phone if guest_user else None,
            room_number=room_number,
            room_type=room_type,
            check_in_date=booking.check_in_date,
            check_out_date=booking.check_out_date,
            total_nights=booking.num_nights,
            num_guests=booking.num_guests,
            price_per_night=booking.price_per_night,
            room_charges=booking.room_charges,
            taxes=booking.taxes,
            discount_amount=booking.discount_amount,
            total_amount=payment.amount,
            currency=payment.currency,
            payment_method=payment.payment_method or (payment.method.value if payment.method else "CARD"),
            payment_status=payment.status.value,
            payment_date=payment.updated_at or payment.created_at,
        )

    @staticmethod
    def get_admin_overview(
        db: Session,
        search: Optional[str] = None,
        status_filter: Optional[str] = None,
        limit: int = 50,
    ) -> PaymentStatsResponse:
        """
        Calculates financial analytics for Hotel Admin / Staff Dashboard:
        Revenue (strictly captured/verified SUCCESS payments), counts, and search/filter.
        """
        all_payments = (
            db.query(Payment)
            .options(
                joinedload(Payment.booking).joinedload(Booking.room).joinedload(Room.room_type),
                joinedload(Payment.booking).joinedload(Booking.guest).joinedload(Guest.user),
                joinedload(Payment.refunds),
            )
            .all()
        )

        total_revenue = sum(p.amount for p in all_payments if p.status == PaymentStatus.SUCCESS)
        total_successful = sum(1 for p in all_payments if p.status == PaymentStatus.SUCCESS)
        pending_count = sum(1 for p in all_payments if p.status == PaymentStatus.PENDING)
        failed_count = sum(1 for p in all_payments if p.status == PaymentStatus.FAILED)
        refunded_count = sum(1 for p in all_payments if p.status in [PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED])
        
        all_refunds = db.query(Refund).filter(Refund.status == "PROCESSED").all()
        total_refunded_amount = sum(r.refund_amount for r in all_refunds)

        # Filter recent transactions
        filtered = all_payments
        if status_filter and status_filter.upper() != "ALL":
            filtered = [p for p in filtered if p.status.value == status_filter.upper()]

        if search and search.strip():
            s = search.lower().strip()
            filtered = [
                p for p in filtered
                if (s in (p.payment_reference or "").lower())
                or (s in (p.razorpay_order_id or "").lower())
                or (s in (p.razorpay_payment_id or "").lower())
                or (p.booking and s in p.booking.booking_reference.lower())
                or (p.booking and p.booking.guest and p.booking.guest.user and s in p.booking.guest.user.full_name.lower())
                or (p.booking and p.booking.guest and p.booking.guest.user and s in p.booking.guest.user.email.lower())
            ]

        # Sort desc
        filtered.sort(key=lambda p: p.created_at, reverse=True)
        recent_paged = filtered[:limit]

        recent_mapped = []
        for p in recent_paged:
            b = p.booking
            room = b.room if b else None
            guest = b.guest if b else None
            guest_user = guest.user if guest else None

            recent_mapped.append(
                PaymentDetailResponse(
                    id=p.id,
                    payment_reference=p.payment_reference,
                    booking_id=b.id if b else 0,
                    booking_reference=b.booking_reference if b else "N/A",
                    user_id=p.user_id,
                    guest_name=guest_user.full_name if guest_user else "Guest",
                    guest_email=guest_user.email if guest_user else "N/A",
                    guest_phone=guest_user.phone if guest_user else None,
                    room_number=room.room_number if room else "N/A",
                    room_type=room.room_type.name if room and room.room_type else "Room",
                    check_in_date=b.check_in_date if b else date.today(),
                    check_out_date=b.check_out_date if b else date.today(),
                    num_nights=b.num_nights if b else 1,
                    num_guests=b.num_guests if b else 1,
                    razorpay_order_id=p.razorpay_order_id,
                    razorpay_payment_id=p.razorpay_payment_id,
                    amount=p.amount,
                    currency=p.currency,
                    method=p.payment_method or (p.method.value if p.method else "CARD"),
                    status=p.status.value,
                    booking_status=b.booking_status.value if b else "UNKNOWN",
                    created_at=p.created_at,
                    updated_at=p.updated_at,
                    notes=p.notes,
                    refunds=[
                        RefundItemResponse(
                            id=r.id,
                            razorpay_refund_id=r.razorpay_refund_id,
                            refund_amount=r.refund_amount,
                            currency=r.currency,
                            reason=r.reason,
                            status=r.status,
                            processed_at=r.processed_at,
                        )
                        for r in p.refunds
                    ],
                )
            )

        return PaymentStatsResponse(
            total_revenue=round(total_revenue, 2),
            total_successful_payments=total_successful,
            pending_payments=pending_count,
            failed_payments=failed_count,
            refunded_payments=refunded_count,
            total_refunded_amount=round(total_refunded_amount, 2),
            recent_transactions=recent_mapped,
        )
