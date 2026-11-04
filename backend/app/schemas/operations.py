from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, Field
from app.models.enums import RoomStatus, HousekeepingStatus, MaintenanceStatus, PriorityLevel


class FrontDeskRoomItem(BaseModel):
    room_id: int
    room_number: str
    floor: int
    room_type_name: str
    price_per_night: float
    status: RoomStatus
    current_guest_name: Optional[str] = None
    current_guest_phone: Optional[str] = None
    current_booking_ref: Optional[str] = None
    check_in_date: Optional[date] = None
    check_out_date: Optional[date] = None

    class Config:
        from_attributes = True


class FrontDeskCheckInOutRequest(BaseModel):
    booking_reference: str
    notes: Optional[str] = None


class HousekeepingTaskItem(BaseModel):
    task_id: int
    room_id: int
    room_number: str
    status: HousekeepingStatus
    assigned_staff_name: Optional[str] = None
    inspection_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class HousekeepingStatusUpdateRequest(BaseModel):
    status: HousekeepingStatus
    notes: Optional[str] = None


class MaintenanceTicketItem(BaseModel):
    ticket_id: int
    room_id: int
    room_number: str
    issue_title: str
    description: str
    priority: PriorityLevel
    status: MaintenanceStatus
    reported_by_name: Optional[str] = None
    assigned_tech_name: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MaintenanceTicketCreateRequest(BaseModel):
    room_id: int
    issue_title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=5)
    priority: PriorityLevel = PriorityLevel.MEDIUM


class MaintenanceTicketResolveRequest(BaseModel):
    status: MaintenanceStatus = MaintenanceStatus.RESOLVED
    resolution_notes: str = Field(..., min_length=3)


class AdminMetricsResponse(BaseModel):
    total_rooms: int
    available_rooms: int
    occupied_rooms: int
    cleaning_rooms: int
    maintenance_rooms: int
    occupancy_percentage: float
    total_revenue: float
    total_bookings: int
    active_reservations: int
