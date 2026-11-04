from fastapi import APIRouter
from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.rooms import router as rooms_router
from app.api.routes.bookings import router as bookings_router
from app.api.routes.operations import router as operations_router
from app.api.routes.ai import router as ai_router
from app.api.routes.feedback import router as feedback_router
from app.api.routes.payments import router as payments_router

api_router = APIRouter()
api_router.include_router(health_router, prefix="/health", tags=["Health & Diagnostics"])
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication & User Management"])
api_router.include_router(rooms_router, prefix="/rooms", tags=["Rooms & Suites Management"])
api_router.include_router(bookings_router, prefix="/bookings", tags=["Bookings & Reservations"])
api_router.include_router(payments_router, prefix="/payments", tags=["Razorpay Payments & Refunds"])
api_router.include_router(operations_router, prefix="/operations", tags=["Hotel Operations & Dashboards"])
api_router.include_router(ai_router, prefix="/ai", tags=["AI & Machine Learning Decision Support"])
api_router.include_router(feedback_router, prefix="/feedback", tags=["Guest Feedback, Complaints & Notifications"])

__all__ = ["api_router"]


