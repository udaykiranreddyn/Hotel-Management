from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from app.core.database import Base
from app.models.base import TimestampMixin


class WebhookEvent(Base, TimestampMixin):
    """
    Persists received Razorpay webhook events to guarantee strict idempotency
    and avoid duplicate processing of payment / refund confirmations.
    """
    __tablename__ = "webhook_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(100), unique=True, index=True, nullable=False)
    event_type = Column(String(100), index=True, nullable=False)
    entity_id = Column(String(100), index=True, nullable=True)  # payment_id or order_id
    payload = Column(Text, nullable=True)
    status = Column(String(50), default="PROCESSED", nullable=False)  # PROCESSED, IGNORED, FAILED
    processed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<WebhookEvent event_id='{self.event_id}' type='{self.event_type}' status='{self.status}'>"
