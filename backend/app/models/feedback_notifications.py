from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, Enum as SQLEnum, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
from app.models.base import TimestampMixin
from app.models.enums import (
    SentimentType,
    ComplaintCategory,
    ComplaintStatus,
    PriorityLevel,
    NotificationChannel,
    NotificationStatus,
)


class Review(Base, TimestampMixin):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    guest_id = Column(Integer, ForeignKey("guests.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Float, nullable=False)  # 1.0 to 5.0
    comment = Column(Text, nullable=False)
    sentiment = Column(SQLEnum(SentimentType), default=SentimentType.POSITIVE, nullable=False)
    aspect_ratings_json = Column(Text, nullable=True)  # JSON: {cleanliness: 5, staff: 4, food: 5, room: 5}

    booking = relationship("Booking", back_populates="review")
    guest = relationship("Guest", back_populates="reviews")

    def __repr__(self):
        return f"<Review id={self.id} rating={self.rating} sentiment='{self.sentiment}'>"


class Complaint(Base, TimestampMixin):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, autoincrement=True)
    complaint_reference = Column(String(50), unique=True, index=True, nullable=False)  # CMP202609001
    guest_id = Column(Integer, ForeignKey("guests.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="SET NULL"), nullable=True)
    category = Column(SQLEnum(ComplaintCategory), default=ComplaintCategory.ROOM, nullable=False)
    priority = Column(SQLEnum(PriorityLevel), default=PriorityLevel.MEDIUM, nullable=False)
    department = Column(String(100), default="Front Desk", nullable=False)
    description = Column(Text, nullable=False)
    status = Column(SQLEnum(ComplaintStatus), default=ComplaintStatus.OPEN, nullable=False, index=True)
    resolution = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    guest = relationship("Guest", back_populates="complaints")
    booking = relationship("Booking", back_populates="complaints")

    def __repr__(self):
        return f"<Complaint ref='{self.complaint_reference}' category='{self.category}' status='{self.status}'>"


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    recipient_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    channel = Column(SQLEnum(NotificationChannel), default=NotificationChannel.IN_SYSTEM, nullable=False)
    status = Column(SQLEnum(NotificationStatus), default=NotificationStatus.SCHEDULED, nullable=False, index=True)
    scheduled_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    sent_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)

    recipient = relationship("User", back_populates="notifications")
    history = relationship("NotificationHistory", back_populates="notification", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Notification id={self.id} title='{self.title}' status='{self.status}'>"


class NotificationHistory(Base):
    __tablename__ = "notification_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    notification_id = Column(Integer, ForeignKey("notifications.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(SQLEnum(NotificationStatus), nullable=False)
    attempted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    error_details = Column(String(255), nullable=True)

    notification = relationship("Notification", back_populates="history")


class AIPredictionHistory(Base):
    __tablename__ = "ai_prediction_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    model_name = Column(String(100), nullable=False, index=True)  # e.g., "RoomRecommendationModel", "OccupancyPredictor"
    model_version = Column(String(20), default="1.0.0", nullable=False)
    input_data_json = Column(Text, nullable=False)
    prediction_output_json = Column(Text, nullable=False)
    accuracy_metric = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<AIPredictionHistory model='{self.model_name}' v={self.model_version}>"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False)  # CREATE_BOOKING, CHECK_IN, CHECK_OUT, CANCEL_BOOKING
    entity_type = Column(String(50), nullable=False)  # booking, room, payment, guest
    entity_id = Column(String(50), nullable=True)
    ip_address = Column(String(50), nullable=True)
    changes_json = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog action='{self.action}' entity='{self.entity_type}' at={self.timestamp}>"
