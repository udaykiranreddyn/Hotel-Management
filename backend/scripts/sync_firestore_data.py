import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.models.user import User, Guest
from app.models.room import Room, RoomType, Amenity
from app.models.booking import Booking
from app.models.feedback_notifications import Review, Complaint
from app.models.operations import HousekeepingTask, MaintenanceRequest
from app.services.firestore_service import firestore_service

def sync_to_firestore():
    db = SessionLocal()
    print("[Firebase Sync] Starting synchronization of hotel data to Firebase Firestore...")
    
    try:
        # 1. Sync Room Types
        room_types = db.query(RoomType).all()
        for rt in room_types:
            data = {
                "id": rt.id,
                "name": rt.name,
                "category": rt.category.value if hasattr(rt.category, "value") else str(rt.category),
                "description": rt.description,
                "base_price": float(rt.base_price),
                "capacity": rt.capacity,
                "bed_type": rt.bed_type,
                "image_url": rt.image_url
            }
            firestore_service.store_document("room_types", str(rt.id), data)
        print(f"[OK] Synced {len(room_types)} room types to Firestore.")

        # 2. Sync Rooms
        rooms = db.query(Room).all()
        for rm in rooms:
            data = {
                "id": rm.id,
                "room_number": rm.room_number,
                "floor": rm.floor,
                "current_status": rm.current_status.value if hasattr(rm.current_status, "value") else str(rm.current_status),
                "price_per_night": float(rm.price_per_night) if rm.price_per_night else 0.0,
                "view_type": rm.view_type,
                "is_active": rm.is_active,
                "room_type_id": rm.room_type_id,
                "room_type_name": rm.room_type.name if rm.room_type else None
            }
            firestore_service.store_document("rooms", str(rm.id), data)
        print(f"[OK] Synced {len(rooms)} rooms to Firestore.")

        # 3. Sync Users (Includes all registered guest accounts, staff & admin)
        users = db.query(User).all()
        for u in users:
            preferences = u.guest_profile.preferences if u.guest_profile else None
            loyalty_points = u.guest_profile.loyalty_points if u.guest_profile else 0
            data = {
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "phone": u.phone,
                "role": u.role.value if hasattr(u.role, "value") else str(u.role),
                "is_active": u.is_active,
                "preferences": preferences,
                "loyalty_points": loyalty_points,
                "created_at": str(u.created_at) if hasattr(u, "created_at") else None
            }
            firestore_service.store_document("users", str(u.id), data)
        print(f"[OK] Synced {len(users)} user accounts to Firestore collection 'users'.")

        # 4. Sync Bookings
        bookings = db.query(Booking).all()
        for b in bookings:
            guest_name = b.guest.user.full_name if (b.guest and b.guest.user) else "Guest"
            guest_email = b.guest.user.email if (b.guest and b.guest.user) else ""
            data = {
                "id": b.id,
                "booking_reference": b.booking_reference,
                "guest_name": guest_name,
                "guest_email": guest_email,
                "room_id": b.room_id,
                "check_in_date": str(b.check_in_date),
                "check_out_date": str(b.check_out_date),
                "num_guests": b.num_guests,
                "booking_status": b.booking_status.value if hasattr(b.booking_status, "value") else str(b.booking_status),
                "total_amount": float(b.total_amount) if b.total_amount else 0.0
            }
            firestore_service.store_document("bookings", str(b.id), data)
        print(f"[OK] Synced {len(bookings)} bookings to Firestore.")

        # 5. Sync Reviews
        reviews = db.query(Review).all()
        for r in reviews:
            data = {
                "id": r.id,
                "booking_id": r.booking_id,
                "guest_id": r.guest_id,
                "rating": r.rating,
                "comment": r.comment,
                "sentiment": r.sentiment.value if hasattr(r.sentiment, "value") else str(r.sentiment)
            }
            firestore_service.store_document("reviews", str(r.id), data)
        print(f"[OK] Synced {len(reviews)} guest reviews to Firestore.")

        print("[SUCCESS] Firebase Firestore Synchronization Completed Successfully!")

    except Exception as e:
        print(f"[ERROR] Error during Firestore synchronization: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    sync_to_firestore()
