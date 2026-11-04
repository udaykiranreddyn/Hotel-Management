from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, Enum as SQLEnum, DateTime, Boolean, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
from app.models.base import TimestampMixin
from app.models.enums import (
    PriorityLevel,
    ServiceRequestStatus,
    RestaurantOrderStatus,
    LaundryStatus,
    HousekeepingStatus,
    MaintenanceStatus,
)


class Service(Base, TimestampMixin):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)  # Spa, Airport Shuttle, Extra Bed, Laundry
    category = Column(String(50), default="General", nullable=False)
    price = Column(Float, default=0.0, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    description = Column(String(255), nullable=True)

    requests = relationship("ServiceRequest", back_populates="service")

    def __repr__(self):
        return f"<Service id={self.id} name='{self.name}' price={self.price}>"


class ServiceRequest(Base, TimestampMixin):
    __tablename__ = "service_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    guest_id = Column(Integer, ForeignKey("guests.id", ondelete="CASCADE"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="RESTRICT"), nullable=False)
    priority = Column(SQLEnum(PriorityLevel), default=PriorityLevel.MEDIUM, nullable=False)
    status = Column(SQLEnum(ServiceRequestStatus), default=ServiceRequestStatus.PENDING, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    booking = relationship("Booking", back_populates="service_requests")
    service = relationship("Service", back_populates="requests")

    def __repr__(self):
        return f"<ServiceRequest id={self.id} status='{self.status}'>"


class RestaurantOrder(Base, TimestampMixin):
    __tablename__ = "restaurant_orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    guest_id = Column(Integer, ForeignKey("guests.id", ondelete="CASCADE"), nullable=False)
    items_json = Column(Text, nullable=False)  # JSON serialized array of ordered food items & quantities
    total_price = Column(Float, nullable=False)
    status = Column(SQLEnum(RestaurantOrderStatus), default=RestaurantOrderStatus.PENDING, nullable=False, index=True)
    special_instructions = Column(Text, nullable=True)
    delivered_at = Column(DateTime, nullable=True)

    booking = relationship("Booking", back_populates="restaurant_orders")

    def __repr__(self):
        return f"<RestaurantOrder id={self.id} total={self.total_price} status='{self.status}'>"


class LaundryRequest(Base, TimestampMixin):
    __tablename__ = "laundry_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    guest_id = Column(Integer, ForeignKey("guests.id", ondelete="CASCADE"), nullable=False)
    items_json = Column(Text, nullable=False)  # JSON serialized laundry items & count
    total_charges = Column(Float, default=0.0, nullable=False)
    status = Column(SQLEnum(LaundryStatus), default=LaundryStatus.REQUESTED, nullable=False, index=True)
    delivered_at = Column(DateTime, nullable=True)

    booking = relationship("Booking", back_populates="laundry_requests")

    def __repr__(self):
        return f"<LaundryRequest id={self.id} status='{self.status}'>"


class HousekeepingTask(Base, TimestampMixin):
    __tablename__ = "housekeeping"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_employee_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    status = Column(SQLEnum(HousekeepingStatus), default=HousekeepingStatus.ASSIGNED, nullable=False, index=True)
    inspection_notes = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    room = relationship("Room", back_populates="housekeeping_tasks")
    assigned_employee = relationship("Employee", back_populates="assigned_housekeeping")

    def __repr__(self):
        return f"<HousekeepingTask id={self.id} room_id={self.room_id} status='{self.status}'>"


class MaintenanceRequest(Base, TimestampMixin):
    __tablename__ = "maintenance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    reported_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_employee_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    issue_title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(SQLEnum(PriorityLevel), default=PriorityLevel.MEDIUM, nullable=False)
    status = Column(SQLEnum(MaintenanceStatus), default=MaintenanceStatus.OPEN, nullable=False, index=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    room = relationship("Room", back_populates="maintenance_requests")
    reported_by = relationship("User", foreign_keys=[reported_by_user_id])
    assigned_employee = relationship("Employee", back_populates="assigned_maintenance", foreign_keys=[assigned_employee_id])

    def __repr__(self):
        return f"<MaintenanceRequest id={self.id} issue='{self.issue_title}' status='{self.status}'>"


class InventoryItem(Base, TimestampMixin):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, autoincrement=True)
    item_name = Column(String(100), unique=True, nullable=False)
    category = Column(String(50), nullable=False)  # Linens, Toiletries, Cleaning, Kitchen
    quantity = Column(Integer, default=0, nullable=False)
    min_quantity = Column(Integer, default=10, nullable=False)
    unit = Column(String(20), default="pcs", nullable=False)  # pcs, bottles, packs, kg
    unit_price = Column(Float, default=0.0, nullable=False)
    supplier = Column(String(150), nullable=True)

    history = relationship("InventoryHistory", back_populates="item", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<InventoryItem id={self.id} name='{self.item_name}' qty={self.quantity}>"


class InventoryHistory(Base):
    __tablename__ = "inventory_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    item_id = Column(Integer, ForeignKey("inventory.id", ondelete="CASCADE"), nullable=False, index=True)
    change_type = Column(String(30), nullable=False)  # PURCHASE, USAGE, AUDIT_ADJUSTMENT
    quantity_changed = Column(Integer, nullable=False)
    balance_quantity = Column(Integer, nullable=False)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    item = relationship("InventoryItem", back_populates="history")


class EmployeeShift(Base):
    __tablename__ = "employee_shifts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    shift_name = Column(String(50), nullable=False)  # Morning, Evening, Night
    start_time = Column(String(20), nullable=False)  # e.g., "08:00"
    end_time = Column(String(20), nullable=False)    # e.g., "16:00"
    date = Column(Date, default=datetime.utcnow().date, nullable=False)

    employee = relationship("Employee", back_populates="shifts")
