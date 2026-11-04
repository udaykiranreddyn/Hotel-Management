from typing import List, Optional
from datetime import date
from pydantic import BaseModel, Field
from app.models.enums import RoomStatus, RoomTypeCategory


class AmenityItem(BaseModel):
    id: int
    name: str
    icon: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class RoomTypeItem(BaseModel):
    id: int
    name: str
    category: RoomTypeCategory
    base_price: float
    capacity: int
    bed_type: str
    image_url: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class RoomItemResponse(BaseModel):
    id: int
    room_number: str
    room_type: RoomTypeItem
    floor: int
    current_status: RoomStatus
    price_per_night: float
    view_type: str
    is_active: bool
    amenities: List[AmenityItem] = []
    is_available: bool = True

    class Config:
        from_attributes = True


class RoomAvailabilityCheckRequest(BaseModel):
    room_id: int
    check_in: date
    check_out: date


class RoomAvailabilityCheckResponse(BaseModel):
    room_id: int
    check_in: date
    check_out: date
    is_available: bool
    conflict_message: Optional[str] = None
    total_nights: int
    price_per_night: float
    estimated_total: float
