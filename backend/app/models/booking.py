from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, Enum as SQLEnum, Date, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
from app.models.base import TimestampMixin
from app.models.enums import BookingStatus, PaymentStatus


class Booking(Base, TimestampMixin):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_reference = Column(String(50), unique=True, index=True, nullable=False)  # e.g., BK202609001
    guest_id = Column(Integer, ForeignKey("guests.id", ondelete="RESTRICT"), nullable=False, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    check_in_date = Column(Date, nullable=False, index=True)
    check_out_date = Column(Date, nullable=False, index=True)
    num_guests = Column(Integer, default=1, nullable=False)
    num_nights = Column(Integer, default=1, nullable=False)
    
    price_per_night = Column(Float, nullable=False)
    room_charges = Column(Float, nullable=False)
    extra_charges = Column(Float, default=0.0, nullable=False)  # Services, dining, laundry
    taxes = Column(Float, default=0.0, nullable=False)
    discount_amount = Column(Float, default=0.0, nullable=False)
    total_amount = Column(Float, nullable=False)
    
    booking_status = Column(SQLEnum(BookingStatus), default=BookingStatus.PENDING_PAYMENT, nullable=False, index=True)
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False, index=True)
    special_requests = Column(Text, nullable=True)

    # Relationships
    guest = relationship("Guest", back_populates="bookings")
    room = relationship("Room", back_populates="bookings")
    payments = relationship("Payment", back_populates="booking", cascade="all, delete-orphan")
    history = relationship("BookingHistory", back_populates="booking", cascade="all, delete-orphan")
    service_requests = relationship("ServiceRequest", back_populates="booking")
    restaurant_orders = relationship("RestaurantOrder", back_populates="booking")
    laundry_requests = relationship("LaundryRequest", back_populates="booking")
    complaints = relationship("Complaint", back_populates="booking")
    review = relationship("Review", back_populates="booking", uselist=False)

    def __repr__(self):
        return f"<Booking ref='{self.booking_reference}' room={self.room_id} status='{self.booking_status}'>"


class BookingHistory(Base):
    __tablename__ = "booking_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = Column(SQLEnum(BookingStatus), nullable=False)
    new_status = Column(SQLEnum(BookingStatus), nullable=False)
    changed_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    booking = relationship("Booking", back_populates="history")
    changed_by = relationship("User")

    def __repr__(self):
        return f"<BookingHistory booking_id={self.booking_id} {self.previous_status} -> {self.new_status}>"


class Coupon(Base, TimestampMixin):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    discount_type = Column(String(20), default="PERCENTAGE", nullable=False)  # PERCENTAGE or FLAT
    discount_value = Column(Float, nullable=False)
    min_amount = Column(Float, default=0.0, nullable=False)
    max_discount = Column(Float, nullable=True)
    valid_from = Column(DateTime, nullable=False)
    valid_to = Column(DateTime, nullable=False)
    usage_limit = Column(Integer, default=100, nullable=False)
    times_used = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    def __repr__(self):
        return f"<Coupon code='{self.code}' discount={self.discount_value}>"
