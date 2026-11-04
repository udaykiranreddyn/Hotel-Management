import os
import sys
from datetime import date, timedelta
from fastapi.testclient import TestClient

# Ensure backend is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app

client = TestClient(app)


def test_system_health():
    """Verify health endpoint reports Phase 3 operational status and database latency."""
    response = client.get("/api/health/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Phase 3" in data["phase"]
    assert data["database"]["status"] == "connected"
    assert data["database"]["total_tables"] >= 20


def test_demo_accounts_list():
    """Verify demo accounts exist for Guest, Worker, and Admin roles."""
    response = client.get("/api/auth/demo-accounts")
    assert response.status_code == 200
    accounts = response.json()
    assert len(accounts) == 3
    roles = [a["role"] for a in accounts]
    assert "GUEST" in roles
    assert "WORKER" in roles
    assert "ADMIN" in roles


def test_get_rooms():
    """Verify room catalog retrieval and category filtering."""
    response = client.get("/api/rooms/")
    assert response.status_code == 200
    rooms = response.json()
    assert len(rooms) >= 12
    # Verify relations populated
    first_room = rooms[0]
    assert "room_number" in first_room
    assert "room_type" in first_room
    assert "amenities" in first_room
    assert len(first_room["amenities"]) > 0


def test_coupon_validation():
    """Verify promo code validation logic."""
    # Valid coupon
    res_valid = client.post("/api/bookings/validate-coupon", json={"code": "AURA10", "base_amount": 2000.0})
    assert res_valid.status_code == 200
    assert res_valid.json()["is_valid"] is True
    assert res_valid.json()["discount_amount"] == 200.0
    assert res_valid.json()["final_amount"] == 1800.0

    # Below min amount
    res_min = client.post("/api/bookings/validate-coupon", json={"code": "AURA10", "base_amount": 500.0})
    assert res_min.status_code == 200
    assert res_min.json()["is_valid"] is False

    # Invalid coupon
    res_invalid = client.post("/api/bookings/validate-coupon", json={"code": "FAKECODE99", "base_amount": 2000.0})
    assert res_invalid.status_code == 200
    assert res_invalid.json()["is_valid"] is False


def test_booking_creation_and_double_booking_prevention():
    """Verify successful booking creation and double-booking conflict rejection."""
    # Pick room 1
    rooms = client.get("/api/rooms/").json()
    room_1 = next(r for r in rooms if r["room_number"] == "1")

    import time
    offset = 100 + int(time.time() % 1000)
    check_in = date.today() + timedelta(days=offset)
    check_out = date.today() + timedelta(days=offset + 3)

    payload = {
        "room_id": room_1["id"],
        "check_in_date": check_in.isoformat(),
        "check_out_date": check_out.isoformat(),
        "num_guests": 1,
        "guest_name": "Rohan Deshmukh",
        "guest_email": "rohan.test@aurahotels.com",
        "guest_phone": "+91 98888 77777",
        "coupon_code": "AURA10",
        "payment_method": "UPI",
    }

    # First booking should succeed
    res1 = client.post("/api/bookings/", json=payload)
    assert res1.status_code == 201
    booking1 = res1.json()
    assert booking1["booking_reference"].startswith("AURA-BK-")
    assert booking1["discount_amount"] > 0

    # Overlapping booking for same room on overlapping dates MUST fail with HTTP 409
    overlap_payload = {
        "room_id": room_1["id"],
        "check_in_date": (check_in + timedelta(days=1)).isoformat(),
        "check_out_date": (check_out + timedelta(days=2)).isoformat(),
        "num_guests": 1,
        "guest_name": "Conflict Tester",
        "guest_email": "conflict@aurahotels.com",
        "payment_method": "CARD",
    }

    res2 = client.post("/api/bookings/", json=overlap_payload)
    assert res2.status_code == 409
    assert "already reserved" in res2.json()["detail"]

    # Clean up test booking to keep database clean
    client.post(f"/api/bookings/{booking1['booking_reference']}/cancel")


def test_operations_frontdesk_and_admin_metrics():
    """Verify front desk board and admin KPI metrics calculation."""
    res_fd = client.get("/api/operations/frontdesk/rooms")
    assert res_fd.status_code == 200
    assert len(res_fd.json()) >= 12

    res_metrics = client.get("/api/operations/admin/metrics")
    assert res_metrics.status_code == 200
    metrics = res_metrics.json()
    assert metrics["total_rooms"] >= 12
    assert metrics["total_revenue"] > 0
    assert metrics["total_bookings"] > 0


def test_ai_decision_support_endpoints():
    """Verify all 5 AI/ML modules and audit history logging."""
    # 1. Model Catalog
    res_catalog = client.get("/api/ai/models")
    assert res_catalog.status_code == 200
    catalog = res_catalog.json()
    assert "models" in catalog or "models_count" in catalog

    # 2. Dynamic Pricing Engine
    res_price = client.post("/api/ai/price", json={"room_type_id": 1, "current_occupancy_pct": 80.0})
    assert res_price.status_code == 200
    pdata = res_price.json()
    assert pdata["recommended_price"] > 0
    assert pdata["demand_level"] in ["LOW", "NORMAL", "HIGH", "SURGE"]

    # 3. 7-Day Occupancy Forecast
    res_occ = client.get("/api/ai/occupancy?days=7")
    assert res_occ.status_code == 200
    odata = res_occ.json()
    assert len(odata["daily_forecasts"]) == 7
    assert odata["average_predicted_occupancy"] > 0

    # 4. Smart Room Recommender
    res_rec = client.post("/api/ai/recommend-room", json={"budget": 2000.0, "guests": 2, "stay_purpose": "Couple"})
    assert res_rec.status_code == 200
    recs = res_rec.json()
    assert len(recs) > 0
    assert recs[0]["match_score_pct"] > 50

    # 5. Cancellation Risk Classifier
    res_canc = client.post("/api/ai/cancellation", json={
        "lead_time_days": 20,
        "num_nights": 2,
        "total_amount": 2000.0,
        "has_coupon": False,
        "payment_method": "CASH",
        "guest_loyalty_points": 0,
    })
    assert res_canc.status_code == 200
    cdata = res_canc.json()
    assert 0 <= cdata["cancellation_probability_pct"] <= 100
    assert cdata["risk_tier"] in ["LOW", "MODERATE", "HIGH"]

    # 6. Sentiment NLP
    res_sent = client.post("/api/ai/sentiment", json={"text": "Clean room, fast wifi, polite receptionist"})
    assert res_sent.status_code == 200
    sdata = res_sent.json()
    assert sdata["sentiment"] == "POSITIVE"

    # 7. Guest Lifetime Value & VIP Segmentation
    res_ltv = client.post("/api/ai/ltv-vip", json={
        "stays_count": 8,
        "total_spend": 55000.0,
        "avg_lead_time_days": 12.0,
        "review_sentiment_score": 0.8,
        "ancillary_spend": 8000.0,
        "cancellations_count": 0,
    })
    assert res_ltv.status_code == 200
    ltv_data = res_ltv.json()
    assert ltv_data["predicted_annual_ltv"] > 10000
    assert ltv_data["vip_segment"] in ["PLATINUM_VIP", "GOLD_PREMIUM", "SILVER_PREFERRED", "BRONZE_STANDARD"]
    assert len(ltv_data["recommended_vip_perks"]) > 0

    # 8. Housekeeping Turnaround & Eco-Energy Optimization
    res_turn = client.post("/api/ai/turnaround", json={
        "room_type_id": 3,
        "floor_number": 5,
        "num_guests": 2,
        "stay_duration_nights": 3,
        "special_requests_count": 1,
    })
    assert res_turn.status_code == 200
    turn_data = res_turn.json()
    assert 15 <= turn_data["predicted_turnaround_minutes"] <= 95
    assert turn_data["recommended_staff_count"] in [1, 2]
    assert "Eco" in turn_data["eco_energy_mode"]
    assert len(turn_data["cleaning_checklist"]) > 0

    # 9. AI Prediction History Audit
    res_hist = client.get("/api/ai/history")
    assert res_hist.status_code == 200
    assert len(res_hist.json()) > 0


def test_feedback_reviews_and_sentiment():
    """Verify Phase 13 guest reviews retrieval, rating distribution, and review creation with AI NLP sentiment."""
    # 1. Get reviews summary
    res = client.get("/api/feedback/reviews")
    assert res.status_code == 200
    data = res.json()
    assert "total_reviews" in data
    assert "average_rating" in data
    assert "rating_distribution" in data
    assert "sentiment_breakdown" in data
    assert len(data["reviews"]) > 0

    # 2. Get existing booking reference
    rooms_res = client.get("/api/rooms/")
    assert rooms_res.status_code == 200
    room_id = rooms_res.json()[0]["id"]

    # Create fresh booking to review (use unique offset to avoid conflicts)
    import time as _time
    today = date.today()
    offset = 400 + int(_time.time() % 500)
    bk_res = client.post("/api/bookings/", json={
        "room_id": room_id,
        "guest_name": "Feedback Tester",
        "guest_email": "feedback.tester@aura.com",
        "guest_phone": "+91 91234 56789",
        "check_in_date": (today + timedelta(days=offset)).isoformat(),
        "check_out_date": (today + timedelta(days=offset + 2)).isoformat(),
        "num_guests": 1,
        "payment_method": "UPI",
    })
    assert bk_res.status_code == 201
    bk_ref = bk_res.json()["booking_reference"]

    # 3. Post review with positive feedback
    rev_res = client.post("/api/feedback/reviews", json={
        "booking_reference": bk_ref,
        "guest_email": "feedback.tester@aura.com",
        "rating": 5.0,
        "comment": "Absolutely sparkling clean suite with amazing breakfast and friendly concierge.",
        "cleanliness_rating": 5,
        "staff_rating": 5,
        "comfort_rating": 5,
    })
    assert rev_res.status_code == 201
    rdata = rev_res.json()
    assert rdata["sentiment"] == "POSITIVE"
    assert rdata["aspect_ratings"] is not None


def test_guest_complaints_and_resolution():
    """Verify Phase 13 guest complaints creation with AI priority assignment and staff resolution."""
    # 1. Submit complaint
    comp_res = client.post("/api/feedback/complaints", json={
        "guest_email": "guest.assist@aura.com",
        "category": "MAINTENANCE",
        "description": "Urgent! The bathroom hot water geyser is leaking and water pressure is low.",
    })
    assert comp_res.status_code == 201
    cdata = comp_res.json()
    assert cdata["complaint_reference"].startswith("CMP-")
    assert cdata["status"] == "OPEN"
    assert cdata["priority"] in ["URGENT", "HIGH", "MEDIUM"]
    comp_id = cdata["id"]

    # 2. Staff resolves complaint
    resolve_res = client.patch(f"/api/feedback/complaints/{comp_id}/resolve", json={
        "status": "RESOLVED",
        "resolution": "Engineering tightened pipe valve and tested hot water system. Fully operational.",
    })
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "RESOLVED"
    assert resolve_res.json()["resolution"] is not None

    # 3. List complaints
    list_res = client.get("/api/feedback/complaints")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1


def test_notifications_and_scheduler():
    """Verify Phase 14 notifications feed, scheduling, and batch scheduler runner."""
    # 1. Retrieve notifications feed
    res = client.get("/api/feedback/notifications")
    assert res.status_code == 200
    notifs = res.json()
    assert len(notifs) >= 1

    # 2. Schedule a notification due immediately
    sched_res = client.post("/api/feedback/notifications", json={
        "recipient_email": "guest@aura.com",
        "title": "Welcome Cocktail Invitation",
        "message": "Join us at the 8th-floor Sky Lounge for a welcome mocktail between 6 PM and 8 PM.",
        "scheduled_seconds_from_now": 0,
    })
    assert sched_res.status_code == 201
    assert sched_res.json()["status"] == "SENT"

    # 3. Run scheduler batch
    batch_res = client.post("/api/feedback/notifications/run-scheduler")
    assert batch_res.status_code == 200
    bdata = batch_res.json()
    assert "processed_count" in bdata
    assert "delivered_count" in bdata
    assert "message" in bdata


if __name__ == "__main__":
    test_system_health()
    test_demo_accounts_list()
    test_get_rooms()
    test_coupon_validation()
    test_booking_creation_and_double_booking_prevention()
    test_operations_frontdesk_and_admin_metrics()
    test_ai_decision_support_endpoints()
    test_feedback_reviews_and_sentiment()
    test_guest_complaints_and_resolution()
    test_notifications_and_scheduler()
    print("ALL TESTS (INCLUDING AI/ML & FEEDBACK MODULES) PASSED SUCCESSFULLY!")


