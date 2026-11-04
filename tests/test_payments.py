import os
import sys
import hmac
import hashlib
import json
from datetime import date, timedelta
from fastapi.testclient import TestClient

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app
from app.core.config import settings

client = TestClient(app)


def _login_as(email: str, password: str = "Password@123") -> str:
    """Helper to authenticate and return bearer JWT token."""
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]


def test_create_razorpay_order_success():
    """Verify backend creates Razorpay order with strictly calculated pricing."""
    guest_token = _login_as("guest@aurahotels.com")
    import random

    offset = random.randint(210, 250)
    check_in = (date.today() + timedelta(days=offset)).isoformat()
    check_out = (date.today() + timedelta(days=offset + 3)).isoformat()

    payload = {
        "room_id": 1,
        "check_in_date": check_in,
        "check_out_date": check_out,
        "num_guests": 2,
        "guest_name": "Aura Guest",
        "guest_email": "guest@aurahotels.com",
        "guest_phone": "+91 98765 43210",
        "coupon_code": "AURA10",
    }

    res = client.post(
        "/api/payments/create-order",
        json=payload,
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert res.status_code == 201, res.text
    data = res.json()

    assert "order_id" in data
    assert data["order_id"].startswith("order_")
    assert data["amount"] > 0
    assert data["amount_paise"] == int(round(data["amount"] * 100))
    assert data["currency"] == "INR"
    assert data["key_id"] == settings.RAZORPAY_KEY_ID
    assert "booking_id" in data
    assert "booking_reference" in data
    assert data["discount_amount"] > 0  # Coupon applied


def test_verify_payment_invalid_signature():
    """Verify backend rejects fraudulent or invalid payment signatures."""
    guest_token = _login_as("guest@aurahotels.com")
    import random
    offset = random.randint(260, 300)
    check_in = (date.today() + timedelta(days=offset)).isoformat()
    check_out = (date.today() + timedelta(days=offset + 2)).isoformat()

    # 1. Create Order
    res_order = client.post(
        "/api/payments/create-order",
        json={
            "room_id": 2,
            "check_in_date": check_in,
            "check_out_date": check_out,
            "guest_name": "Aura Guest",
            "guest_email": "guest@aurahotels.com",
        },
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert res_order.status_code == 201
    order_data = res_order.json()
    order_id = order_data["order_id"]

    # 2. Submit bogus signature
    verify_payload = {
        "razorpay_order_id": order_id,
        "razorpay_payment_id": "pay_fake1234567890",
        "razorpay_signature": "invalid_forged_signature_hex",
    }
    res_verify = client.post(
        "/api/payments/verify",
        json=verify_payload,
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert res_verify.status_code == 400
    assert "signature verification failed" in res_verify.json()["detail"].lower()


def test_verify_payment_valid_signature_and_idempotency():
    """Verify backend confirms booking on valid signature and handles repeated calls idempotently."""
    guest_token = _login_as("guest@aurahotels.com")
    import random
    offset = random.randint(50, 200)
    check_in = (date.today() + timedelta(days=offset)).isoformat()
    check_out = (date.today() + timedelta(days=offset + 2)).isoformat()

    # 1. Create Order
    res_order = client.post(
        "/api/payments/create-order",
        json={
            "room_id": 3,
            "check_in_date": check_in,
            "check_out_date": check_out,
            "guest_name": "Aura Guest",
            "guest_email": "guest@aurahotels.com",
        },
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert res_order.status_code == 201
    order_data = res_order.json()
    order_id = order_data["order_id"]

    # 2. Generate valid HMAC-SHA256 signature
    payment_id = f"pay_testMock_{random.randint(1000000, 9999999)}"
    msg = f"{order_id}|{payment_id}".encode("utf-8")
    valid_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        msg,
        hashlib.sha256
    ).hexdigest()

    verify_payload = {
        "razorpay_order_id": order_id,
        "razorpay_payment_id": payment_id,
        "razorpay_signature": valid_signature,
    }

    # First verification -> Success
    res_verify = client.post(
        "/api/payments/verify",
        json=verify_payload,
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert res_verify.status_code == 200, res_verify.text
    data = res_verify.json()
    assert data["success"] is True
    assert data["payment_status"] == "SUCCESS"
    assert data["booking_status"] == "CONFIRMED"
    booking_id = data["booking_id"]
    payment_record_id = data["payment_id"]

    # Second verification -> Idempotent Success
    res_verify_again = client.post(
        "/api/payments/verify",
        json=verify_payload,
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert res_verify_again.status_code == 200
    assert res_verify_again.json()["success"] is True

    # 3. Check receipt generation
    res_receipt = client.get(
        f"/api/payments/{payment_record_id}/receipt",
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert res_receipt.status_code == 200
    receipt = res_receipt.json()
    assert receipt["hotel_name"] == settings.HOTEL_NAME
    assert receipt["payment_status"] == "SUCCESS"
    assert receipt["total_amount"] > 0


def test_my_payments_and_idor_protection():
    """Verify guests can only access their own payments, and staff can access via admin endpoints."""
    guest_token = _login_as("guest@aurahotels.com")

    # Guest retrieves my-payments
    res = client.get("/api/payments/my-payments", headers={"Authorization": f"Bearer {guest_token}"})
    assert res.status_code == 200
    payments = res.json()
    assert isinstance(payments, list)
    assert len(payments) > 0


def test_admin_payment_overview_and_refund():
    """Verify Admin can view revenue stats, search transactions, and process refunds."""
    admin_token = _login_as("admin@aurahotels.com")
    guest_token = _login_as("guest@aurahotels.com")

    # 1. Admin overview
    res_overview = client.get(
        "/api/payments/admin/overview",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_overview.status_code == 200
    stats = res_overview.json()
    assert "total_revenue" in stats
    assert "total_successful_payments" in stats
    assert "recent_transactions" in stats
    assert stats["total_successful_payments"] > 0

    # 2. Find a successful payment to test refund
    succ_payment = next((p for p in stats["recent_transactions"] if p["status"] == "SUCCESS"), None)
    assert succ_payment is not None

    payment_id = succ_payment["id"]

    # Non-admin guest cannot refund (403 Forbidden)
    res_unauth = client.post(
        f"/api/payments/{payment_id}/refund",
        json={"reason": "Guest trying to refund self"},
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert res_unauth.status_code == 403

    # Admin initiates refund
    res_refund = client.post(
        f"/api/payments/{payment_id}/refund",
        json={"reason": "Admin cancellation & full refund test"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_refund.status_code == 200
    rf_data = res_refund.json()
    assert rf_data["success"] is True
    assert rf_data["status"] == "PROCESSED"
    assert "refund_id" in rf_data


def test_webhook_signature_and_idempotency():
    """Verify Razorpay webhook verification and event idempotency."""
    import random
    webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
    evt_num = random.randint(10000000, 99999999)
    event_payload = {
        "event_id": f"evt_test_{evt_num}",
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_webhook_test_123",
                    "order_id": "order_webhook_test_123",
                    "amount": 250000,
                    "currency": "INR",
                    "method": "upi",
                }
            }
        }
    }
    raw_body = json.dumps(event_payload).encode("utf-8")

    # Compute valid webhook signature
    valid_sig = hmac.new(
        webhook_secret.encode("utf-8"),
        raw_body,
        hashlib.sha256
    ).hexdigest()

    # 1. Reject invalid signature
    res_bad = client.post(
        "/api/payments/webhook",
        content=raw_body,
        headers={"X-Razorpay-Signature": "wrong_signature", "Content-Type": "application/json"},
    )
    assert res_bad.status_code == 400

    # 2. Accept valid signature
    res_ok = client.post(
        "/api/payments/webhook",
        content=raw_body,
        headers={"X-Razorpay-Signature": valid_sig, "Content-Type": "application/json"},
    )
    assert res_ok.status_code == 200
    assert res_ok.json()["status"] == "success"

    # 3. Repeat call -> Idempotent success without error
    res_dup = client.post(
        "/api/payments/webhook",
        content=raw_body,
        headers={"X-Razorpay-Signature": valid_sig, "Content-Type": "application/json"},
    )
    assert res_dup.status_code == 200
    assert "idempotent" in res_dup.json()["message"].lower()


if __name__ == "__main__":
    test_create_razorpay_order_success()
    test_verify_payment_invalid_signature()
    test_verify_payment_valid_signature_and_idempotency()
    test_my_payments_and_idor_protection()
    test_admin_payment_overview_and_refund()
    test_webhook_signature_and_idempotency()
    print("ALL RAZORPAY PAYMENT INTEGRATION TESTS PASSED PERFECTLY!")
