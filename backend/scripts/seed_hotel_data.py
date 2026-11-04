import os
import sys
from datetime import datetime, date, timedelta, timezone

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, engine, Base
from app.models.enums import (
    UserRole,
    RoomStatus,
    RoomTypeCategory,
    BookingStatus,
    PaymentMethod,
    PaymentStatus,
    HousekeepingStatus,
    MaintenanceStatus,
    PriorityLevel,
)
from app.models.room import Room, RoomType, Amenity, room_amenities, RoomStatusHistory
from app.models.booking import Booking, BookingHistory, Coupon
from app.models.payment import Payment, PaymentHistory
from app.models.operations import HousekeepingTask, MaintenanceRequest
from app.models.user import User, Guest
import app.models  # noqa: F401


def seed_hotel_data():
    print("=" * 65)
    print("Seeding Complete Hotel Catalog, Inventory, Amenities, Coupons & Demo Bookings")
    print("=" * 65)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Amenities
        amenities_data = [
            {"name": "High-Speed Wi-Fi", "icon": "Wifi", "description": "Complimentary high-speed fiber-optic wireless internet"},
            {"name": "Climate Control AC", "icon": "Wind", "description": "Individual multi-zone silent split air conditioning"},
            {"name": "Smart 4K TV", "icon": "Tv", "description": "Ultra-HD Smart TV with streaming media apps & satellite channels"},
            {"name": "24/7 Hot Water Shower", "icon": "ShowerHead", "description": "High-pressure thermostatic shower with organic bath toiletries"},
            {"name": "Balcony with Panoramic View", "icon": "Compass", "description": "Private open balcony overlooking scenic city and garden view"},
            {"name": "Daily Housekeeping", "icon": "Sparkles", "description": "Daily room sanitization, fresh towels, and bed turndown"},
            {"name": "Tea & Coffee Maker", "icon": "Coffee", "description": "Electric kettle with fine tea infusions and artisan espresso"},
            {"name": "Work Desk & Ergonomic Chair", "icon": "Laptop", "description": "Dedicated workstation with universal power sockets"},
            {"name": "In-Room Electronic Safe", "icon": "ShieldCheck", "description": "Digital laptop-sized safety locker"},
            {"name": "Complimentary Valet Parking", "icon": "Car", "description": "Covered 24-hour valet parking and EV charging points"},
        ]

        amenity_map = {}
        for a_data in amenities_data:
            amenity = db.query(Amenity).filter(Amenity.name == a_data["name"]).first()
            if not amenity:
                amenity = Amenity(**a_data)
                db.add(amenity)
                db.flush()
                print(f"[AMENITY CREATED] {amenity.name}")
            amenity_map[amenity.name] = amenity

        # 2. Seed Room Types
        room_types_data = [
            {
                "name": "Standard Single Room",
                "category": RoomTypeCategory.STANDARD,
                "base_price": 599.0,
                "capacity": 1,
                "bed_type": "1 Single Bed",
                "image_url": "/images/luxury_hotel_hero.jpg",
                "description": "Clean and budget-friendly room with a single bed, clean bedsheets, attached bathroom with hot water, ceiling fan, and free Wi-Fi. Ideal for solo travelers and short stays.",
            },
            {
                "name": "Standard Double Room",
                "category": RoomTypeCategory.DELUXE,
                "base_price": 899.0,
                "capacity": 2,
                "bed_type": "1 Queen Bed",
                "image_url": "/images/deluxe_suite.jpg",
                "description": "Comfortable double room with a queen bed, fresh linens, ceiling fan/AC, LED TV, and sanitized attached bathroom with 24/7 hot water. Perfect for couples or two travelers.",
            },
            {
                "name": "Comfort AC Room",
                "category": RoomTypeCategory.PREMIUM,
                "base_price": 1199.0,
                "capacity": 3,
                "bed_type": "1 King Bed",
                "image_url": "/images/ocean_suite.jpg",
                "description": "Simple air-conditioned room with king-size bed, work table, electric tea kettle, LED TV, clean bathroom, and daily housekeeping.",
            },
            {
                "name": "Comfort Family Room",
                "category": RoomTypeCategory.SUITE,
                "base_price": 1499.0,
                "capacity": 4,
                "bed_type": "2 Double Beds",
                "image_url": "/images/presidential_suite.jpg",
                "description": "Spacious room with two double beds for up to 4 guests, split AC, clean bathroom, and wardrobe storage. Great budget value for families and small groups.",
            },
        ]

        room_type_map = {}
        for rt_data in room_types_data:
            rt = db.query(RoomType).filter(RoomType.name == rt_data["name"]).first()
            if not rt:
                rt = RoomType(**rt_data)
                db.add(rt)
                db.flush()
                print(f"[ROOM TYPE CREATED] {rt.name} (INR {rt.base_price}/night)")
            else:
                # Update attributes if needed
                rt.base_price = rt_data["base_price"]
                rt.capacity = rt_data["capacity"]
                rt.category = rt_data["category"]
                rt.image_url = rt_data["image_url"]
            room_type_map[rt.name] = rt

        # Clear existing operational records & rooms if re-seeding
        db.query(HousekeepingTask).delete()
        db.query(MaintenanceRequest).delete()
        db.query(PaymentHistory).delete()
        db.query(Payment).delete()
        db.query(BookingHistory).delete()
        db.query(Booking).delete()
        db.query(RoomStatusHistory).delete()
        db.execute(room_amenities.delete())
        db.query(Room).delete()
        db.flush()

        # 3. Seed 25 Rooms across 4 floors (Numbered 1 to 25)
        rooms_data = [
            # Floor 1 (Rooms 1 - 7)
            {"room_number": "1", "type": "Standard Single Room", "floor": 1, "price": 599.0, "status": RoomStatus.AVAILABLE, "view": "Garden View"},
            {"room_number": "2", "type": "Standard Single Room", "floor": 1, "price": 599.0, "status": RoomStatus.AVAILABLE, "view": "Garden Courtyard View"},
            {"room_number": "3", "type": "Standard Double Room", "floor": 1, "price": 899.0, "status": RoomStatus.AVAILABLE, "view": "City View"},
            {"room_number": "4", "type": "Standard Double Room", "floor": 1, "price": 899.0, "status": RoomStatus.OCCUPIED, "view": "Garden View"},
            {"room_number": "5", "type": "Comfort AC Room", "floor": 1, "price": 1199.0, "status": RoomStatus.AVAILABLE, "view": "Courtyard View"},
            {"room_number": "6", "type": "Comfort AC Room", "floor": 1, "price": 1199.0, "status": RoomStatus.AVAILABLE, "view": "Courtyard View"},
            {"room_number": "7", "type": "Comfort Family Room", "floor": 1, "price": 1499.0, "status": RoomStatus.AVAILABLE, "view": "Garden View"},
            # Floor 2 (Rooms 8 - 14)
            {"room_number": "8", "type": "Standard Single Room", "floor": 2, "price": 599.0, "status": RoomStatus.AVAILABLE, "view": "Quiet Atrium View"},
            {"room_number": "9", "type": "Standard Double Room", "floor": 2, "price": 899.0, "status": RoomStatus.CLEANING, "view": "City Horizon View"},
            {"room_number": "10", "type": "Standard Double Room", "floor": 2, "price": 899.0, "status": RoomStatus.AVAILABLE, "view": "City View"},
            {"room_number": "11", "type": "Comfort AC Room", "floor": 2, "price": 1199.0, "status": RoomStatus.AVAILABLE, "view": "City View"},
            {"room_number": "12", "type": "Comfort AC Room", "floor": 2, "price": 1199.0, "status": RoomStatus.AVAILABLE, "view": "Garden View"},
            {"room_number": "13", "type": "Comfort Family Room", "floor": 2, "price": 1499.0, "status": RoomStatus.AVAILABLE, "view": "Terrace View"},
            {"room_number": "14", "type": "Comfort Family Room", "floor": 2, "price": 1499.0, "status": RoomStatus.AVAILABLE, "view": "Garden View"},
            # Floor 3 (Rooms 15 - 20)
            {"room_number": "15", "type": "Standard Single Room", "floor": 3, "price": 599.0, "status": RoomStatus.AVAILABLE, "view": "Upper Garden View"},
            {"room_number": "16", "type": "Standard Double Room", "floor": 3, "price": 899.0, "status": RoomStatus.MAINTENANCE, "view": "City View"},
            {"room_number": "17", "type": "Standard Double Room", "floor": 3, "price": 899.0, "status": RoomStatus.AVAILABLE, "view": "City View"},
            {"room_number": "18", "type": "Comfort AC Room", "floor": 3, "price": 1199.0, "status": RoomStatus.AVAILABLE, "view": "City View"},
            {"room_number": "19", "type": "Comfort AC Room", "floor": 3, "price": 1199.0, "status": RoomStatus.AVAILABLE, "view": "Mountain View"},
            {"room_number": "20", "type": "Comfort Family Room", "floor": 3, "price": 1499.0, "status": RoomStatus.AVAILABLE, "view": "Mountain & City View"},
            # Floor 4 (Rooms 21 - 25)
            {"room_number": "21", "type": "Standard Single Room", "floor": 4, "price": 599.0, "status": RoomStatus.AVAILABLE, "view": "High Floor View"},
            {"room_number": "22", "type": "Standard Double Room", "floor": 4, "price": 899.0, "status": RoomStatus.AVAILABLE, "view": "High Floor City View"},
            {"room_number": "23", "type": "Comfort AC Room", "floor": 4, "price": 1199.0, "status": RoomStatus.AVAILABLE, "view": "Upper Floor View"},
            {"room_number": "24", "type": "Comfort AC Room", "floor": 4, "price": 1199.0, "status": RoomStatus.AVAILABLE, "view": "Horizon View"},
            {"room_number": "25", "type": "Comfort Family Room", "floor": 4, "price": 1499.0, "status": RoomStatus.AVAILABLE, "view": "Upper Terrace View"},
        ]

        all_amenities_list = list(amenity_map.values())
        room_map = {}
        for r_data in rooms_data:
            room = db.query(Room).filter(Room.room_number == r_data["room_number"]).first()
            rt = room_type_map[r_data["type"]]
            if not room:
                room = Room(
                    room_number=r_data["room_number"],
                    room_type_id=rt.id,
                    floor=r_data["floor"],
                    current_status=r_data["status"],
                    price_per_night=r_data["price"],
                    view_type=r_data["view"],
                    is_active=True,
                )
                # Assign appropriate amenities
                if rt.category == RoomTypeCategory.STANDARD:
                    room.amenities = all_amenities_list[:4]
                elif rt.category == RoomTypeCategory.DELUXE:
                    room.amenities = all_amenities_list[:6]
                elif rt.category == RoomTypeCategory.PREMIUM:
                    room.amenities = all_amenities_list[:8]
                else:
                    room.amenities = all_amenities_list

                db.add(room)
                db.flush()
                print(f"[ROOM CREATED] Room {room.room_number} ({rt.name}) - {room.current_status.value}")
            else:
                room.current_status = r_data["status"]
                room.price_per_night = r_data["price"]
            room_map[room.room_number] = room

        # 4. Seed Active Coupons
        coupons_data = [
            {
                "code": "AURA10",
                "discount_type": "PERCENTAGE",
                "discount_value": 10.0,
                "min_amount": 1000.0,
                "max_discount": 500.0,
                "valid_from": datetime.now(timezone.utc) - timedelta(days=30),
                "valid_to": datetime.now(timezone.utc) + timedelta(days=365),
                "usage_limit": 500,
                "times_used": 14,
                "is_active": True,
            },
            {
                "code": "WELCOME20",
                "discount_type": "PERCENTAGE",
                "discount_value": 20.0,
                "min_amount": 1500.0,
                "max_discount": 800.0,
                "valid_from": datetime.now(timezone.utc) - timedelta(days=10),
                "valid_to": datetime.now(timezone.utc) + timedelta(days=180),
                "usage_limit": 200,
                "times_used": 8,
                "is_active": True,
            },
            {
                "code": "SAVER500",
                "discount_type": "FLAT",
                "discount_value": 500.0,
                "min_amount": 2000.0,
                "max_discount": 500.0,
                "valid_from": datetime.now(timezone.utc) - timedelta(days=5),
                "valid_to": datetime.now(timezone.utc) + timedelta(days=90),
                "usage_limit": 100,
                "times_used": 3,
                "is_active": True,
            },
        ]

        for c_data in coupons_data:
            coupon = db.query(Coupon).filter(Coupon.code == c_data["code"]).first()
            if not coupon:
                coupon = Coupon(**c_data)
                db.add(coupon)
                print(f"[COUPON CREATED] {coupon.code} ({coupon.discount_value} {coupon.discount_type})")

        # 5. Seed Demo Bookings for Guest (Vikram Malhotra - user id 1)
        guest_user = db.query(User).filter(User.email == "guest@aurahotels.com").first()
        if guest_user and guest_user.guest_profile:
            guest_id = guest_user.guest_profile.id
            demo_booking_ref = "AURA-BK-38104"
            existing_booking = db.query(Booking).filter(Booking.booking_reference == demo_booking_ref).first()
            if not existing_booking:
                room_2 = room_map.get("2")
                if room_2:
                    booking = Booking(
                        booking_reference=demo_booking_ref,
                        guest_id=guest_id,
                        room_id=room_2.id,
                        check_in_date=date(2026, 9, 25),
                        check_out_date=date(2026, 9, 27),
                        num_guests=2,
                        num_nights=2,
                        price_per_night=room_2.price_per_night,
                        room_charges=2598.0,
                        extra_charges=0.0,
                        taxes=312.0,
                        discount_amount=260.0,
                        total_amount=2650.0,
                        booking_status=BookingStatus.CONFIRMED,
                        special_requests="Quiet 1st floor room with double bed, early check-in requested",
                    )
                    db.add(booking)
                    db.flush()

                    # Add Payment record
                    payment = Payment(
                        payment_reference="PAY-38104-CARD",
                        booking_id=booking.id,
                        amount=2650.0,
                        method=PaymentMethod.CARD,
                        transaction_id="TXN_HDFC_99281923",
                        status=PaymentStatus.SUCCESS,
                        notes="Prepaid via Visa Platinum Card",
                    )
                    db.add(payment)

                    # Add Booking History
                    history = BookingHistory(
                        booking_id=booking.id,
                        previous_status=BookingStatus.PENDING,
                        new_status=BookingStatus.CONFIRMED,
                        changed_by_user_id=guest_user.id,
                        notes="Reservation confirmed and payment authenticated online",
                    )
                    db.add(history)
                    print(f"[DEMO BOOKING CREATED] {demo_booking_ref} for {guest_user.full_name}")

        # 6. Seed Operations tasks for Housekeeping & Maintenance
        # Room 9 is CLEANING
        room_9 = room_map.get("9")
        if room_9:
            existing_task = db.query(HousekeepingTask).filter(HousekeepingTask.room_id == room_9.id).first()
            if not existing_task:
                housekeeper = db.query(User).filter(User.email == "housekeeping@aurahotels.com").first()
                task = HousekeepingTask(
                    room_id=room_9.id,
                    assigned_employee_id=housekeeper.id if housekeeper else None,
                    status=HousekeepingStatus.CLEANING,
                    inspection_notes="Guest checked out at 11:00 AM. Requires fresh sheets and bathroom sanitization.",
                )
                db.add(task)
                print("[HOUSEKEEPING TASK CREATED] Room 9 checkout cleaning")

        # Room 16 is MAINTENANCE
        room_16 = room_map.get("16")
        if room_16:
            existing_maint = db.query(MaintenanceRequest).filter(MaintenanceRequest.room_id == room_16.id).first()
            if not existing_maint:
                tech = db.query(User).filter(User.email == "maintenance@aurahotels.com").first()
                req = MaintenanceRequest(
                    room_id=room_16.id,
                    reported_by_user_id=tech.id if tech else None,
                    assigned_employee_id=tech.id if tech else None,
                    issue_title="AC Condenser Fan Replacement",
                    description="Split AC is blowing mild air, temperature sensor needs recalibration and fan filter cleaned.",
                    priority=PriorityLevel.MEDIUM,
                    status=MaintenanceStatus.IN_PROGRESS,
                )
                db.add(req)
                print("[MAINTENANCE TICKET CREATED] Room 16 AC repair")

        db.commit()
        print("\n[SUCCESS] Hotel catalog, rooms, amenities, coupons, and operational tasks successfully seeded!")
        print("=" * 65)

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to seed hotel data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_hotel_data()
