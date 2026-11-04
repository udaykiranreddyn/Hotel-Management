import hmac
import hashlib
import logging
from typing import Dict, Any, Optional
import razorpay
from razorpay.errors import SignatureVerificationError, BadRequestError, GatewayError
from app.core.config import settings

logger = logging.getLogger("razorpay_service")


class RazorpayService:
    """
    Encapsulates all direct communication with the Razorpay Payment Gateway:
    Orders API, Payment Verification, Refunds, and Webhook Signatures.
    """

    def __init__(self):
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        self.webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
        self.currency = settings.RAZORPAY_CURRENCY

        # Initialize official Razorpay Client
        try:
            self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
            self.client.set_app_details({"title": settings.PROJECT_NAME, "version": settings.VERSION})
        except Exception as e:
            logger.error(f"Failed to initialize Razorpay client: {e}")
            self.client = None

    def create_order(
        self,
        amount: float,
        receipt: str,
        notes: Optional[Dict[str, Any]] = None,
        currency: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Creates a Razorpay Order.
        Amount must be provided in standard currency units (e.g. INR); it is converted
        to the smallest unit (paise) for the Razorpay API.
        """
        if not self.client:
            raise RuntimeError("Razorpay client is not initialized")

        amount_paise = int(round(amount * 100))
        order_currency = currency or self.currency

        data = {
            "amount": amount_paise,
            "currency": order_currency,
            "receipt": receipt[:40],  # Razorpay receipt max 40 chars
            "notes": notes or {},
            "payment_capture": 1,  # Auto-capture payment upon authorization
        }

        try:
            order = self.client.order.create(data=data)
            logger.info(f"Razorpay order created successfully: {order.get('id')}")
            return order
        except Exception as e:
            logger.error(f"Razorpay order creation failed: {e}")
            raise

    def verify_payment_signature(
        self,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str,
    ) -> bool:
        """
        Verifies the HMAC-SHA256 signature returned by Razorpay Checkout.
        Tries the official SDK utility, with HMAC-SHA256 calculation fallback.
        """
        if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
            return False

        # 1. Try official SDK verification
        try:
            params_dict = {
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            }
            self.client.utility.verify_payment_signature(params_dict)
            return True
        except (SignatureVerificationError, Exception) as sdk_err:
            logger.warning(f"Razorpay SDK signature verify check: {sdk_err}. Checking via direct HMAC...")

        # 2. Direct HMAC-SHA256 calculation
        try:
            body = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
            generated_signature = hmac.new(
                self.key_secret.encode("utf-8"),
                body,
                hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(generated_signature, razorpay_signature)
        except Exception as e:
            logger.error(f"Error computing HMAC signature: {e}")
            return False

    def verify_webhook_signature(
        self,
        raw_body: bytes,
        signature: str,
        secret: Optional[str] = None,
    ) -> bool:
        """
        Verifies the Razorpay Webhook signature sent in X-Razorpay-Signature header.
        Uses HMAC-SHA256 over the raw request body bytes.
        """
        webhook_sec = secret or self.webhook_secret
        if not webhook_sec or not signature or not raw_body:
            return False

        try:
            # 1. Direct HMAC-SHA256 over raw request bytes
            generated_signature = hmac.new(
                webhook_sec.encode("utf-8"),
                raw_body,
                hashlib.sha256
            ).hexdigest()
            if hmac.compare_digest(generated_signature, signature):
                return True
        except Exception as e:
            logger.error(f"HMAC webhook verification failed: {e}")

        # 2. SDK fallback
        try:
            self.client.utility.verify_webhook_signature(raw_body.decode("utf-8"), signature, webhook_sec)
            return True
        except Exception:
            return False

    def fetch_payment(self, razorpay_payment_id: str) -> Dict[str, Any]:
        """Fetch live payment entity from Razorpay."""
        if not self.client:
            raise RuntimeError("Razorpay client is not initialized")
        try:
            return self.client.payment.fetch(razorpay_payment_id)
        except Exception as e:
            logger.error(f"Failed to fetch payment {razorpay_payment_id}: {e}")
            raise

    def fetch_order(self, razorpay_order_id: str) -> Dict[str, Any]:
        """Fetch live order entity from Razorpay."""
        if not self.client:
            raise RuntimeError("Razorpay client is not initialized")
        try:
            return self.client.order.fetch(razorpay_order_id)
        except Exception as e:
            logger.error(f"Failed to fetch order {razorpay_order_id}: {e}")
            raise

    def refund_payment(
        self,
        razorpay_payment_id: str,
        amount: Optional[float] = None,
        notes: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Initiates a full or partial refund via Razorpay Refund API.
        If amount is not specified, Razorpay processes a full refund.
        """
        if not self.client:
            raise RuntimeError("Razorpay client is not initialized")

        data: Dict[str, Any] = {}
        if amount is not None and amount > 0:
            data["amount"] = int(round(amount * 100))
        if notes:
            data["notes"] = notes

        try:
            refund = self.client.payment.refund(razorpay_payment_id, data)
            logger.info(f"Razorpay refund created successfully: {refund.get('id')}")
            return refund
        except Exception as e:
            logger.error(f"Razorpay refund failed for payment {razorpay_payment_id}: {e}")
            raise


razorpay_service = RazorpayService()
