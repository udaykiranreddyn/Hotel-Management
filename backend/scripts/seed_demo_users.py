import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, Guest, Employee
from app.models.enums import UserRole
import app.models  # noqa: F401


def seed_demo_users():
    print("=" * 60)
    print("Seeding Safe Demo Accounts for All 6 Hotel Roles")
    print("=" * 60)

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    demo_users = [
        {
            "email": "guest@aurahotels.com",
            "password": "Password@123",
            "full_name": "Vikram Malhotra",
            "phone": "+91 98765 11111",
            "role": UserRole.GUEST,
            "profile_type": "guest",
            "preferences": "High floor, ocean balcony, king bed",
            "loyalty_points": 350,
        },
        {
            "email": "receptionist@aurahotels.com",
            "password": "Password@123",
            "full_name": "Sarah Jenkins",
            "phone": "+91 98765 22222",
            "role": UserRole.RECEPTIONIST,
            "profile_type": "employee",
            "department": "Front Office",
            "designation": "Head Receptionist",
            "salary": 45000.0,
        },
        {
            "email": "housekeeping@aurahotels.com",
            "password": "Password@123",
            "full_name": "Maria Santos",
            "phone": "+91 98765 33333",
            "role": UserRole.HOUSEKEEPING,
            "profile_type": "employee",
            "department": "Housekeeping",
            "designation": "Housekeeping Lead",
            "salary": 38000.0,
        },
        {
            "email": "maintenance@aurahotels.com",
            "password": "Password@123",
            "full_name": "David Kumar",
            "phone": "+91 98765 44444",
            "role": UserRole.MAINTENANCE,
            "profile_type": "employee",
            "department": "Engineering & Maintenance",
            "designation": "Chief Facilities Engineer",
            "salary": 50000.0,
        },
        {
            "email": "concierge@aurahotels.com",
            "password": "Password@123",
            "full_name": "Elena Vance",
            "phone": "+91 98765 55555",
            "role": UserRole.RESTAURANT_LAUNDRY,
            "profile_type": "employee",
            "department": "Room Services & Concierge",
            "designation": "VIP Guest Experience Lead",
            "salary": 65000.0,
        },
        {
            "email": "admin@aurahotels.com",
            "password": "Password@123",
            "full_name": "Dr. Alistair Vance",
            "phone": "+91 98765 99999",
            "role": UserRole.ADMIN,
            "profile_type": "employee",
            "department": "Executive Management",
            "designation": "General Manager & Managing Director",
            "salary": 120000.0,
        },
    ]

    try:
        created_count = 0
        updated_count = 0

        for user_data in demo_users:
            user = db.query(User).filter(User.email == user_data["email"]).first()
            if not user:
                user = User(
                    email=user_data["email"],
                    hashed_password=get_password_hash(user_data["password"]),
                    full_name=user_data["full_name"],
                    phone=user_data["phone"],
                    role=user_data["role"],
                    is_active=True,
                )
                db.add(user)
                db.flush()

                if user_data["profile_type"] == "guest":
                    guest = Guest(
                        id=user.id,
                        preferences=user_data.get("preferences"),
                        loyalty_points=user_data.get("loyalty_points", 0),
                    )
                    db.add(guest)
                else:
                    employee = Employee(
                        id=user.id,
                        department=user_data.get("department", "General"),
                        designation=user_data.get("designation", "Staff"),
                        salary=user_data.get("salary", 35000.0),
                    )
                    db.add(employee)

                created_count += 1
                print(f"[CREATED] {user_data['role'].value:<18} -> {user_data['email']}")
            else:
                # Update password hash to ensure Password@123 is valid
                user.hashed_password = get_password_hash(user_data["password"])
                user.is_active = True
                updated_count += 1
                print(f"[SYNCED]  {user_data['role'].value:<18} -> {user_data['email']}")

        db.commit()
        print(f"\n[DONE] Successfully seeded: {created_count} new, {updated_count} synced demo accounts.")
        print(f"Default Password for all demo accounts: Password@123")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to seed demo users: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_users()
