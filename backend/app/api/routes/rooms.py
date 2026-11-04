from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models.room import Room, RoomType, Amenity
from app.models.booking import Booking
from app.models.enums import RoomStatus, BookingStatus, RoomTypeCategory
from app.schemas.room import (
    RoomItemResponse,
    RoomTypeItem,
    AmenityItem,
    RoomAvailabilityCheckRequest,
    RoomAvailabilityCheckResponse,
)

router = APIRouter()


@router.get("/", response_model=List[RoomItemResponse])
def get_rooms(
    check_in: Optional[date] = Query(None, description="Check-in date"),
    check_out: Optional[date] = Query(None, description="Check-out date"),
    category: Optional[str] = Query(None, description="Filter by category: Standard, Deluxe, Premium, Suite, or ALL"),
    max_price: Optional[float] = Query(None, description="Maximum price per night"),
    guests: Optional[int] = Query(None, description="Minimum room guest capacity"),
    available_only: bool = Query(False, description="Exclude occupied or booked rooms"),
    db: Session = Depends(get_db),
):
    """
    Search and list hotel rooms with relational joins, filtering, and real-time availability checks.
    """
    query = (
        db.query(Room)
        .options(joinedload(Room.room_type), joinedload(Room.amenities))
        .filter(Room.is_active == True)
    )

    if category and category.upper() != "ALL":
        # match either room_type name or category enum
        query = query.join(Room.room_type).filter(
            (RoomType.category.ilike(f"%{category}%")) | (RoomType.name.ilike(f"%{category}%"))
        )

    if max_price is not None:
        query = query.filter(Room.price_per_night <= max_price)

    if guests is not None and guests > 0:
        if not category or category.upper() == "ALL":
            query = query.join(Room.room_type)
        query = query.filter(RoomType.capacity >= guests)

    rooms = query.order_by(Room.floor.asc(), Room.room_number.asc()).all()

    # Determine overlapping bookings if check_in and check_out provided
    booked_room_ids = set()
    if check_in and check_out:
        if check_in >= check_out:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Check-out date must be strictly after check-in date.",
            )
        
        overlapping_bookings = (
            db.query(Booking.room_id)
            .filter(
                Booking.booking_status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]),
                Booking.check_in_date < check_out,
                Booking.check_out_date > check_in,
            )
            .all()
        )
        booked_room_ids = {b.room_id for b in overlapping_bookings}

    result = []
    for r in rooms:
        is_date_available = r.id not in booked_room_ids
        is_physically_available = r.current_status == RoomStatus.AVAILABLE
        overall_available = is_date_available and is_physically_available

        if available_only and not overall_available:
            continue

        resp = RoomItemResponse(
            id=r.id,
            room_number=r.room_number,
            room_type=RoomTypeItem.model_validate(r.room_type),
            floor=r.floor,
            current_status=r.current_status,
            price_per_night=r.price_per_night,
            view_type=r.view_type,
            is_active=r.is_active,
            amenities=[AmenityItem.model_validate(a) for a in r.amenities],
            is_available=overall_available,
        )
        result.append(resp)

    return result


@router.get("/types/all", response_model=List[RoomTypeItem])
def get_room_types(db: Session = Depends(get_db)):
    """Retrieve all available room types / suite categories."""
    room_types = db.query(RoomType).order_by(RoomType.base_price.asc()).all()
    return [RoomTypeItem.model_validate(rt) for rt in room_types]


@router.get("/amenities/all", response_model=List[AmenityItem])
def get_amenities(db: Session = Depends(get_db)):
    """Retrieve all hotel amenities and facilities."""
    amenities = db.query(Amenity).order_by(Amenity.name.asc()).all()
    return [AmenityItem.model_validate(a) for a in amenities]


@router.get("/{room_id}", response_model=RoomItemResponse)
def get_room_details(room_id: int, db: Session = Depends(get_db)):
    """Retrieve detailed information for a specific room."""
    room = (
        db.query(Room)
        .options(joinedload(Room.room_type), joinedload(Room.amenities))
        .filter(Room.id == room_id, Room.is_active == True)
        .first()
    )
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Room #{room_id} not found.",
        )

    return RoomItemResponse(
        id=room.id,
        room_number=room.room_number,
        room_type=RoomTypeItem.model_validate(room.room_type),
        floor=room.floor,
        current_status=room.current_status,
        price_per_night=room.price_per_night,
        view_type=room.view_type,
        is_active=room.is_active,
        amenities=[AmenityItem.model_validate(a) for a in room.amenities],
        is_available=(room.current_status == RoomStatus.AVAILABLE),
    )


@router.post("/check-availability", response_model=RoomAvailabilityCheckResponse)
def check_room_availability(
    payload: RoomAvailabilityCheckRequest,
    db: Session = Depends(get_db),
):
    """
    Check if a specific room is available for given dates with accurate night calculations.
    """
    if payload.check_in >= payload.check_out:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-out date must be strictly after check-in date.",
        )

    room = db.query(Room).filter(Room.id == payload.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")

    conflict = (
        db.query(Booking)
        .filter(
            Booking.room_id == payload.room_id,
            Booking.booking_status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]),
            Booking.check_in_date < payload.check_out,
            Booking.check_out_date > payload.check_in,
        )
        .first()
    )

    nights = (payload.check_out - payload.check_in).days
    nights = max(nights, 1)
    estimated_total = round(nights * room.price_per_night * 1.12, 2)

    if conflict:
        return RoomAvailabilityCheckResponse(
            room_id=room.id,
            check_in=payload.check_in,
            check_out=payload.check_out,
            is_available=False,
            conflict_message=f"Room {room.room_number} is reserved from {conflict.check_in_date} to {conflict.check_out_date}.",
            total_nights=nights,
            price_per_night=room.price_per_night,
            estimated_total=estimated_total,
        )

    return RoomAvailabilityCheckResponse(
        room_id=room.id,
        check_in=payload.check_in,
        check_out=payload.check_out,
        is_available=True,
        conflict_message=None,
        total_nights=nights,
        price_per_night=room.price_per_night,
        estimated_total=estimated_total,
    )
