from sqlalchemy import Column, Integer, String, Boolean, Enum as SQLEnum, ForeignKey, Text, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
from app.models.base import TimestampMixin
from app.models.enums import UserRole


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(30), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.GUEST, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    guest_profile = relationship("Guest", back_populates="user", uselist=False, cascade="all, delete-orphan")
    employee_profile = relationship("Employee", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="recipient", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")

    def __repr__(self):
        return f"<User id={self.id} email='{self.email}' role='{self.role}'>"


class Guest(Base, TimestampMixin):
    __tablename__ = "guests"

    id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), default="India", nullable=True)
    id_proof_type = Column(String(50), nullable=True)  # Passport, Aadhaar, Driving License
    id_proof_number = Column(String(100), nullable=True)
    preferences = Column(Text, nullable=True)  # High floor, king bed, non-smoking, etc.
    loyalty_points = Column(Integer, default=0, nullable=False)

    # Relationships
    user = relationship("User", back_populates="guest_profile")
    bookings = relationship("Booking", back_populates="guest")
    complaints = relationship("Complaint", back_populates="guest")
    reviews = relationship("Review", back_populates="guest")

    def __repr__(self):
        return f"<Guest id={self.id} points={self.loyalty_points}>"


class Employee(Base, TimestampMixin):
    __tablename__ = "employees"

    id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    department = Column(String(100), nullable=False)  # Front Desk, Housekeeping, Maintenance, Kitchen, etc.
    designation = Column(String(100), nullable=False)  # Receptionist, Supervisor, Lead Technician
    salary = Column(Float, nullable=True)
    hire_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    shift_details = Column(String(100), default="Morning (08:00 - 16:00)", nullable=True)

    # Relationships
    user = relationship("User", back_populates="employee_profile")
    assigned_maintenance = relationship("MaintenanceRequest", back_populates="assigned_employee", foreign_keys="MaintenanceRequest.assigned_employee_id")
    assigned_housekeeping = relationship("HousekeepingTask", back_populates="assigned_employee")
    shifts = relationship("EmployeeShift", back_populates="employee")

    def __repr__(self):
        return f"<Employee id={self.id} department='{self.department}' designation='{self.designation}'>"
