from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, Enum as SQLEnum, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
from app.models.base import TimestampMixin
from app.models.enums import PaymentMethod, PaymentStatus


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    payment_reference = Column(String(50), unique=True, index=True, nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # Razorpay Gateway Identifiers
    razorpay_order_id = Column(String(100), unique=True, index=True, nullable=True)
    razorpay_payment_id = Column(String(100), unique=True, index=True, nullable=True)
    razorpay_signature = Column(String(255), nullable=True)

    # Financial Details
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)

    # Method & Status
    method = Column(SQLEnum(PaymentMethod), default=PaymentMethod.CARD, nullable=True)
    payment_method = Column(String(50), nullable=True)  # string representation: upi, card, netbanking, etc.
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False, index=True)
    
    transaction_id = Column(String(100), index=True, nullable=True)
    transaction_reference = Column(String(100), index=True, nullable=True)

    notes = Column(Text, nullable=True)
    error_code = Column(String(100), nullable=True)
    error_description = Column(Text, nullable=True)

    # Relationships
    booking = relationship("Booking", back_populates="payments")
    user = relationship("User")
    refunds = relationship("Refund", back_populates="payment", cascade="all, delete-orphan")
    history = relationship("PaymentHistory", back_populates="payment", cascade="all, delete-orphan")

    @property
    def payment_status(self):
        return self.status

    @payment_status.setter
    def payment_status(self, val):
        self.status = val

    def __repr__(self):
        return f"<Payment ref='{self.payment_reference}' rzp_order='{self.razorpay_order_id}' amount={self.amount} status='{self.status}'>"


class Refund(Base, TimestampMixin):
    __tablename__ = "refunds"

    id = Column(Integer, primary_key=True, autoincrement=True)
    payment_id = Column(Integer, ForeignKey("payments.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    
    razorpay_refund_id = Column(String(100), unique=True, index=True, nullable=True)
    refund_amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    reason = Column(String(255), nullable=False)
    status = Column(String(50), default="PROCESSED", nullable=False)
    processed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    payment = relationship("Payment", back_populates="refunds")
    booking = relationship("Booking")

    def __repr__(self):
        return f"<Refund id={self.id} payment_id={self.payment_id} rzp_refund='{self.razorpay_refund_id}' amount={self.refund_amount}>"


class PaymentHistory(Base):
    __tablename__ = "payment_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    payment_id = Column(Integer, ForeignKey("payments.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = Column(SQLEnum(PaymentStatus), nullable=False)
    new_status = Column(SQLEnum(PaymentStatus), nullable=False)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    payment = relationship("Payment", back_populates="history")

    def __repr__(self):
        return f"<PaymentHistory payment_id={self.payment_id} {self.previous_status} -> {self.new_status}>"
