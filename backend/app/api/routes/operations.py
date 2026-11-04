from typing import List, Optional
from datetime import datetime, timezone, date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.core.database import get_db
from app.models.room import Room, RoomStatusHistory
from app.models.booking import Booking, BookingHistory
from app.models.payment import Payment
from app.models.operations import HousekeepingTask, MaintenanceRequest
from app.models.user import User, Employee, Guest
from app.models.enums import RoomStatus, BookingStatus, HousekeepingStatus, MaintenanceStatus, PriorityLevel, PaymentStatus
from app.schemas.operations import (
    FrontDeskRoomItem,
    FrontDeskCheckInOutRequest,
    HousekeepingTaskItem,
    HousekeepingStatusUpdateRequest,
    MaintenanceTicketItem,
    MaintenanceTicketCreateRequest,
    MaintenanceTicketResolveRequest,
    AdminMetricsResponse,
)

router = APIRouter()


@router.get("/frontdesk/rooms", response_model=List[FrontDeskRoomItem])
def get_frontdesk_rooms(db: Session = Depends(get_db)):
    """
    Live Front Desk Room Management Board:
    Displays status, guest occupation, and active reservation for all hotel rooms.
    """
    rooms = (
        db.query(Room)
        .options(joinedload(Room.room_type))
        .filter(Room.is_active == True)
        .order_by(Room.floor.asc(), Room.room_number.asc())
        .all()
    )

    today = date.today()
    result = []

    for r in rooms:
        # Find active or current booking for room
        active_booking = (
            db.query(Booking)
            .options(joinedload(Booking.guest).joinedload(Guest.user))
            .filter(
                Booking.room_id == r.id,
                Booking.booking_status.in_([BookingStatus.CHECKED_IN, BookingStatus.CONFIRMED]),
                Booking.check_in_date <= today,
                Booking.check_out_date >= today,
            )
            .order_by(Booking.check_in_date.asc())
            .first()
        )

        guest_name = None
        guest_phone = None
        booking_ref = None
        in_date = None
        out_date = None

        if active_booking and active_booking.guest and active_booking.guest.user:
            guest_name = active_booking.guest.user.full_name
            guest_phone = active_booking.guest.user.phone
            booking_ref = active_booking.booking_reference
            in_date = active_booking.check_in_date
            out_date = active_booking.check_out_date

        result.append(
            FrontDeskRoomItem(
                room_id=r.id,
                room_number=r.room_number,
                floor=r.floor,
                room_type_name=r.room_type.name if r.room_type else "Room",
                price_per_night=r.price_per_night,
                status=r.current_status,
                current_guest_name=guest_name,
                current_guest_phone=guest_phone,
                current_booking_ref=booking_ref,
                check_in_date=in_date,
                check_out_date=out_date,
            )
        )

    return result


@router.post("/frontdesk/checkin")
def frontdesk_checkin(
    payload: FrontDeskCheckInOutRequest,
    db: Session = Depends(get_db),
):
    """
    Front Desk check-in: validates reservation, changes status to CHECKED_IN, and marks room OCCUPIED.
    """
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.room), joinedload(Booking.guest).joinedload(Guest.user))
        .filter(Booking.booking_reference == payload.booking_reference)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if booking.booking_status == BookingStatus.CHECKED_IN:
        return {"status": "success", "message": f"Guest {booking.guest.user.full_name} is already checked into room {booking.room.room_number}."}

    prev_booking_status = booking.booking_status
    prev_room_status = booking.room.current_status

    booking.booking_status = BookingStatus.CHECKED_IN
    booking.room.current_status = RoomStatus.OCCUPIED

    # Log histories
    db.add(BookingHistory(
        booking_id=booking.id,
        previous_status=prev_booking_status,
        new_status=BookingStatus.CHECKED_IN,
        notes=payload.notes or "Guest completed front desk check-in and received room key",
    ))
    db.add(RoomStatusHistory(
        room_id=booking.room.id,
        previous_status=prev_room_status,
        new_status=RoomStatus.OCCUPIED,
        notes=f"Guest {booking.guest.user.full_name} checked in (Ref: {booking.booking_reference})",
    ))

    db.commit()
    return {
        "status": "success",
        "message": f"Successfully checked in {booking.guest.user.full_name} into Room {booking.room.room_number}.",
        "room_number": booking.room.room_number,
        "booking_reference": booking.booking_reference,
    }


@router.post("/frontdesk/checkout")
def frontdesk_checkout(
    payload: FrontDeskCheckInOutRequest,
    db: Session = Depends(get_db),
):
    """
    Front Desk check-out: settles reservation, marks room for CLEANING, and assigns Housekeeping task.
    """
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.room), joinedload(Booking.guest).joinedload(Guest.user))
        .filter(Booking.booking_reference == payload.booking_reference)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    prev_booking_status = booking.booking_status
    prev_room_status = booking.room.current_status

    booking.booking_status = BookingStatus.CHECKED_OUT
    booking.room.current_status = RoomStatus.CLEANING

    # Create Housekeeping task
    housekeeper = db.query(Employee).join(User).filter(User.role == "HOUSEKEEPING").first()
    task = HousekeepingTask(
        room_id=booking.room.id,
        assigned_employee_id=housekeeper.id if housekeeper else None,
        status=HousekeepingStatus.ASSIGNED,
        inspection_notes=f"Checkout turnover for Room {booking.room.room_number}. Clean bathroom, sanitize linens.",
    )
    db.add(task)

    db.add(BookingHistory(
        booking_id=booking.id,
        previous_status=prev_booking_status,
        new_status=BookingStatus.CHECKED_OUT,
        notes=payload.notes or "Guest completed checkout at front desk.",
    ))
    db.add(RoomStatusHistory(
        room_id=booking.room.id,
        previous_status=prev_room_status,
        new_status=RoomStatus.CLEANING,
        notes="Guest departed. Room scheduled for housekeeping turnover.",
    ))

    db.commit()
    return {
        "status": "success",
        "message": f"Successfully checked out {booking.guest.user.full_name} from Room {booking.room.room_number}. Room marked for Housekeeping.",
        "room_number": booking.room.room_number,
        "booking_reference": booking.booking_reference,
    }


@router.get("/housekeeping/tasks", response_model=List[HousekeepingTaskItem])
def get_housekeeping_tasks(db: Session = Depends(get_db)):
    """Retrieve all operational housekeeping and room sanitation tasks."""
    tasks = (
        db.query(HousekeepingTask)
        .options(
            joinedload(HousekeepingTask.room),
            joinedload(HousekeepingTask.assigned_employee).joinedload(Employee.user),
        )
        .order_by(HousekeepingTask.created_at.desc())
        .all()
    )

    result = []
    for t in tasks:
        staff_name = t.assigned_employee.user.full_name if t.assigned_employee and t.assigned_employee.user else "Housekeeping Team"
        result.append(
            HousekeepingTaskItem(
                task_id=t.id,
                room_id=t.room_id,
                room_number=t.room.room_number if t.room else "N/A",
                status=t.status,
                assigned_staff_name=staff_name,
                inspection_notes=t.inspection_notes,
                created_at=t.created_at,
            )
        )
    return result


@router.post("/housekeeping/{task_id}/update")
def update_housekeeping_task(
    task_id: int,
    payload: HousekeepingStatusUpdateRequest,
    db: Session = Depends(get_db),
):
    """
    Update housekeeping task status. If marked READY, room status is restored to AVAILABLE.
    """
    task = (
        db.query(HousekeepingTask)
        .options(joinedload(HousekeepingTask.room))
        .filter(HousekeepingTask.id == task_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Housekeeping task not found.")

    task.status = payload.status
    if payload.notes:
        task.inspection_notes = payload.notes

    if payload.status == HousekeepingStatus.READY:
        task.completed_at = datetime.utcnow()
        if task.room:
            prev_status = task.room.current_status
            task.room.current_status = RoomStatus.AVAILABLE
            db.add(RoomStatusHistory(
                room_id=task.room.id,
                previous_status=prev_status,
                new_status=RoomStatus.AVAILABLE,
                notes="Sanitization inspection passed. Room marked AVAILABLE for guest bookings.",
            ))

    db.commit()
    return {
        "status": "success",
        "message": f"Task #{task_id} updated to {payload.status.value}. Room {task.room.room_number if task.room else ''} is now {task.room.current_status.value if task.room else ''}.",
    }


@router.get("/maintenance/tickets", response_model=List[MaintenanceTicketItem])
def get_maintenance_tickets(db: Session = Depends(get_db)):
    """Retrieve maintenance and repair work orders."""
    tickets = (
        db.query(MaintenanceRequest)
        .options(
            joinedload(MaintenanceRequest.room),
            joinedload(MaintenanceRequest.reported_by),
            joinedload(MaintenanceRequest.assigned_employee).joinedload(Employee.user),
        )
        .order_by(MaintenanceRequest.created_at.desc())
        .all()
    )

    result = []
    for m in tickets:
        rep_name = m.reported_by.full_name if m.reported_by else "Staff"
        tech_name = m.assigned_employee.user.full_name if m.assigned_employee and m.assigned_employee.user else "Engineering"
        result.append(
            MaintenanceTicketItem(
                ticket_id=m.id,
                room_id=m.room_id,
                room_number=m.room.room_number if m.room else "N/A",
                issue_title=m.issue_title,
                description=m.description,
                priority=m.priority,
                status=m.status,
                reported_by_name=rep_name,
                assigned_tech_name=tech_name,
                resolution_notes=m.resolution_notes,
                created_at=m.created_at,
            )
        )
    return result


@router.post("/maintenance/create")
def create_maintenance_ticket(
    payload: MaintenanceTicketCreateRequest,
    db: Session = Depends(get_db),
):
    """Create a new maintenance issue ticket and mark room for MAINTENANCE."""
    room = db.query(Room).filter(Room.id == payload.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")

    tech = db.query(Employee).join(User).filter(User.role == "MAINTENANCE").first()

    req = MaintenanceRequest(
        room_id=room.id,
        assigned_employee_id=tech.id if tech else None,
        issue_title=payload.issue_title,
        description=payload.description,
        priority=payload.priority,
        status=MaintenanceStatus.OPEN,
    )
    db.add(req)

    prev_status = room.current_status
    room.current_status = RoomStatus.MAINTENANCE
    db.add(RoomStatusHistory(
        room_id=room.id,
        previous_status=prev_status,
        new_status=RoomStatus.MAINTENANCE,
        notes=f"Maintenance logged: {payload.issue_title}",
    ))

    db.commit()
    return {"status": "success", "message": f"Maintenance ticket created for Room {room.room_number}."}


@router.post("/maintenance/{ticket_id}/resolve")
def resolve_maintenance_ticket(
    ticket_id: int,
    payload: MaintenanceTicketResolveRequest,
    db: Session = Depends(get_db),
):
    """Mark maintenance ticket as resolved and restore room to AVAILABLE."""
    ticket = db.query(MaintenanceRequest).options(joinedload(MaintenanceRequest.room)).filter(MaintenanceRequest.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Maintenance ticket not found.")

    ticket.status = payload.status
    ticket.resolution_notes = payload.resolution_notes
    ticket.resolved_at = datetime.utcnow()

    if ticket.room and payload.status == MaintenanceStatus.RESOLVED:
        prev = ticket.room.current_status
        ticket.room.current_status = RoomStatus.AVAILABLE
        db.add(RoomStatusHistory(
            room_id=ticket.room.id,
            previous_status=prev,
            new_status=RoomStatus.AVAILABLE,
            notes=f"Maintenance resolved: {payload.resolution_notes}",
        ))

    db.commit()
    return {"status": "success", "message": f"Ticket #{ticket_id} marked as {payload.status.value}."}


@router.get("/admin/metrics", response_model=AdminMetricsResponse)
def get_admin_metrics(db: Session = Depends(get_db)):
    """
    Live Administrative Intelligence & KPI Dashboard:
    Computes occupancy percentage, total revenue, room statuses, and active booking metrics.
    """
    rooms = db.query(Room).filter(Room.is_active == True).all()
    total_rooms = len(rooms)
    available_rooms = sum(1 for r in rooms if r.current_status == RoomStatus.AVAILABLE)
    occupied_rooms = sum(1 for r in rooms if r.current_status == RoomStatus.OCCUPIED)
    cleaning_rooms = sum(1 for r in rooms if r.current_status == RoomStatus.CLEANING)
    maintenance_rooms = sum(1 for r in rooms if r.current_status == RoomStatus.MAINTENANCE)

    occupancy_pct = round((occupied_rooms / total_rooms * 100), 1) if total_rooms > 0 else 0.0

    # Total revenue from successful payments
    total_revenue_calc = (
        db.query(func.coalesce(func.sum(Payment.amount), 0.0))
        .filter(Payment.status == PaymentStatus.SUCCESS)
        .scalar()
    )

    total_bookings = db.query(Booking).count()
    active_reservations = (
        db.query(Booking)
        .filter(Booking.booking_status.in_([BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]))
        .count()
    )

    return AdminMetricsResponse(
        total_rooms=total_rooms,
        available_rooms=available_rooms,
        occupied_rooms=occupied_rooms,
        cleaning_rooms=cleaning_rooms,
        maintenance_rooms=maintenance_rooms,
        occupancy_percentage=occupancy_pct,
        total_revenue=float(total_revenue_calc or 0.0),
        total_bookings=total_bookings,
        active_reservations=active_reservations,
    )
