"""
Migration script: Safely add Razorpay Payment columns, refund fields,
and WebhookEvent table to the SQLite database without losing existing data.
"""
import os
import sqlite3

def run_migration():
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "hotel.db"))
    if not os.path.exists(db_path):
        print(f"[MIGRATE] Database not found at {db_path}. It will be auto-created on startup.")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    print(f"[MIGRATE] Running Razorpay migration on {db_path}...")

    # 1. Update bookings table
    cur.execute("PRAGMA table_info(bookings)")
    booking_cols = [c[1] for c in cur.fetchall()]
    if "payment_status" not in booking_cols:
        print("[MIGRATE] Adding 'payment_status' column to 'bookings' table...")
        cur.execute("ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(20) DEFAULT 'PENDING'")
        # Existing confirmed bookings have payment SUCCESS
        cur.execute("UPDATE bookings SET payment_status = 'SUCCESS' WHERE booking_status = 'CONFIRMED'")

    # 2. Update payments table
    cur.execute("PRAGMA table_info(payments)")
    payment_cols = [c[1] for c in cur.fetchall()]

    new_payment_cols = [
        ("user_id", "INTEGER REFERENCES users(id) ON DELETE SET NULL"),
        ("razorpay_order_id", "VARCHAR(100)"),
        ("razorpay_payment_id", "VARCHAR(100)"),
        ("razorpay_signature", "VARCHAR(255)"),
        ("currency", "VARCHAR(10) DEFAULT 'INR'"),
        ("payment_method", "VARCHAR(50)"),
        ("transaction_reference", "VARCHAR(100)"),
        ("error_code", "VARCHAR(100)"),
        ("error_description", "TEXT"),
    ]

    for col_name, col_type in new_payment_cols:
        if col_name not in payment_cols:
            print(f"[MIGRATE] Adding '{col_name}' column to 'payments' table...")
            cur.execute(f"ALTER TABLE payments ADD COLUMN {col_name} {col_type}")

    # Set transaction_reference = transaction_id where empty
    cur.execute("UPDATE payments SET transaction_reference = transaction_id WHERE transaction_reference IS NULL AND transaction_id IS NOT NULL")
    cur.execute("UPDATE payments SET currency = 'INR' WHERE currency IS NULL")

    # Associate existing payments with user_id through bookings
    cur.execute("""
        UPDATE payments
        SET user_id = (
            SELECT g.id FROM bookings b 
            JOIN guests g ON b.guest_id = g.id 
            WHERE b.id = payments.booking_id
        )
        WHERE user_id IS NULL
    """)

    # 3. Update refunds table
    cur.execute("PRAGMA table_info(refunds)")
    refund_cols = [c[1] for c in cur.fetchall()]
    new_refund_cols = [
        ("razorpay_refund_id", "VARCHAR(100)"),
        ("currency", "VARCHAR(10) DEFAULT 'INR'"),
    ]
    for col_name, col_type in new_refund_cols:
        if col_name not in refund_cols:
            print(f"[MIGRATE] Adding '{col_name}' column to 'refunds' table...")
            cur.execute(f"ALTER TABLE refunds ADD COLUMN {col_name} {col_type}")

    # 4. Create webhook_events table if not exists
    cur.execute("""
        CREATE TABLE IF NOT EXISTS webhook_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id VARCHAR(100) UNIQUE NOT NULL,
            event_type VARCHAR(100) NOT NULL,
            entity_id VARCHAR(100),
            payload TEXT,
            status VARCHAR(50) DEFAULT 'PROCESSED' NOT NULL,
            processed_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
    """)

    # 5. Create index on webhook_events event_id
    cur.execute("CREATE INDEX IF NOT EXISTS ix_webhook_events_event_id ON webhook_events(event_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_payments_razorpay_order_id ON payments(razorpay_order_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_payments_razorpay_payment_id ON payments(razorpay_payment_id)")

    conn.commit()
    conn.close()
    print("[MIGRATE] Migration completed successfully!")

if __name__ == "__main__":
    run_migration()
