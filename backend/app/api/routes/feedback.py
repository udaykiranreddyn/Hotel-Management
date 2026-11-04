import json
import random
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models.room import Room
from app.models.booking import Booking
from app.models.user import User, Guest
from app.models.feedback_notifications import (
    Review,
    Complaint,
    Notification,
    NotificationHistory,
)
from app.models.enums import (
    SentimentType,
    ComplaintCategory,
    ComplaintStatus,
    PriorityLevel,
    NotificationChannel,
    NotificationStatus,
    UserRole,
)
from app.schemas.feedback import (
    ReviewCreateRequest,
    ReviewResponse,
    ReviewSummaryResponse,
    ComplaintCreateRequest,
    ComplaintResolveRequest,
    ComplaintResponse,
    NotificationCreateRequest,
    NotificationResponse,
    NotificationSchedulerResult,
)
from app.services.ai_service import AIService

router = APIRouter()


# =========================================================================
# HELPER: AUTO-SEED REVIEWS, COMPLAINTS & NOTIFICATIONS IF EMPTY
# =========================================================================

def _seed_feedback_if_needed(db: Session):
    """Seed initial luxury guest reviews, complaints, and notifications if empty."""
    review_count = db.query(Review).count()
    if review_count > 0:
        return

    # Find existing bookings to attach reviews to
    bookings = db.query(Booking).order_by(Booking.id.asc()).limit(6).all()
    if not bookings:
        return

    sample_reviews_data = [
        {
            "rating": 5.0,
            "comment": "Extremely clean room for just ₹1,299! The AC cooled the room quickly, Wi-Fi was fast, and the front desk staff was very polite and helpful.",
            "sentiment": SentimentType.POSITIVE,
            "aspects": {"cleanliness": 5, "staff": 5, "comfort": 5},
        },
        {
            "rating": 5.0,
            "comment": "I stayed in the Standard room during a two-day business trip. Outstanding value for money, clean bathroom with hot water, and quiet sleep.",
            "sentiment": SentimentType.POSITIVE,
            "aspects": {"cleanliness": 5, "staff": 4, "comfort": 5},
        },
        {
            "rating": 4.8,
            "comment": "The Presidential Suite was utterly majestic! Ocean view from the 7th floor was breathtaking and the 24/7 private butler exceeded expectations.",
            "sentiment": SentimentType.POSITIVE,
            "aspects": {"cleanliness": 5, "staff": 5, "comfort": 5},
        },
        {
            "rating": 4.5,
            "comment": "Very comfortable stay and delicious breakfast buffet. Check-in was smooth and the luggage concierge was prompt.",
            "sentiment": SentimentType.POSITIVE,
            "aspects": {"cleanliness": 4, "staff": 5, "comfort": 4},
        },
        {
            "rating": 4.0,
            "comment": "Great ambiance and very spacious suite. Room service was slightly delayed by 10 minutes, but the food quality made up for it completely.",
            "sentiment": SentimentType.POSITIVE,
            "aspects": {"cleanliness": 4, "staff": 4, "comfort": 4},
        },
    ]

    for idx, sample in enumerate(sample_reviews_data):
        if idx < len(bookings):
            b = bookings[idx]
            db.add(Review(
                booking_id=b.id,
                guest_id=b.guest_id,
                rating=sample["rating"],
                comment=sample["comment"],
                sentiment=sample["sentiment"],
                aspect_ratings_json=json.dumps(sample["aspects"]),
            ))

    # Seed initial complaints if empty
    if db.query(Complaint).count() == 0 and bookings:
        first_b = bookings[0]
        db.add(Complaint(
            complaint_reference="CMP-202609-001",
            guest_id=first_b.guest_id,
            booking_id=first_b.id,
            room_id=first_b.room_id,
            category=ComplaintCategory.MAINTENANCE,
            priority=PriorityLevel.MEDIUM,
            department="Engineering & Maintenance",
            description="The air conditioner thermostat in Room takes longer than expected to cool down to 21°C.",
            status=ComplaintStatus.RESOLVED,
            resolution="AC filter inspected and refrigerant topped up by lead technician. Cooling back to prime.",
            resolved_at=datetime.utcnow() - timedelta(hours=4),
        ))

        db.add(Complaint(
            complaint_reference="CMP-202609-002",
            guest_id=first_b.guest_id,
            booking_id=first_b.id,
            room_id=first_b.room_id,
            category=ComplaintCategory.ROOM,
            priority=PriorityLevel.LOW,
            department="Housekeeping",
            description="Requested 2 additional goose-down pillows and extra bath towels for suite.",
            status=ComplaintStatus.OPEN,
            resolution=None,
        ))

    # Seed initial notifications if empty
    if db.query(Notification).count() == 0:
        guest_users = db.query(User).filter(User.role == UserRole.GUEST).all()
        for u in guest_users:
            db.add(Notification(
                recipient_user_id=u.id,
                title="Welcome to Aura Luxury Hotel",
                message="Your guest portal is active. Enjoy complimentary high-speed Wi-Fi and 24/7 concierge assistance during your stay.",
                channel=NotificationChannel.IN_SYSTEM,
                status=NotificationStatus.SENT,
                scheduled_at=datetime.utcnow() - timedelta(days=1),
                sent_at=datetime.utcnow() - timedelta(days=1),
            ))
            db.add(Notification(
                recipient_user_id=u.id,
                title="Pre-Arrival Concierge Service",
                message="Have special room requests or airport pick-up needs? Contact our front desk through the Guest Assistance desk.",
                channel=NotificationChannel.IN_SYSTEM,
                status=NotificationStatus.SCHEDULED,
                scheduled_at=datetime.utcnow() + timedelta(hours=2),
            ))

    db.commit()


# =========================================================================
# 1. GUEST REVIEWS ENDPOINTS
# =========================================================================

def _format_review_response(r: Review) -> ReviewResponse:
    booking_ref = r.booking.booking_reference if r.booking else f"BK-{r.booking_id}"
    guest_name = r.guest.user.full_name if (r.guest and r.guest.user) else "Verified Guest"
    room_number = r.booking.room.room_number if (r.booking and r.booking.room) else "N/A"
    room_type_name = r.booking.room.room_type.name if (r.booking and r.booking.room and r.booking.room.room_type) else "Luxury Suite"

    aspects = None
    if r.aspect_ratings_json:
        try:
            aspects = json.loads(r.aspect_ratings_json)
        except Exception:
            aspects = None

    return ReviewResponse(
        id=r.id,
        booking_reference=booking_ref,
        guest_name=guest_name,
        room_number=room_number,
        room_type_name=room_type_name,
        rating=r.rating,
        comment=r.comment,
        sentiment=r.sentiment.value if hasattr(r.sentiment, "value") else str(r.sentiment),
        aspect_ratings=aspects,
        created_at=r.created_at.strftime("%b %d, %Y") if r.created_at else "Recent",
    )


@router.get("/reviews", response_model=ReviewSummaryResponse)
def get_all_reviews(
    min_rating: Optional[float] = Query(None, ge=1.0, le=5.0),
    sentiment: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Retrieve all verified guest reviews with summary statistics:
    - Average Rating
    - Star Distribution Breakdown (1 to 5)
    - AI Sentiment Analysis Breakdown (Positive, Neutral, Negative)
    """
    _seed_feedback_if_needed(db)

    query = (
        db.query(Review)
        .options(
            joinedload(Review.booking).joinedload(Booking.room).joinedload(Room.room_type),
            joinedload(Review.guest).joinedload(Guest.user),
        )
        .order_by(Review.created_at.desc())
    )

    all_reviews = query.all()
    if not all_reviews:
        return ReviewSummaryResponse(
            total_reviews=0,
            average_rating=5.0,
            rating_distribution={"5": 0, "4": 0, "3": 0, "2": 0, "1": 0},
            sentiment_breakdown={"POSITIVE": 0, "NEUTRAL": 0, "NEGATIVE": 0},
            reviews=[],
        )

    # Compute statistics across all reviews
    total_reviews = len(all_reviews)
    avg_rating = round(sum(r.rating for r in all_reviews) / total_reviews, 2)

    distribution = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
    sentiment_counts = {"POSITIVE": 0, "NEUTRAL": 0, "NEGATIVE": 0}

    for r in all_reviews:
        star_key = str(min(5, max(1, int(round(r.rating)))))
        distribution[star_key] = distribution.get(star_key, 0) + 1
        
        sent_str = r.sentiment.value if hasattr(r.sentiment, "value") else str(r.sentiment)
        sentiment_counts[sent_str] = sentiment_counts.get(sent_str, 0) + 1

    # Filter for output if requested
    filtered_reviews = all_reviews
    if min_rating:
        filtered_reviews = [r for r in filtered_reviews if r.rating >= min_rating]
    if sentiment:
        filtered_reviews = [
            r for r in filtered_reviews 
            if (r.sentiment.value if hasattr(r.sentiment, "value") else str(r.sentiment)).upper() == sentiment.upper()
        ]

    formatted_reviews = [_format_review_response(r) for r in filtered_reviews]

    return ReviewSummaryResponse(
        total_reviews=total_reviews,
        average_rating=avg_rating,
        rating_distribution=distribution,
        sentiment_breakdown=sentiment_counts,
        reviews=formatted_reviews,
    )


@router.post("/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_guest_review(
    payload: ReviewCreateRequest,
    db: Session = Depends(get_db),
):
    """
    Submit a guest review for a confirmed booking.
    Automatically invokes the trained AI Sentiment NLP classifier to evaluate the review text,
    assigns sentiment and updates hotel feedback records.
    """
    # 1. Locate booking
    booking = (
        db.query(Booking)
        .options(
            joinedload(Booking.room).joinedload(Room.room_type),
            joinedload(Booking.guest).joinedload(Guest.user),
        )
        .filter(Booking.booking_reference == payload.booking_reference.strip().upper())
        .first()
    )

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reservation with reference '{payload.booking_reference}' not found.",
        )

    # 2. Run real Machine Learning Sentiment Analysis
    ai_result = AIService.analyze_sentiment(payload.comment, db=db)
    detected_sentiment = ai_result.sentiment.upper()
    if detected_sentiment == "NEGATIVE":
        sentiment_enum = SentimentType.NEGATIVE
    elif detected_sentiment == "NEUTRAL":
        sentiment_enum = SentimentType.NEUTRAL
    else:
        sentiment_enum = SentimentType.POSITIVE

    # 3. Pack aspect ratings
    aspects = {
        "cleanliness": payload.cleanliness_rating or 5,
        "staff": payload.staff_rating or 5,
        "comfort": payload.comfort_rating or 5,
        "ai_aspects": ai_result.detected_aspects,
    }

    # 4. Check if existing review exists
    existing_review = db.query(Review).filter(Review.booking_id == booking.id).first()
    if existing_review:
        existing_review.rating = payload.rating
        existing_review.comment = payload.comment
        existing_review.sentiment = sentiment_enum
        existing_review.aspect_ratings_json = json.dumps(aspects)
        review_obj = existing_review
    else:
        review_obj = Review(
            booking_id=booking.id,
            guest_id=booking.guest_id,
            rating=payload.rating,
            comment=payload.comment,
            sentiment=sentiment_enum,
            aspect_ratings_json=json.dumps(aspects),
        )
        db.add(review_obj)

    # 5. Send thank you notification to guest
    if booking.guest and booking.guest.user:
        db.add(Notification(
            recipient_user_id=booking.guest.user.id,
            booking_id=booking.id,
            title="Thank You for Your Review!",
            message=f"We have received your {payload.rating}★ rating for booking {booking.booking_reference}. Your feedback helps Aura Hotel maintain exceptional standards.",
            channel=NotificationChannel.IN_SYSTEM,
            status=NotificationStatus.SENT,
            scheduled_at=datetime.utcnow(),
            sent_at=datetime.utcnow(),
        ))

    db.commit()
    db.refresh(review_obj)

    return _format_review_response(review_obj)


# =========================================================================
# 2. GUEST COMPLAINTS & ASSISTANCE ENDPOINTS
# =========================================================================

def _format_complaint_response(c: Complaint) -> ComplaintResponse:
    guest_name = c.guest.user.full_name if (c.guest and c.guest.user) else "Hotel Guest"
    guest_email = c.guest.user.email if (c.guest and c.guest.user) else "guest@hotel.com"
    room_number = None
    if c.room_id and hasattr(c, "room") and c.room:
        room_number = c.room.room_number
    elif c.booking and c.booking.room:
        room_number = c.booking.room.room_number

    return ComplaintResponse(
        id=c.id,
        complaint_reference=c.complaint_reference,
        guest_name=guest_name,
        guest_email=guest_email,
        room_number=room_number,
        category=c.category.value if hasattr(c.category, "value") else str(c.category),
        priority=c.priority.value if hasattr(c.priority, "value") else str(c.priority),
        department=c.department,
        description=c.description,
        status=c.status.value if hasattr(c.status, "value") else str(c.status),
        resolution=c.resolution,
        created_at=c.created_at.strftime("%b %d, %Y %H:%M") if c.created_at else "Just now",
        resolved_at=c.resolved_at.strftime("%b %d, %Y %H:%M") if c.resolved_at else None,
    )


@router.get("/complaints", response_model=List[ComplaintResponse])
def get_complaints(
    status_filter: Optional[str] = Query(None, description="OPEN, INVESTIGATING, RESOLVED, CLOSED"),
    priority_filter: Optional[str] = Query(None, description="LOW, MEDIUM, HIGH, URGENT"),
    db: Session = Depends(get_db),
):
    """
    Staff / Concierge endpoint:
    List all guest tickets and complaints with live status and priority indicators.
    """
    _seed_feedback_if_needed(db)

    query = (
        db.query(Complaint)
        .options(
            joinedload(Complaint.guest).joinedload(Guest.user),
            joinedload(Complaint.booking).joinedload(Booking.room),
        )
        .order_by(Complaint.created_at.desc())
    )

    if status_filter:
        query = query.filter(Complaint.status == status_filter.upper())
    if priority_filter:
        query = query.filter(Complaint.priority == priority_filter.upper())

    results = query.all()
    return [_format_complaint_response(c) for c in results]


@router.post("/complaints", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def submit_complaint(
    payload: ComplaintCreateRequest,
    db: Session = Depends(get_db),
):
    """
    Guest Concierge:
    Submit an issue, maintenance notice, or service request.
    AI NLP scans urgency, auto-classifies complaint priority (URGENT / HIGH / MEDIUM / LOW),
    and assigns it to the designated hotel department.
    """
    # 1. Match guest user
    user = db.query(User).filter(User.email == payload.guest_email.strip().lower()).first()
    if not user:
        # Create lightweight guest user profile
        user = User(
            email=payload.guest_email.strip().lower(),
            hashed_password="NOPASSWORD_GUEST",
            full_name=payload.guest_email.split("@")[0].replace(".", " ").title(),
            role=UserRole.GUEST,
        )
        db.add(user)
        db.flush()
        guest = Guest(id=user.id)
        db.add(guest)
        db.flush()
    else:
        guest = db.query(Guest).filter(Guest.id == user.id).first()
        if not guest:
            guest = Guest(id=user.id)
            db.add(guest)
            db.flush()

    # 2. Match booking and room if provided
    booking_id = None
    room_id = None
    if payload.booking_reference:
        bk = db.query(Booking).filter(Booking.booking_reference == payload.booking_reference.strip().upper()).first()
        if bk:
            booking_id = bk.id
            room_id = bk.room_id

    if payload.room_number and not room_id:
        rm = db.query(Room).filter(Room.room_number == payload.room_number.strip()).first()
        if rm:
            room_id = rm.id

    # 3. AI Sentiment & Urgency Assessment
    ai_eval = AIService.analyze_sentiment(payload.description, db=db)
    urgency_priority = ai_eval.priority_level.upper()
    priority_map = {
        "URGENT": PriorityLevel.URGENT,
        "HIGH": PriorityLevel.HIGH,
        "MEDIUM": PriorityLevel.MEDIUM,
        "LOW": PriorityLevel.LOW,
    }
    priority_enum = priority_map.get(urgency_priority, PriorityLevel.MEDIUM)

    # 4. Map department
    cat_upper = payload.category.upper()
    if "CLEAN" in cat_upper:
        category_enum = ComplaintCategory.CLEANLINESS
        dept = "Housekeeping & Hygiene"
    elif "MAINT" in cat_upper or "ROOM" in cat_upper or "AC" in cat_upper:
        category_enum = ComplaintCategory.MAINTENANCE
        dept = "Engineering & Facilities"
    elif "FOOD" in cat_upper or "DINING" in cat_upper:
        category_enum = ComplaintCategory.FOOD
        dept = "Food & Beverage Operations"
    elif "STAFF" in cat_upper:
        category_enum = ComplaintCategory.STAFF
        dept = "Guest Relations Management"
    else:
        category_enum = ComplaintCategory.SERVICE
        dept = "Front Desk Concierge"

    # 5. Generate reference
    ref_code = f"CMP-{datetime.utcnow().strftime('%Y%m')}-{random.randint(1000, 9999)}"

    # 6. Save complaint
    complaint = Complaint(
        complaint_reference=ref_code,
        guest_id=guest.id,
        booking_id=booking_id,
        room_id=room_id,
        category=category_enum,
        priority=priority_enum,
        department=dept,
        description=payload.description,
        status=ComplaintStatus.OPEN,
    )
    db.add(complaint)

    # 7. Create notification for guest confirming receipt
    db.add(Notification(
        recipient_user_id=user.id,
        booking_id=booking_id,
        title=f"Assistance Ticket Registered [{ref_code}]",
        message=f"We have registered your ticket regarding '{category_enum.value}'. Assigned to {dept} with {priority_enum.value} priority. Our team is attending to it immediately.",
        channel=NotificationChannel.IN_SYSTEM,
        status=NotificationStatus.SENT,
        scheduled_at=datetime.utcnow(),
        sent_at=datetime.utcnow(),
    ))

    db.commit()
    db.refresh(complaint)

    return _format_complaint_response(complaint)


@router.patch("/complaints/{complaint_id}/resolve", response_model=ComplaintResponse)
def resolve_complaint(
    complaint_id: int,
    payload: ComplaintResolveRequest,
    db: Session = Depends(get_db),
):
    """
    Staff Action:
    Mark a guest complaint as RESOLVED or CLOSED with detailed resolution notes.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint ticket not found.")

    new_status = ComplaintStatus.RESOLVED
    if payload.status.upper() == "CLOSED":
        new_status = ComplaintStatus.CLOSED
    elif payload.status.upper() == "INVESTIGATING":
        new_status = ComplaintStatus.INVESTIGATING

    complaint.status = new_status
    complaint.resolution = payload.resolution
    complaint.resolved_at = datetime.utcnow()

    # Notify guest about resolution
    if complaint.guest and complaint.guest.user:
        db.add(Notification(
            recipient_user_id=complaint.guest.user.id,
            booking_id=complaint.booking_id,
            title=f"Ticket Resolved [{complaint.complaint_reference}]",
            message=f"Hotel update on your request: {payload.resolution}. Thank you for your patience.",
            channel=NotificationChannel.IN_SYSTEM,
            status=NotificationStatus.SENT,
            scheduled_at=datetime.utcnow(),
            sent_at=datetime.utcnow(),
        ))

    db.commit()
    db.refresh(complaint)

    return _format_complaint_response(complaint)


# =========================================================================
# 3. NOTIFICATIONS & SCHEDULER BATCH RUNNER
# =========================================================================

@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    email: Optional[str] = Query(None, description="Filter notifications for specific guest email"),
    unread_only: bool = Query(False, description="Filter for unread notifications only"),
    db: Session = Depends(get_db),
):
    """
    Retrieve notification stream for a specific user or hotel staff audit feed.
    """
    _seed_feedback_if_needed(db)

    query = (
        db.query(Notification)
        .options(joinedload(Notification.recipient))
        .order_by(Notification.created_at.desc())
    )

    if email:
        user = db.query(User).filter(User.email == email.strip().lower()).first()
        if user:
            query = query.filter(Notification.recipient_user_id == user.id)
        else:
            return []

    if unread_only:
        query = query.filter(Notification.read_at.is_(None))

    notifications = query.limit(50).all()

    return [
        NotificationResponse(
            id=n.id,
            recipient_name=n.recipient.full_name if n.recipient else "Guest",
            recipient_email=n.recipient.email if n.recipient else "N/A",
            title=n.title,
            message=n.message,
            channel=n.channel.value if hasattr(n.channel, "value") else str(n.channel),
            status=n.status.value if hasattr(n.status, "value") else str(n.status),
            scheduled_at=n.scheduled_at.strftime("%b %d, %Y %H:%M") if n.scheduled_at else "Now",
            sent_at=n.sent_at.strftime("%b %d, %Y %H:%M") if n.sent_at else None,
            read_at=n.read_at.strftime("%b %d, %Y %H:%M") if n.read_at else None,
            created_at=n.created_at.strftime("%b %d, %Y %H:%M") if n.created_at else "Recent",
        )
        for n in notifications
    ]


@router.post("/notifications", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_scheduled_notification(
    payload: NotificationCreateRequest,
    db: Session = Depends(get_db),
):
    """
    Schedule a notification (pre-arrival email, checkout reminder, or service notice).
    """
    user = db.query(User).filter(User.email == payload.recipient_email.strip().lower()).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"User with email '{payload.recipient_email}' does not exist.",
        )

    seconds = payload.scheduled_seconds_from_now or 0
    now = datetime.utcnow()
    scheduled_time = now + timedelta(seconds=seconds)
    initial_status = NotificationStatus.SENT if seconds <= 0 else NotificationStatus.SCHEDULED
    sent_time = now if seconds <= 0 else None

    booking_id = None
    if payload.booking_reference:
        bk = db.query(Booking).filter(Booking.booking_reference == payload.booking_reference.strip().upper()).first()
        if bk:
            booking_id = bk.id

    notif = Notification(
        recipient_user_id=user.id,
        booking_id=booking_id,
        title=payload.title,
        message=payload.message,
        channel=NotificationChannel.IN_SYSTEM,
        status=initial_status,
        scheduled_at=scheduled_time,
        sent_at=sent_time,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    return NotificationResponse(
        id=notif.id,
        recipient_name=user.full_name,
        recipient_email=user.email,
        title=notif.title,
        message=notif.message,
        channel=notif.channel.value if hasattr(notif.channel, "value") else str(notif.channel),
        status=notif.status.value if hasattr(notif.status, "value") else str(notif.status),
        scheduled_at=notif.scheduled_at.strftime("%b %d, %Y %H:%M"),
        sent_at=notif.sent_at.strftime("%b %d, %Y %H:%M") if notif.sent_at else None,
        read_at=None,
        created_at=notif.created_at.strftime("%b %d, %Y %H:%M"),
    )


@router.post("/notifications/run-scheduler", response_model=NotificationSchedulerResult)
def run_notification_scheduler_batch(
    db: Session = Depends(get_db),
):
    """
    Pre-arrival & Post-stay Automated Notification Scheduler:
    Triggers batch delivery check: all pending notifications whose scheduled time has passed
    are dispatched and logged in the notification history audit table.
    """
    now = datetime.utcnow()

    # Find pending/scheduled notifications ready to send
    due_notifications = (
        db.query(Notification)
        .filter(
            Notification.status == NotificationStatus.SCHEDULED,
            Notification.scheduled_at <= now,
        )
        .all()
    )

    delivered_count = 0
    for notif in due_notifications:
        notif.status = NotificationStatus.SENT
        notif.sent_at = now
        db.add(NotificationHistory(
            notification_id=notif.id,
            status=NotificationStatus.SENT,
            attempted_at=now,
        ))
        delivered_count += 1

    db.commit()

    return NotificationSchedulerResult(
        processed_count=len(due_notifications),
        delivered_count=delivered_count,
        timestamp=now.strftime("%Y-%m-%d %H:%M:%S UTC"),
        message=f"Scheduler executed successfully. Dispatched {delivered_count} due automated notifications.",
    )


@router.patch("/notifications/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
):
    """Mark a notification as read by the guest."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")

    notif.read_at = datetime.utcnow()
    notif.status = NotificationStatus.READ
    db.commit()

    return {"status": "success", "message": "Notification marked as read."}
