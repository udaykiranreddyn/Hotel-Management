"""
Seed script — run once to populate the database with demo data.
Usage (from hotel/backend folder):
    venv\Scripts\activate
    python seed.py
"""
import sys
import os

# MUST be before any app imports
sys.path.insert(0, os.getcwd())

from app.database.connection import SessionLocal, create_tables  # noqa: E402
import app.models  # noqa: E402, F401 — registers all models
from app.models.user import User, Guest, Employee, UserRole  # noqa: E402
from app.models.room import Room, RoomType, RoomStatus  # noqa: E402
from app.models.booking import Coupon  # noqa: E402
from app.models.services import MenuItem  # noqa: E402
from app.models.inventory import InventoryItem  # noqa: E402
from app.auth.password import hash_password  # noqa: E402
import json  # noqa: E402
from datetime import date  # noqa: E402

create_tables()
db = SessionLocal()


def seed():
    # ── 1. Users ──────────────────────────────────────────────────────────────
    demo_users = [
        {"full_name": "Admin User",        "email": "admin@smarthotel.com",         "phone": "9000000001", "password": "Admin@123", "role": UserRole.ADMIN},
        {"full_name": "Hotel Manager",     "email": "manager@smarthotel.com",       "phone": "9000000002", "password": "Staff@123", "role": UserRole.MANAGER},
        {"full_name": "Raj Receptionist",  "email": "receptionist@smarthotel.com",  "phone": "9000000003", "password": "Staff@123", "role": UserRole.RECEPTIONIST},
        {"full_name": "Priya Housekeeper", "email": "housekeeping@smarthotel.com",  "phone": "9000000004", "password": "Staff@123", "role": UserRole.HOUSEKEEPING},
        {"full_name": "Arjun Maintenance", "email": "maintenance@smarthotel.com",   "phone": "9000000005", "password": "Staff@123", "role": UserRole.MAINTENANCE},
        {"full_name": "Chef Ramesh",       "email": "restaurant@smarthotel.com",    "phone": "9000000006", "password": "Staff@123", "role": UserRole.RESTAURANT_STAFF},
        {"full_name": "Amit Sharma",       "email": "guest1@example.com",           "phone": "9111111001", "password": "Guest@123", "role": UserRole.GUEST},
        {"full_name": "Priya Patel",       "email": "guest2@example.com",           "phone": "9111111002", "password": "Guest@123", "role": UserRole.GUEST},
        {"full_name": "Rahul Verma",       "email": "guest3@example.com",           "phone": "9111111003", "password": "Guest@123", "role": UserRole.GUEST},
        {"full_name": "Sneha Reddy",       "email": "guest4@example.com",           "phone": "9111111004", "password": "Guest@123", "role": UserRole.GUEST},
        {"full_name": "Vikram Singh",      "email": "guest5@example.com",           "phone": "9111111005", "password": "Guest@123", "role": UserRole.GUEST},
        {"full_name": "Ananya Iyer",       "email": "guest6@example.com",           "phone": "9111111006", "password": "Guest@123", "role": UserRole.GUEST},
        {"full_name": "Karan Mehta",       "email": "guest7@example.com",           "phone": "9111111007", "password": "Guest@123", "role": UserRole.GUEST},
        {"full_name": "Divya Nair",        "email": "guest8@example.com",           "phone": "9111111008", "password": "Guest@123", "role": UserRole.GUEST},
        {"full_name": "Suresh Kumar",      "email": "guest9@example.com",           "phone": "9111111009", "password": "Guest@123", "role": UserRole.GUEST},
        {"full_name": "Meera Joshi",       "email": "guest10@example.com",          "phone": "9111111010", "password": "Guest@123", "role": UserRole.GUEST},
    ]
    created_users = {}
    for u in demo_users:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            user = User(
                full_name=u["full_name"], email=u["email"], phone=u["phone"],
                hashed_password=hash_password(u["password"]), role=u["role"],
            )
            db.add(user)
            db.flush()
            created_users[u["email"]] = user
            if u["role"] == UserRole.GUEST:
                db.add(Guest(user_id=user.id, loyalty_points=0, total_stays=0))
        else:
            created_users[u["email"]] = existing
    db.commit()
    print("  Users: seeded")

    # ── 2. Employees ──────────────────────────────────────────────────────────
    emp_data = [
        {"email": "receptionist@smarthotel.com", "code": "EMP001", "dept": "Front Desk",   "desig": "Senior Receptionist", "shift": "MORNING"},
        {"email": "housekeeping@smarthotel.com",  "code": "EMP002", "dept": "Housekeeping", "desig": "Housekeeping Staff",  "shift": "MORNING"},
        {"email": "maintenance@smarthotel.com",   "code": "EMP003", "dept": "Maintenance",  "desig": "Maintenance Tech",    "shift": "AFTERNOON"},
        {"email": "restaurant@smarthotel.com",    "code": "EMP004", "dept": "Restaurant",   "desig": "Head Chef",           "shift": "MORNING"},
        {"email": "manager@smarthotel.com",       "code": "EMP005", "dept": "Management",   "desig": "Hotel Manager",       "shift": "MORNING"},
    ]
    for e in emp_data:
        user = created_users.get(e["email"])
        if user and not db.query(Employee).filter(Employee.employee_code == e["code"]).first():
            db.add(Employee(
                user_id=user.id, employee_code=e["code"],
                department=e["dept"], designation=e["desig"],
                shift=e["shift"], salary=45000, join_date="2023-01-01",
            ))
    db.commit()
    print("  Employees: seeded")

    # ── 3. Room Types ─────────────────────────────────────────────────────────
    rt_map = {}
    for rt in [
        {"name": "Standard", "description": "Comfortable standard room", "base_price": 2500.0},
        {"name": "Deluxe",   "description": "Spacious deluxe room",      "base_price": 3500.0},
        {"name": "Premium",  "description": "Premium room with city view","base_price": 5500.0},
        {"name": "Suite",    "description": "Luxurious suite",            "base_price": 9000.0},
    ]:
        existing = db.query(RoomType).filter(RoomType.name == rt["name"]).first()
        if not existing:
            obj = RoomType(**rt)
            db.add(obj)
            db.flush()
            rt_map[rt["name"]] = obj
        else:
            rt_map[rt["name"]] = existing
    db.commit()
    print("  Room types: seeded")

    # ── 4. Rooms (20 rooms) ───────────────────────────────────────────────────
    rooms_data = [
        {"room_number": "101", "type": "Standard", "floor": 1, "capacity": 2, "price": 2500,  "bed": "Queen",  "view": "Garden", "amenities": ["WiFi","AC","TV","Room Service"]},
        {"room_number": "102", "type": "Standard", "floor": 1, "capacity": 2, "price": 2500,  "bed": "Queen",  "view": "Garden", "amenities": ["WiFi","AC","TV","Room Service"]},
        {"room_number": "103", "type": "Standard", "floor": 1, "capacity": 1, "price": 2200,  "bed": "Single", "view": "Garden", "amenities": ["WiFi","AC","TV"]},
        {"room_number": "104", "type": "Standard", "floor": 1, "capacity": 3, "price": 2800,  "bed": "Twin",   "view": "Garden", "amenities": ["WiFi","AC","TV","Room Service"]},
        {"room_number": "105", "type": "Standard", "floor": 1, "capacity": 2, "price": 2500,  "bed": "Queen",  "view": "City",   "amenities": ["WiFi","AC","TV","Room Service"]},
        {"room_number": "201", "type": "Deluxe",   "floor": 2, "capacity": 2, "price": 3500,  "bed": "King",   "view": "City",   "amenities": ["WiFi","AC","TV","Balcony","Breakfast","Room Service"]},
        {"room_number": "202", "type": "Deluxe",   "floor": 2, "capacity": 2, "price": 3500,  "bed": "King",   "view": "Garden", "amenities": ["WiFi","AC","TV","Balcony","Breakfast","Room Service"]},
        {"room_number": "203", "type": "Deluxe",   "floor": 2, "capacity": 3, "price": 3800,  "bed": "King",   "view": "Pool",   "amenities": ["WiFi","AC","TV","Balcony","Breakfast","Room Service","Mini Bar"]},
        {"room_number": "204", "type": "Deluxe",   "floor": 2, "capacity": 2, "price": 3500,  "bed": "Queen",  "view": "City",   "amenities": ["WiFi","AC","TV","Balcony","Breakfast"]},
        {"room_number": "205", "type": "Deluxe",   "floor": 2, "capacity": 4, "price": 4200,  "bed": "Twin",   "view": "Garden", "amenities": ["WiFi","AC","TV","Balcony","Breakfast","Room Service"]},
        {"room_number": "301", "type": "Premium",  "floor": 3, "capacity": 2, "price": 5500,  "bed": "King",   "view": "City",   "amenities": ["WiFi","AC","TV","Balcony","Breakfast","Mini Bar","Jacuzzi","Room Service"]},
        {"room_number": "302", "type": "Premium",  "floor": 3, "capacity": 2, "price": 5500,  "bed": "King",   "view": "Pool",   "amenities": ["WiFi","AC","TV","Balcony","Breakfast","Mini Bar","Jacuzzi","Room Service"]},
        {"room_number": "303", "type": "Premium",  "floor": 3, "capacity": 3, "price": 6000,  "bed": "King",   "view": "Sea",    "amenities": ["WiFi","AC","TV","Balcony","Breakfast","Mini Bar","Jacuzzi","Room Service","Parking"]},
        {"room_number": "304", "type": "Premium",  "floor": 3, "capacity": 2, "price": 5500,  "bed": "Queen",  "view": "City",   "amenities": ["WiFi","AC","TV","Balcony","Breakfast","Mini Bar","Room Service"]},
        {"room_number": "305", "type": "Premium",  "floor": 3, "capacity": 4, "price": 6500,  "bed": "Twin",   "view": "Sea",    "amenities": ["WiFi","AC","TV","Balcony","Breakfast","Mini Bar","Jacuzzi","Room Service","Parking"]},
        {"room_number": "401", "type": "Suite",    "floor": 4, "capacity": 2, "price": 9000,  "bed": "King",   "view": "Sea",    "amenities": ["WiFi","AC","TV","Balcony","Breakfast","Mini Bar","Jacuzzi","Butler","Room Service","Parking","Lounge Access"]},
        {"room_number": "402", "type": "Suite",    "floor": 4, "capacity": 4, "price": 11000, "bed": "King",   "view": "Sea",    "amenities": ["WiFi","AC","TV","Balcony","Breakfast","Mini Bar","Jacuzzi","Butler","Room Service","Parking","Lounge Access"]},
        {"room_number": "403", "type": "Suite",    "floor": 4, "capacity": 2, "price": 9500,  "bed": "King",   "view": "City",   "amenities": ["WiFi","AC","TV","Balcony","Breakfast","Mini Bar","Jacuzzi","Butler","Room Service","Parking"]},
        {"room_number": "404", "type": "Suite",    "floor": 4, "capacity": 6, "price": 15000, "bed": "Twin",   "view": "Sea",    "amenities": ["WiFi","AC","TV","Balcony","Breakfast","Mini Bar","Jacuzzi","Butler","Room Service","Parking","Lounge Access","Private Pool"]},
        {"room_number": "405", "type": "Suite",    "floor": 4, "capacity": 2, "price": 9000,  "bed": "King",   "view": "Garden", "amenities": ["WiFi","AC","TV","Balcony","Breakfast","Mini Bar","Butler","Room Service","Parking"]},
    ]
    for r in rooms_data:
        if not db.query(Room).filter(Room.room_number == r["room_number"]).first():
            db.add(Room(
                room_number=r["room_number"], room_type_id=rt_map[r["type"]].id,
                floor=r["floor"], capacity=r["capacity"], price_per_night=r["price"],
                bed_type=r["bed"], room_view=r["view"],
                amenities=json.dumps(r["amenities"]), status=RoomStatus.AVAILABLE,
            ))
    db.commit()
    print("  Rooms: 20 seeded")

    # ── 5. Menu Items ─────────────────────────────────────────────────────────
    menu_data = [
        {"name": "Continental Breakfast", "category": "Breakfast",  "price": 350, "description": "Bread, butter, jam, juice, coffee",       "is_veg": True},
        {"name": "Full English Breakfast", "category": "Breakfast", "price": 450, "description": "Eggs, bacon, toast, beans, sausage",       "is_veg": False},
        {"name": "Masala Omelette",        "category": "Breakfast", "price": 200, "description": "Spiced egg omelette with toast",           "is_veg": False},
        {"name": "Idli Sambar",            "category": "Breakfast", "price": 180, "description": "Steamed rice cakes with sambar",           "is_veg": True},
        {"name": "Poha",                   "category": "Breakfast", "price": 150, "description": "Flattened rice with spices",               "is_veg": True},
        {"name": "Paneer Butter Masala",   "category": "Lunch",     "price": 320, "description": "Cottage cheese in rich tomato gravy",      "is_veg": True},
        {"name": "Dal Makhani",            "category": "Lunch",     "price": 280, "description": "Slow-cooked black lentils",                "is_veg": True},
        {"name": "Chicken Biryani",        "category": "Lunch",     "price": 380, "description": "Aromatic basmati rice with chicken",       "is_veg": False},
        {"name": "Veg Biryani",            "category": "Lunch",     "price": 300, "description": "Aromatic basmati rice with veggies",       "is_veg": True},
        {"name": "Butter Chicken",         "category": "Dinner",    "price": 400, "description": "Tender chicken in buttery sauce",          "is_veg": False},
        {"name": "Grilled Fish",           "category": "Dinner",    "price": 450, "description": "Fresh fish with herbs and lemon",          "is_veg": False},
        {"name": "Veg Thali",              "category": "Lunch",     "price": 350, "description": "Complete vegetarian meal",                 "is_veg": True},
        {"name": "Mutton Rogan Josh",      "category": "Dinner",    "price": 480, "description": "Slow-cooked mutton in Kashmiri spices",    "is_veg": False},
        {"name": "Fresh Lime Soda",        "category": "Beverages", "price": 80,  "description": "Refreshing lime with soda",               "is_veg": True},
        {"name": "Mango Lassi",            "category": "Beverages", "price": 120, "description": "Chilled mango yogurt drink",               "is_veg": True},
        {"name": "Masala Chai",            "category": "Beverages", "price": 60,  "description": "Spiced Indian tea",                        "is_veg": True},
        {"name": "Cold Coffee",            "category": "Beverages", "price": 150, "description": "Chilled coffee with ice cream",            "is_veg": True},
        {"name": "Fresh Juice",            "category": "Beverages", "price": 100, "description": "Seasonal fresh fruit juice",               "is_veg": True},
        {"name": "Veg Sandwich",           "category": "Snacks",    "price": 180, "description": "Grilled vegetable sandwich",               "is_veg": True},
        {"name": "Samosa (2 pcs)",         "category": "Snacks",    "price": 80,  "description": "Crispy fried pastry with filling",         "is_veg": True},
        {"name": "French Fries",           "category": "Snacks",    "price": 150, "description": "Crispy golden fries with dip",             "is_veg": True},
        {"name": "Club Sandwich",          "category": "Snacks",    "price": 280, "description": "Triple-decker sandwich",                   "is_veg": False},
    ]
    for m in menu_data:
        if not db.query(MenuItem).filter(MenuItem.name == m["name"]).first():
            db.add(MenuItem(**m))
    db.commit()
    print("  Menu items: 22 seeded")

    # ── 6. Inventory ──────────────────────────────────────────────────────────
    inventory_data = [
        {"name": "Bath Towels",        "category": "LINEN",       "current_quantity": 200, "minimum_quantity": 50,  "unit": "pieces", "purchase_price": 150, "supplier": "Linen Co."},
        {"name": "Bed Sheets",         "category": "LINEN",       "current_quantity": 150, "minimum_quantity": 40,  "unit": "sets",   "purchase_price": 400, "supplier": "Linen Co."},
        {"name": "Pillow Covers",      "category": "LINEN",       "current_quantity": 300, "minimum_quantity": 80,  "unit": "pieces", "purchase_price": 80,  "supplier": "Linen Co."},
        {"name": "Soap Bars",          "category": "TOILETRIES",  "current_quantity": 500, "minimum_quantity": 100, "unit": "pieces", "purchase_price": 25,  "supplier": "HygienePro"},
        {"name": "Shampoo Bottles",    "category": "TOILETRIES",  "current_quantity": 400, "minimum_quantity": 100, "unit": "pieces", "purchase_price": 40,  "supplier": "HygienePro"},
        {"name": "Conditioner",        "category": "TOILETRIES",  "current_quantity": 8,   "minimum_quantity": 50,  "unit": "pieces", "purchase_price": 40,  "supplier": "HygienePro"},
        {"name": "Water Bottles",      "category": "FOOD",        "current_quantity": 600, "minimum_quantity": 200, "unit": "pieces", "purchase_price": 15,  "supplier": "AquaPure"},
        {"name": "Tea Bags",           "category": "FOOD",        "current_quantity": 1000,"minimum_quantity": 200, "unit": "pieces", "purchase_price": 5,   "supplier": "TeaWorld"},
        {"name": "Coffee Sachets",     "category": "FOOD",        "current_quantity": 12,  "minimum_quantity": 200, "unit": "pieces", "purchase_price": 8,   "supplier": "CoffeeCo"},
        {"name": "Floor Cleaner",      "category": "CLEANING",    "current_quantity": 50,  "minimum_quantity": 20,  "unit": "liters", "purchase_price": 120, "supplier": "CleanMart"},
        {"name": "Toilet Cleaner",     "category": "CLEANING",    "current_quantity": 40,  "minimum_quantity": 15,  "unit": "liters", "purchase_price": 90,  "supplier": "CleanMart"},
        {"name": "Glass Cleaner",      "category": "CLEANING",    "current_quantity": 5,   "minimum_quantity": 10,  "unit": "liters", "purchase_price": 80,  "supplier": "CleanMart"},
        {"name": "Light Bulbs",        "category": "MAINTENANCE", "current_quantity": 100, "minimum_quantity": 30,  "unit": "pieces", "purchase_price": 60,  "supplier": "ElectroMart"},
        {"name": "AC Filters",         "category": "MAINTENANCE", "current_quantity": 20,  "minimum_quantity": 10,  "unit": "pieces", "purchase_price": 500, "supplier": "CoolTech"},
        {"name": "Toilet Paper Rolls", "category": "TOILETRIES",  "current_quantity": 800, "minimum_quantity": 200, "unit": "rolls",  "purchase_price": 20,  "supplier": "HygienePro"},
    ]
    for item in inventory_data:
        if not db.query(InventoryItem).filter(InventoryItem.name == item["name"]).first():
            db.add(InventoryItem(**item))
    db.commit()
    print("  Inventory: 15 items seeded")

    # ── 7. Coupons ────────────────────────────────────────────────────────────
    for c in [
        {"code": "WELCOME10", "discount_type": "PERCENTAGE", "discount_value": 10, "min_booking_amount": 2000, "max_discount": 500,  "expiry_date": date(2026, 12, 31), "usage_limit": 100},
        {"code": "SAVE500",   "discount_type": "FIXED",      "discount_value": 500,"min_booking_amount": 5000, "max_discount": 500,  "expiry_date": date(2026, 12, 31), "usage_limit": 50},
        {"code": "SUMMER20",  "discount_type": "PERCENTAGE", "discount_value": 20, "min_booking_amount": 3000, "max_discount": 1000, "expiry_date": date(2026, 12, 31), "usage_limit": 30},
        {"code": "AURA10",    "discount_type": "PERCENTAGE", "discount_value": 10, "min_booking_amount": 1000, "max_discount": 300,  "expiry_date": date(2026, 12, 31), "usage_limit": 200},
        {"code": "SAVE10",    "discount_type": "PERCENTAGE", "discount_value": 10, "min_booking_amount": 1000, "max_discount": 300,  "expiry_date": date(2026, 12, 31), "usage_limit": 200},
    ]:
        if not db.query(Coupon).filter(Coupon.code == c["code"]).first():
            db.add(Coupon(**c))
    db.commit()
    print("  Coupons: 5 seeded")

    print("\nSeed completed!")
    print("\nDemo Accounts:")
    print("  Admin:        admin@smarthotel.com        / Admin@123")
    print("  Manager:      manager@smarthotel.com      / Staff@123")
    print("  Receptionist: receptionist@smarthotel.com / Staff@123")
    print("  Housekeeping: housekeeping@smarthotel.com / Staff@123")
    print("  Maintenance:  maintenance@smarthotel.com  / Staff@123")
    print("  Restaurant:   restaurant@smarthotel.com   / Staff@123")
    print("  Guest 1-10:   guest1@example.com ...      / Guest@123")


if __name__ == "__main__":
    seed()
    db.close()
