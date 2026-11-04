from sqlalchemy import Column, Integer, String, Float, Boolean, Table, ForeignKey, Text, Enum as SQLEnum, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
from app.models.base import TimestampMixin
from app.models.enums import RoomStatus, RoomTypeCategory

# Association Table for Many-to-Many between Room and Amenity
room_amenities = Table(
    "room_amenities",
    Base.metadata,
    Column("room_id", Integer, ForeignKey("rooms.id", ondelete="CASCADE"), primary_key=True),
    Column("amenity_id", Integer, ForeignKey("amenities.id", ondelete="CASCADE"), primary_key=True),
)


class Amenity(Base):
    __tablename__ = "amenities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)  # Wi-Fi, AC, Balcony, etc.
    icon = Column(String(50), nullable=True)  # Lucide icon identifier
    description = Column(String(255), nullable=True)

    rooms = relationship("Room", secondary=room_amenities, back_populates="amenities")

    def __repr__(self):
        return f"<Amenity id={self.id} name='{self.name}'>"


class RoomType(Base, TimestampMixin):
    __tablename__ = "room_types"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    category = Column(SQLEnum(RoomTypeCategory), default=RoomTypeCategory.STANDARD, nullable=False)
    base_price = Column(Float, nullable=False)
    capacity = Column(Integer, default=2, nullable=False)
    bed_type = Column(String(100), default="King Bed", nullable=False)
    image_url = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)

    rooms = relationship("Room", back_populates="room_type")

    def __repr__(self):
        return f"<RoomType id={self.id} name='{self.name}' price={self.base_price}>"


class Room(Base, TimestampMixin):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_number = Column(String(20), unique=True, index=True, nullable=False)
    room_type_id = Column(Integer, ForeignKey("room_types.id", ondelete="RESTRICT"), nullable=False)
    floor = Column(Integer, default=1, nullable=False)
    current_status = Column(SQLEnum(RoomStatus), default=RoomStatus.AVAILABLE, nullable=False, index=True)
    price_per_night = Column(Float, nullable=False)
    view_type = Column(String(100), default="City View", nullable=False)  # Ocean View, Garden View, City View
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    room_type = relationship("RoomType", back_populates="rooms")
    amenities = relationship("Amenity", secondary=room_amenities, back_populates="rooms")
    bookings = relationship("Booking", back_populates="room")
    status_history = relationship("RoomStatusHistory", back_populates="room", cascade="all, delete-orphan")
    housekeeping_tasks = relationship("HousekeepingTask", back_populates="room", cascade="all, delete-orphan")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="room", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Room id={self.id} number='{self.room_number}' status='{self.current_status}'>"


class RoomStatusHistory(Base):
    __tablename__ = "room_status_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = Column(SQLEnum(RoomStatus), nullable=False)
    new_status = Column(SQLEnum(RoomStatus), nullable=False)
    changed_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    room = relationship("Room", back_populates="status_history")
    changed_by = relationship("User")

    def __repr__(self):
        return f"<RoomStatusHistory room_id={self.room_id} {self.previous_status} -> {self.new_status}>"
