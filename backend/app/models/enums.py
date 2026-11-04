import enum


class UserRole(str, enum.Enum):
    GUEST = "GUEST"
    RECEPTIONIST = "RECEPTIONIST"
    HOUSEKEEPING = "HOUSEKEEPING"
    MAINTENANCE = "MAINTENANCE"
    RESTAURANT_LAUNDRY = "RESTAURANT_LAUNDRY"
    ADMIN = "ADMIN"


class RoomStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    BOOKED = "BOOKED"
    OCCUPIED = "OCCUPIED"
    CLEANING = "CLEANING"
    INSPECTION = "INSPECTION"
    MAINTENANCE = "MAINTENANCE"


class RoomTypeCategory(str, enum.Enum):
    STANDARD = "Standard"
    DELUXE = "Deluxe"
    PREMIUM = "Premium"
    SUITE = "Suite"


class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    PENDING_PAYMENT = "PENDING_PAYMENT"
    CONFIRMED = "CONFIRMED"
    CHECKED_IN = "CHECKED_IN"
    CHECKED_OUT = "CHECKED_OUT"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class PaymentMethod(str, enum.Enum):
    UPI = "UPI"
    CARD = "CARD"
    NETBANKING = "NETBANKING"
    WALLET = "WALLET"
    CASH = "CASH"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"
    PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED"


class ServiceRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class RestaurantOrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    PREPARING = "PREPARING"
    READY = "READY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class LaundryStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    PICKED_UP = "PICKED_UP"
    PROCESSING = "PROCESSING"
    READY = "READY"
    DELIVERED = "DELIVERED"


class HousekeepingStatus(str, enum.Enum):
    ASSIGNED = "ASSIGNED"
    CLEANING = "CLEANING"
    COMPLETED = "COMPLETED"
    INSPECTION = "INSPECTION"
    READY = "READY"


class MaintenanceStatus(str, enum.Enum):
    OPEN = "OPEN"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class PriorityLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class ComplaintCategory(str, enum.Enum):
    ROOM = "ROOM"
    CLEANLINESS = "CLEANLINESS"
    MAINTENANCE = "MAINTENANCE"
    STAFF = "STAFF"
    FOOD = "FOOD"
    SERVICE = "SERVICE"
    OTHER = "OTHER"


class ComplaintStatus(str, enum.Enum):
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class NotificationChannel(str, enum.Enum):
    IN_SYSTEM = "IN_SYSTEM"
    EMAIL = "EMAIL"
    BROWSER = "BROWSER"


class NotificationStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    SENT = "SENT"
    FAILED = "FAILED"
    READ = "READ"
    PENDING = "PENDING"


class SentimentType(str, enum.Enum):
    POSITIVE = "POSITIVE"
    NEUTRAL = "NEUTRAL"
    NEGATIVE = "NEGATIVE"
